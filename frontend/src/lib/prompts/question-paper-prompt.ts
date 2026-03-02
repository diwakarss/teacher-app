export interface QuestionPaperPromptInput {
  chaptersContent: { name: string; content: string }[];
  subjectName: string;
  totalMarks: number;
  duration: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  template: 'unit_test' | 'monthly_test' | 'term_exam' | 'custom';
  sectionDistribution?: {
    sectionA: { count: number; marksEach: number };
    sectionB: { count: number; marksEach: number };
    sectionC: { count: number; marksEach: number };
  };
}

export interface Question {
  number: number;
  text: string;
  marks: number;
  type: 'mcq' | 'fill_blank' | 'true_false' | 'short_answer' | 'long_answer';
  options?: string[]; // For MCQ
  answer: string;
}

export interface Section {
  name: string;
  instructions: string;
  marksPerQuestion: number;
  totalMarks: number;
  questions: Question[];
}

export interface QuestionPaperOutput {
  name: string;
  header: {
    schoolName: string;
    examName: string;
    subject: string;
    duration: string;
    maxMarks: number;
    instructions: string[];
  };
  sections: Section[];
  answerKey: Array<{
    questionNumber: string;
    answer: string;
  }>;
}

export function getDefaultDistribution(
  totalMarks: number,
  template: string
): { sectionA: { count: number; marksEach: number }; sectionB: { count: number; marksEach: number }; sectionC: { count: number; marksEach: number } } {
  switch (template) {
    case 'unit_test':
      // 40 marks: 10×1 + 5×2 + 4×5 = 10 + 10 + 20 = 40
      return {
        sectionA: { count: 10, marksEach: 1 },
        sectionB: { count: 5, marksEach: 2 },
        sectionC: { count: 4, marksEach: 5 },
      };
    case 'monthly_test':
      // 50 marks: 10×1 + 10×2 + 4×5 = 10 + 20 + 20 = 50
      return {
        sectionA: { count: 10, marksEach: 1 },
        sectionB: { count: 10, marksEach: 2 },
        sectionC: { count: 4, marksEach: 5 },
      };
    case 'term_exam':
      // 100 marks: 20×1 + 15×2 + 10×5 = 20 + 30 + 50 = 100
      return {
        sectionA: { count: 20, marksEach: 1 },
        sectionB: { count: 15, marksEach: 2 },
        sectionC: { count: 10, marksEach: 5 },
      };
    default:
      // Custom: proportional distribution
      const sectionAMarks = Math.round(totalMarks * 0.25);
      const sectionBMarks = Math.round(totalMarks * 0.25);
      const sectionCMarks = totalMarks - sectionAMarks - sectionBMarks;
      return {
        sectionA: { count: sectionAMarks, marksEach: 1 },
        sectionB: { count: Math.floor(sectionBMarks / 2), marksEach: 2 },
        sectionC: { count: Math.floor(sectionCMarks / 5), marksEach: 5 },
      };
  }
}

export function buildQuestionPaperPrompt(input: QuestionPaperPromptInput): string {
  const distribution = input.sectionDistribution || getDefaultDistribution(input.totalMarks, input.template);

  const sectionATotal = distribution.sectionA.count * distribution.sectionA.marksEach;
  const sectionBTotal = distribution.sectionB.count * distribution.sectionB.marksEach;
  const sectionCTotal = distribution.sectionC.count * distribution.sectionC.marksEach;

  const chaptersText = input.chaptersContent
    .map((c) => `### ${c.name}\n${c.content.slice(0, 20000)}`)
    .join('\n\n');

  const difficultyGuide = {
    easy: 'Focus on basic recall and understanding. Questions should test fundamental concepts.',
    medium: 'Mix of recall, understanding, and application. Include some questions requiring analysis.',
    hard: 'Emphasize application, analysis, and evaluation. Include challenging problem-solving questions.',
    mixed: 'Include 30% easy, 50% medium, and 20% hard questions across all sections.',
  };

  return `You are an experienced IGCSE examiner. Generate a structured question paper based on the following chapter content.

## Paper Information
- **Subject**: ${input.subjectName}
- **Total Marks**: ${input.totalMarks}
- **Duration**: ${input.duration} minutes
- **Difficulty**: ${input.difficulty}
- **Template**: ${input.template}

## Chapter Content
${chaptersText}

## Section Distribution
- **Section A**: ${distribution.sectionA.count} questions × ${distribution.sectionA.marksEach} mark = ${sectionATotal} marks (MCQ/Fill in blanks/True-False)
- **Section B**: ${distribution.sectionB.count} questions × ${distribution.sectionB.marksEach} marks = ${sectionBTotal} marks (Short answer)
- **Section C**: ${distribution.sectionC.count} questions × ${distribution.sectionC.marksEach} marks = ${sectionCTotal} marks (Long answer)

## Difficulty Guidelines
${difficultyGuide[input.difficulty]}

## Instructions
Generate a complete question paper with the exact section distribution above. Return ONLY valid JSON, no markdown or explanations.

## Required JSON Structure
{
  "name": "Paper title",
  "header": {
    "schoolName": "[School Name]",
    "examName": "${input.template.replace('_', ' ').toUpperCase()}",
    "subject": "${input.subjectName}",
    "duration": "${input.duration} minutes",
    "maxMarks": ${input.totalMarks},
    "instructions": ["General instruction 1", "General instruction 2", ...]
  },
  "sections": [
    {
      "name": "Section A",
      "instructions": "Answer all questions. Each question carries ${distribution.sectionA.marksEach} mark.",
      "marksPerQuestion": ${distribution.sectionA.marksEach},
      "totalMarks": ${sectionATotal},
      "questions": [
        {
          "number": 1,
          "text": "Question text",
          "marks": ${distribution.sectionA.marksEach},
          "type": "mcq",
          "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
          "answer": "A"
        }
      ]
    },
    {
      "name": "Section B",
      "instructions": "Answer all questions. Each question carries ${distribution.sectionB.marksEach} marks.",
      "marksPerQuestion": ${distribution.sectionB.marksEach},
      "totalMarks": ${sectionBTotal},
      "questions": [
        {
          "number": 1,
          "text": "Question text",
          "marks": ${distribution.sectionB.marksEach},
          "type": "short_answer",
          "answer": "Expected answer"
        }
      ]
    },
    {
      "name": "Section C",
      "instructions": "Answer all questions. Each question carries ${distribution.sectionC.marksEach} marks.",
      "marksPerQuestion": ${distribution.sectionC.marksEach},
      "totalMarks": ${sectionCTotal},
      "questions": [
        {
          "number": 1,
          "text": "Question text with multiple parts if needed",
          "marks": ${distribution.sectionC.marksEach},
          "type": "long_answer",
          "answer": "Detailed expected answer with key points"
        }
      ]
    }
  ],
  "answerKey": [
    {"questionNumber": "A1", "answer": "Answer"},
    {"questionNumber": "B1", "answer": "Answer"},
    {"questionNumber": "C1", "answer": "Answer"}
  ]
}

## Guidelines
- Questions must be based ONLY on the provided chapter content
- Use clear, unambiguous language appropriate for IGCSE students
- Section A should have varied question types (MCQ, fill blanks, true/false)
- Section B questions should require 2-3 sentence answers
- Section C questions may have multiple parts (a, b, c) if needed
- Ensure questions cover different topics from the chapters
- Answer key must be complete and accurate

Return ONLY the JSON object, no additional text.`;
}

export function parseQuestionPaperResponse(response: string): QuestionPaperOutput | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as QuestionPaperOutput;

    // Validate required fields
    if (!parsed.name || !parsed.header || !parsed.sections || !parsed.answerKey) {
      return null;
    }

    return parsed;
  } catch {
    console.error('Failed to parse question paper response');
    return null;
  }
}
