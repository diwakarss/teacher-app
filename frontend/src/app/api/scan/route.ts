import { NextRequest, NextResponse } from 'next/server';
import { ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { createBedrockClient } from '@/lib/bedrock-client';

// Claude Sonnet 4.6 - latest model with vision support
const SCAN_MODEL_ID = 'us.anthropic.claude-sonnet-4-6';

export const maxDuration = 30;

interface ScanRequest {
  image: string; // raw base64 JPEG, no data: prefix
  pageNumber: number;
}

export interface PageExtraction {
  summary: string;
  text_content: string;
  visual_elements: string[];
  key_facts: string[];
  activities: string[];
  question_seeds: string[];
}

interface ScanResponse {
  success: boolean;
  data?: PageExtraction;
  pageNumber?: number;
  error?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

const SYSTEM_PROMPT = `You are an educational content extraction assistant. Analyze the provided image of a textbook or worksheet page and extract ALL content in structured JSON format.

Return a JSON object with these fields:
- "summary": A brief 1-2 sentence summary of what this page covers.
- "text_content": All readable text on the page, preserving paragraph structure.
- "visual_elements": An array of descriptions for any illustrations, diagrams, charts, maps, or images on the page. Describe each visual element in detail including labels and captions.
- "key_facts": An array of the most important facts, definitions, or concepts found on the page.
- "activities": An array of any exercises, questions, or activities found on the page.
- "question_seeds": An array of potential quiz/test questions that could be generated from this page's content. Include a mix of recall, comprehension, and application questions.

Return ONLY valid JSON. Do not include markdown code fences or any text outside the JSON object.`;

export async function POST(request: NextRequest): Promise<NextResponse<ScanResponse>> {
  try {
    const body: ScanRequest = await request.json();

    // Validate input
    if (!body.image || typeof body.image !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid "image" field. Expected raw base64 JPEG string.' },
        { status: 400 }
      );
    }

    if (body.pageNumber === undefined || typeof body.pageNumber !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid "pageNumber" field. Expected a number.' },
        { status: 400 }
      );
    }

    const client = createBedrockClient();

    const command = new ConverseCommand({
      modelId: SCAN_MODEL_ID,
      system: [{ text: SYSTEM_PROMPT }],
      messages: [
        {
          role: 'user',
          content: [
            {
              image: {
                format: 'jpeg',
                source: {
                  bytes: Buffer.from(body.image, 'base64'),
                },
              },
            },
            {
              text: `Extract all educational content from this page (page ${body.pageNumber}). Return structured JSON.`,
            },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 2048,
        temperature: 0.2,
      },
    });

    const response = await client.send(command);

    const content = response.output?.message?.content?.[0];
    if (!content || !('text' in content) || !content.text) {
      return NextResponse.json(
        { success: false, error: 'No content in response' },
        { status: 500 }
      );
    }

    let extraction: PageExtraction;

    try {
      // Strip markdown code fences if present (```json ... ```)
      let jsonText = content.text!;
      const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        jsonText = fenceMatch[1].trim();
      }
      extraction = JSON.parse(jsonText) as PageExtraction;
    } catch {
      // Fall back to wrapping raw text if JSON parsing fails
      extraction = {
        summary: `Content extracted from page ${body.pageNumber}`,
        text_content: content.text,
        visual_elements: [],
        key_facts: [],
        activities: [],
        question_seeds: [],
      };
    }

    return NextResponse.json({
      success: true,
      data: extraction,
      pageNumber: body.pageNumber,
      tokensUsed: {
        input: response.usage?.inputTokens || 0,
        output: response.usage?.outputTokens || 0,
      },
    });
  } catch (error) {
    console.error('Scan error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
