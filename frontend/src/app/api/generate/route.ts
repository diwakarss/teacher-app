import { NextRequest, NextResponse } from 'next/server';
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { buildLessonPlanPrompt } from '@/lib/prompts/lesson-plan-prompt';
import { buildQuestionPaperPrompt } from '@/lib/prompts/question-paper-prompt';

// Support both API key (bearer token) and IAM credentials
// API key: Set AWS_BEARER_TOKEN_BEDROCK env var
// IAM: Set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY env vars
function createBedrockClient(): BedrockRuntimeClient {
  const region = process.env.AWS_REGION || 'us-east-1';

  // API key authentication (preferred, simpler)
  if (process.env.AWS_BEARER_TOKEN_BEDROCK) {
    return new BedrockRuntimeClient({
      region,
      token: { token: process.env.AWS_BEARER_TOKEN_BEDROCK },
    });
  }

  // Fall back to IAM credentials (auto-resolved from env)
  return new BedrockRuntimeClient({ region });
}

// Use inference profile ID (required for on-demand throughput)
// Claude 3.5 Haiku is faster and more capable than Claude 3 Haiku
const MODEL_ID = 'us.anthropic.claude-3-5-haiku-20241022-v1:0';

function buildFeedbackPrompt(req: FeedbackRequest): string {
  const toneInstructions = {
    encouraging: 'Use a warm, supportive, and encouraging tone. Focus on positives and frame areas for improvement constructively.',
    neutral: 'Use a balanced, factual tone. Present both achievements and areas for improvement objectively.',
    serious: 'Use a direct, action-focused tone. Be clear about concerns and specific about what needs to be done.',
  };

  const trendDescription: Record<string, string> = {
    improving: 'showing improvement',
    stable: 'maintaining consistent performance',
    declining: 'showing a decline in performance',
    unknown: '',
  };

  return `Generate a brief parent feedback message (2-3 sentences) for a student.

Student: ${req.studentName}
Subject: ${req.subjectName}
Assessment: ${req.assessmentName}
Score: ${req.marksObtained}/${req.maxMarks} (${req.percentage.toFixed(0)}%)
Grade: ${req.grade}
Class Average: ${req.classAverage.toFixed(0)}%
Performance: ${req.performanceLevel}${req.trend !== 'unknown' ? `, ${trendDescription[req.trend]}` : ''}

${toneInstructions[req.tone]}

Write the message as if addressing "Dear Parent" and sign off as "Class Teacher". Keep it concise and actionable. Do not use markdown formatting.`;
}

export type GenerationType = 'lesson_plan' | 'question_paper' | 'feedback';

export interface FeedbackRequest {
  type: 'feedback';
  studentName: string;
  subjectName: string;
  assessmentName: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  classAverage: number;
  performanceLevel: string;
  trend: string;
  tone: 'encouraging' | 'neutral' | 'serious';
}

export interface LessonPlanRequest {
  type: 'lesson_plan';
  chapterContent: string;
  chapterName: string;
  subjectName: string;
  duration: number;
  customObjectives?: string[];
}

export interface QuestionPaperRequest {
  type: 'question_paper';
  chaptersContent: { name: string; content: string }[];
  subjectName: string;
  totalMarks: number;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  template: 'unit_test' | 'monthly_test' | 'term_exam' | 'custom';
  sectionDistribution?: {
    sectionA: { count: number; marksEach: number };
    sectionB: { count: number; marksEach: number };
    sectionC: { count: number; marksEach: number };
  };
}

export type GenerateRequest = LessonPlanRequest | QuestionPaperRequest | FeedbackRequest;

export interface GenerateResponse {
  success: boolean;
  content?: string;
  error?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateResponse>> {
  try {
    const body: GenerateRequest = await request.json();

    // Validate credentials are configured (API key OR IAM)
    const hasApiKey = !!process.env.AWS_BEARER_TOKEN_BEDROCK;
    const hasIamCreds =
      !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;

    if (!hasApiKey && !hasIamCreds) {
      return NextResponse.json(
        {
          success: false,
          error:
            'AWS credentials not configured. Set AWS_BEARER_TOKEN_BEDROCK (API key) or AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (IAM).',
        },
        { status: 500 }
      );
    }

    const client = createBedrockClient();
    let prompt: string;

    if (body.type === 'feedback') {
      prompt = buildFeedbackPrompt(body);
    } else if (body.type === 'lesson_plan') {
      prompt = buildLessonPlanPrompt({
        chapterContent: body.chapterContent,
        chapterName: body.chapterName,
        subjectName: body.subjectName,
        duration: body.duration,
        customObjectives: body.customObjectives,
      });
    } else if (body.type === 'question_paper') {
      prompt = buildQuestionPaperPrompt({
        chaptersContent: body.chaptersContent,
        subjectName: body.subjectName,
        totalMarks: body.totalMarks,
        duration: body.duration,
        difficulty: body.difficulty,
        template: body.template,
        sectionDistribution: body.sectionDistribution,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid generation type' },
        { status: 400 }
      );
    }

    const command = new ConverseCommand({
      modelId: MODEL_ID,
      messages: [
        {
          role: 'user',
          content: [{ text: prompt }],
        },
      ],
      inferenceConfig: {
        maxTokens: 4096,
        temperature: 0.7,
      },
    });

    const response = await client.send(command);

    const content = response.output?.message?.content?.[0];
    if (!content || !('text' in content)) {
      return NextResponse.json(
        { success: false, error: 'No content in response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      content: content.text,
      tokensUsed: {
        input: response.usage?.inputTokens || 0,
        output: response.usage?.outputTokens || 0,
      },
    });
  } catch (error) {
    console.error('Generation error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
