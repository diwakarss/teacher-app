export interface LessonPlanPromptInput {
  chapterContent: string;
  chapterName: string;
  subjectName: string;
  duration: number; // minutes
  customObjectives?: string[];
}

export interface LessonPlanSections {
  introduction: {
    duration: number;
    content: string;
    hook: string;
  };
  mainContent: {
    duration: number;
    topics: string[];
    teachingStrategies: string[];
  };
  activities: {
    duration: number;
    activities: Array<{
      name: string;
      description: string;
      materials?: string[];
    }>;
  };
  assessment: {
    duration: number;
    methods: string[];
    questions: string[];
  };
  differentiation: {
    advanced: string[];
    struggling: string[];
  };
}

export interface LessonPlanOutput {
  name: string;
  objectives: string[];
  sections: LessonPlanSections;
  materials: string[];
}

export function buildLessonPlanPrompt(input: LessonPlanPromptInput): string {
  const objectivesSection = input.customObjectives?.length
    ? `Use these learning objectives:\n${input.customObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}`
    : 'Extract 3-5 key learning objectives from the content.';

  return `You are an experienced IGCSE curriculum teacher. Generate a structured lesson plan based on the following chapter content.

## Chapter Information
- **Subject**: ${input.subjectName}
- **Chapter**: ${input.chapterName}
- **Duration**: ${input.duration} minutes

## Chapter Content
${input.chapterContent.slice(0, 50000)}

## Instructions
${objectivesSection}

Create a detailed lesson plan with the following structure. Return ONLY valid JSON, no markdown or explanations.

## Required JSON Structure
{
  "name": "Lesson plan title",
  "objectives": ["objective 1", "objective 2", ...],
  "sections": {
    "introduction": {
      "duration": <minutes>,
      "content": "Brief overview of what will be covered",
      "hook": "Engaging opening activity or question to capture attention"
    },
    "mainContent": {
      "duration": <minutes>,
      "topics": ["Key topic 1", "Key topic 2", ...],
      "teachingStrategies": ["Strategy 1", "Strategy 2", ...]
    },
    "activities": {
      "duration": <minutes>,
      "activities": [
        {
          "name": "Activity name",
          "description": "What students will do",
          "materials": ["material 1", ...]
        }
      ]
    },
    "assessment": {
      "duration": <minutes>,
      "methods": ["Method 1", "Method 2"],
      "questions": ["Question 1", "Question 2", ...]
    },
    "differentiation": {
      "advanced": ["Extension activity for advanced students"],
      "struggling": ["Support strategy for struggling students"]
    }
  },
  "materials": ["List of all materials needed for the lesson"]
}

## Guidelines
- Ensure total duration of all sections equals ${input.duration} minutes
- Use IGCSE-appropriate language and difficulty
- Include practical, hands-on activities where possible
- Questions should test understanding at different cognitive levels
- Differentiation should be specific and actionable

Return ONLY the JSON object, no additional text.`;
}

export function parseLessonPlanResponse(response: string): LessonPlanOutput | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as LessonPlanOutput;

    // Validate required fields
    if (!parsed.name || !parsed.objectives || !parsed.sections) {
      return null;
    }

    return parsed;
  } catch {
    console.error('Failed to parse lesson plan response');
    return null;
  }
}
