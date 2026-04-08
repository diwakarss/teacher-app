// ---------------------------------------------------------------------------
// Question Paper Generation — Flexible Section Builder
// ---------------------------------------------------------------------------
// Supports CT (Cycle Test), MTPT (Mid-Term Progression Test), and
// FTPT (Final Term Progression Test) formats used at DPS Bangalore East
// (Cambridge curriculum, Grades 2-4).
// ---------------------------------------------------------------------------

// ── Question types derived from real sample papers ──────────────────────────

export type QuestionType =
  | 'define'                    // "Define the following"
  | 'fill_blank'               // "Fill in the blanks"
  | 'fill_blank_word_bank'     // "Fill in the blanks using the word bank"
  | 'true_false'               // "Write True or False"
  | 'complete_paragraph'       // "Complete the paragraph using the word bank"
  | 'classify'                 // "Classify / Sort into categories"
  | 'comparison_table'         // "Complete the comparison table"
  | 'match'                    // "Match the following"
  | 'short_answer'             // 2-3 sentence answers
  | 'long_answer'              // Paragraph / multi-part answers
  | 'advantages_disadvantages' // "Write advantages and disadvantages"
  | 'mcq';                     // Multiple choice (kept for backward compat)

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  define: 'Define',
  fill_blank: 'Fill in the Blanks',
  fill_blank_word_bank: 'Fill in the Blanks (Word Bank)',
  true_false: 'True or False',
  complete_paragraph: 'Complete the Paragraph',
  classify: 'Classify / Sort',
  comparison_table: 'Comparison Table',
  match: 'Match the Following',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  advantages_disadvantages: 'Advantages & Disadvantages',
  mcq: 'Multiple Choice',
};

// ── Flexible question shape ─────────────────────────────────────────────────

export interface FlexibleQuestion {
  number: number;
  type: QuestionType;
  text: string;
  marks: number;
  // Type-specific optional fields
  options?: string[];         // MCQ choices OR word bank words
  items?: string[];           // Match pairs, classify items
  categories?: string[];      // Column headers for classify
  tableHeaders?: string[];    // For comparison / T-F / advantages tables
  tableRows?: string[][];     // Table body rows
  answerLines?: number;       // Blank lines to leave for student answer
  answer: string | string[];  // Answer key (string or array for tables)
}

// ── Section model ───────────────────────────────────────────────────────────

export interface PaperSection {
  name: string;               // "Section A" or custom label
  instructions: string;
  questionType: QuestionType;
  count: number;
  marksEach: number;
  totalMarks: number;         // count * marksEach
  questions: FlexibleQuestion[];
}

// ── Paper output ────────────────────────────────────────────────────────────

export interface QuestionPaperOutput {
  name: string;
  header: {
    schoolName: string;
    examType: string;         // CT / MTPT / FTPT
    grade: string;
    subject: string;
    duration: string;
    maxMarks: number;
    instructions: string[];
  };
  sections: PaperSection[];
  answerKey: Array<{
    questionNumber: string;   // "A1", "B2", etc.
    answer: string;
  }>;
}

// ── Paper format presets ────────────────────────────────────────────────────

export type PaperFormat = 'ct' | 'mtpt' | 'ftpt' | 'custom';

export interface PaperFormatPreset {
  label: string;
  description: string;
  defaultMarks: number;
  defaultDuration: number;    // minutes
  suggestedSections: Array<{
    questionType: QuestionType;
    count: number;
    marksEach: number;
  }>;
}

export const PAPER_FORMAT_PRESETS: Record<PaperFormat, PaperFormatPreset> = {
  ct: {
    label: 'Cycle Test (CT)',
    description: '10-20 marks, 25-45 min — short periodic assessment',
    defaultMarks: 15,
    defaultDuration: 30,
    suggestedSections: [
      { questionType: 'fill_blank', count: 5, marksEach: 1 },
      { questionType: 'true_false', count: 5, marksEach: 1 },
      { questionType: 'short_answer', count: 5, marksEach: 1 },
    ],
  },
  mtpt: {
    label: 'Mid-Term Progression Test (MTPT)',
    description: '20-30 marks, 45-60 min — mid-term assessment',
    defaultMarks: 25,
    defaultDuration: 45,
    suggestedSections: [
      { questionType: 'fill_blank_word_bank', count: 5, marksEach: 1 },
      { questionType: 'true_false', count: 5, marksEach: 1 },
      { questionType: 'match', count: 5, marksEach: 1 },
      { questionType: 'short_answer', count: 5, marksEach: 1 },
      { questionType: 'define', count: 5, marksEach: 1 },
    ],
  },
  ftpt: {
    label: 'Final Term Progression Test (FTPT)',
    description: '15-20 marks, 30 min — Cambridge end-of-term format',
    defaultMarks: 20,
    defaultDuration: 30,
    suggestedSections: [
      { questionType: 'fill_blank_word_bank', count: 5, marksEach: 1 },
      { questionType: 'true_false', count: 5, marksEach: 1 },
      { questionType: 'classify', count: 1, marksEach: 5 },
      { questionType: 'short_answer', count: 5, marksEach: 1 },
    ],
  },
  custom: {
    label: 'Custom',
    description: 'Build your own paper from scratch',
    defaultMarks: 20,
    defaultDuration: 30,
    suggestedSections: [
      { questionType: 'short_answer', count: 5, marksEach: 1 },
    ],
  },
};

// ── Section builder input (what the teacher configures) ─────────────────────

export interface SectionConfig {
  questionType: QuestionType;
  count: number;
  marksEach: number;
  customName?: string;        // Override "Section A" etc.
}

export interface QuestionPaperPromptInput {
  chaptersContent: { name: string; content: string }[];
  subjectName: string;
  grade: string;
  totalMarks: number;
  duration: number;           // minutes
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  paperFormat: PaperFormat;
  sections: SectionConfig[];
  schoolName?: string;
}

// ── Prompt builder ──────────────────────────────────────────────────────────

const SECTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function questionTypeExamples(type: QuestionType): string {
  switch (type) {
    case 'define':
      return `Each question: "Define [term]." Answer: 1-2 sentence definition.`;
    case 'fill_blank':
      return `Each question: a sentence with one blank ("______"). Answer: the missing word.`;
    case 'fill_blank_word_bank':
      return `Provide a word bank (array in "options" field) with one extra distractor word. Each question has a blank. Answer: the correct word from the bank.`;
    case 'true_false':
      return `Each question: a factual statement. Answer: "True" or "False".`;
    case 'complete_paragraph':
      return `One paragraph with multiple blanks. "options" field has the word bank. Answer: list of words in order.`;
    case 'classify':
      return `"categories" field lists 2-3 category names. "items" field lists all items to sort. Answer: mapping of item to category.`;
    case 'comparison_table':
      return `"tableHeaders" lists column headers (e.g. ["Feature", "Item A", "Item B"]). "tableRows" has partially filled rows for students to complete. Answer: completed table.`;
    case 'match':
      return `"items" is an array of "A - B" pairs. Left column and right column should be shuffled. Answer: correct pairings.`;
    case 'short_answer':
      return `Each question requires a 1-3 sentence answer. Set "answerLines": 3.`;
    case 'long_answer':
      return `Each question requires a paragraph or multi-part answer. Set "answerLines": 6. May include sub-parts (a), (b), (c).`;
    case 'advantages_disadvantages':
      return `"tableHeaders": ["Advantages", "Disadvantages"]. Students fill in both columns. Answer: list of advantages and disadvantages.`;
    case 'mcq':
      return `"options" is an array of 4 choices: ["A) ...", "B) ...", "C) ...", "D) ..."]. Answer: the correct letter.`;
  }
}

export function buildQuestionPaperPrompt(input: QuestionPaperPromptInput): string {
  const chaptersText = input.chaptersContent
    .map((c) => `### ${c.name}\n${c.content.slice(0, 20000)}`)
    .join('\n\n');

  const sectionsSpec = input.sections
    .map((s, i) => {
      const letter = SECTION_LETTERS[i] || `S${i + 1}`;
      const sectionName = s.customName || `Section ${letter}`;
      const total = s.count * s.marksEach;
      const typeLabel = QUESTION_TYPE_LABELS[s.questionType];
      const example = questionTypeExamples(s.questionType);
      return `### ${sectionName} — ${typeLabel}
- Questions: ${s.count}
- Marks each: ${s.marksEach}
- Section total: ${total} marks [${s.count} x ${s.marksEach} = ${total}]
- Format: ${example}`;
    })
    .join('\n\n');

  const jsonSectionTemplates = input.sections
    .map((s, i) => {
      const letter = SECTION_LETTERS[i] || `S${i + 1}`;
      const sectionName = s.customName || `Section ${letter}`;
      const total = s.count * s.marksEach;
      return `    {
      "name": "${sectionName}",
      "instructions": "...",
      "questionType": "${s.questionType}",
      "count": ${s.count},
      "marksEach": ${s.marksEach},
      "totalMarks": ${total},
      "questions": [ /* ${s.count} questions of type "${s.questionType}" */ ]
    }`;
    })
    .join(',\n');

  const difficultyGuide: Record<string, string> = {
    easy: 'Focus on basic recall and understanding. Questions should test fundamental concepts. Grades 2-3 level vocabulary.',
    medium: 'Mix of recall, understanding, and application. Include some questions requiring analysis.',
    hard: 'Emphasize application, analysis, and evaluation. Include challenging reasoning questions.',
    mixed: 'Include 30% easy (recall), 50% medium (understanding), and 20% hard (application) across all sections.',
  };

  return `You are an experienced Cambridge curriculum examiner for primary school (Grades 2-4). Generate a structured question paper based on the provided chapter content.

## Paper Information
- **School**: ${input.schoolName || 'Delhi Public School Bangalore East'}
- **Exam Type**: ${PAPER_FORMAT_PRESETS[input.paperFormat]?.label || input.paperFormat.toUpperCase()}
- **Grade**: ${input.grade}
- **Subject**: ${input.subjectName}
- **Total Marks**: ${input.totalMarks}
- **Duration**: ${input.duration} minutes
- **Difficulty**: ${input.difficulty}

## Chapter Content
${chaptersText}

## Section Specifications
${sectionsSpec}

## Difficulty Guidelines
${difficultyGuide[input.difficulty]}

## Required JSON Output

Return ONLY valid JSON. No markdown fences, no explanations.

{
  "name": "Paper title",
  "header": {
    "schoolName": "${input.schoolName || 'Delhi Public School Bangalore East'}",
    "examType": "${input.paperFormat.toUpperCase()}",
    "grade": "${input.grade}",
    "subject": "${input.subjectName}",
    "duration": "${input.duration} minutes",
    "maxMarks": ${input.totalMarks},
    "instructions": ["General instruction 1", "..."]
  },
  "sections": [
${jsonSectionTemplates}
  ],
  "answerKey": [
    {"questionNumber": "A1", "answer": "..."},
    {"questionNumber": "B1", "answer": "..."}
  ]
}

## Question Object Shape
Each question in a section's "questions" array:
{
  "number": 1,
  "type": "${input.sections[0]?.questionType || 'short_answer'}",
  "text": "Question text",
  "marks": ${input.sections[0]?.marksEach || 1},
  "options": [],
  "items": [],
  "categories": [],
  "tableHeaders": [],
  "tableRows": [],
  "answerLines": 3,
  "answer": "The answer"
}

Only include fields relevant to the question type. Always include: number, type, text, marks, answer.

## Rules
- Questions must be based ONLY on the provided chapter content
- Use clear, age-appropriate language for ${input.grade} students
- Each section must have EXACTLY the number of questions specified
- The marks notation for each section should show [count x marks = total]
- For word bank types, include 1-2 extra distractor words
- For table types, provide proper tableHeaders and partially filled tableRows
- For match types, shuffle the right column so it doesn't align with the left
- Answer key must be complete and accurate
- Question numbers restart at 1 within each section

Return ONLY the JSON object.`;
}

// ── Response parser ─────────────────────────────────────────────────────────

export function parseQuestionPaperResponse(response: string): QuestionPaperOutput | null {
  try {
    // Strip markdown code fences if present
    let jsonText = response;
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonText = fenceMatch[1].trim();
    }

    // Try to extract JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as QuestionPaperOutput;

    // Validate required fields
    if (!parsed.name || !parsed.header || !parsed.sections) {
      return null;
    }

    // Ensure answerKey exists (some models skip it)
    if (!parsed.answerKey) {
      parsed.answerKey = [];
    }

    // Normalize sections: ensure totalMarks is computed
    for (const section of parsed.sections) {
      if (!section.totalMarks && section.count && section.marksEach) {
        section.totalMarks = section.count * section.marksEach;
      }
      // Ensure questions array exists
      if (!section.questions) {
        section.questions = [];
      }
    }

    return parsed;
  } catch {
    console.error('Failed to parse question paper response');
    return null;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Build default sections from a paper format preset */
export function getDefaultSections(format: PaperFormat): SectionConfig[] {
  const preset = PAPER_FORMAT_PRESETS[format];
  return preset.suggestedSections.map((s) => ({
    questionType: s.questionType,
    count: s.count,
    marksEach: s.marksEach,
  }));
}

/** Calculate total marks from sections */
export function calculateTotalMarks(sections: SectionConfig[]): number {
  return sections.reduce((sum, s) => sum + s.count * s.marksEach, 0);
}

/** Validate that sections add up to totalMarks */
export function validateSections(
  sections: SectionConfig[],
  totalMarks: number
): { valid: boolean; calculated: number } {
  const calculated = calculateTotalMarks(sections);
  return { valid: calculated === totalMarks, calculated };
}
