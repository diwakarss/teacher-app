import { NextRequest, NextResponse } from 'next/server';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { createBedrockClient } from '@/lib/bedrock-client';

const TITAN_MODEL_ID = 'amazon.titan-image-generator-v2:0';

const STYLE_PREFIX =
  'Simple, clean, educational illustration for a primary school test paper. White background. No text or labels in the image. ';

interface GenerateImageRequest {
  prompt: string;
  width?: number;
  height?: number;
}

interface GenerateImageResponse {
  success: boolean;
  base64Image?: string;
  error?: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<GenerateImageResponse>> {
  try {
    const body: GenerateImageRequest = await request.json();

    if (!body.prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 },
      );
    }

    const client = createBedrockClient();

    const width = body.width || 512;
    const height = body.height || 512;

    const command = new InvokeModelCommand({
      modelId: TITAN_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        taskType: 'TEXT_IMAGE',
        textToImageParams: {
          text: STYLE_PREFIX + body.prompt,
        },
        imageGenerationConfig: {
          numberOfImages: 1,
          width,
          height,
          cfgScale: 8.0,
        },
      }),
    });

    const response = await client.send(command);

    if (!response.body) {
      return NextResponse.json(
        { success: false, error: 'No response body from Titan' },
        { status: 500 },
      );
    }

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    if (!responseBody.images || responseBody.images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No image generated' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      base64Image: responseBody.images[0],
    });
  } catch (error) {
    console.error('Image generation error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
