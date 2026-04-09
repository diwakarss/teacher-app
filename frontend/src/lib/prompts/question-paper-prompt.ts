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
  | 'mcq'                      // Multiple choice (kept for backward compat)
  // Image-dependent question types (Phase 2)
  | 'read_pictogram'           // "Read the pictogram and answer"
  | 'read_chart'               // "Read the bar chart and answer"
  | 'read_scratch'             // "Look at the Scratch code and answer"
  | 'debug_scratch'            // "Find the bug in the Scratch code"
  | 'grid_trace';              // "Trace the algorithm on the grid"

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
  read_pictogram: 'Read the Pictogram',
  read_chart: 'Read the Chart',
  read_scratch: 'Read Scratch Code',
  debug_scratch: 'Debug Scratch Code',
  grid_trace: 'Grid Trace',
};

// ── Image support ───────────────────────────────────────────────────────────

export type ImageKind =
  | 'pictogram'       // Programmatic SVG — picture graph with icons
  | 'bar_chart'       // Programmatic SVG — vertical/horizontal bar chart
  | 'number_line'     // Programmatic SVG — number line with markers
  | 'tally_chart'     // Programmatic SVG — tally marks table
  | 'scratch_blocks'  // Programmatic SVG — Scratch coding blocks
  | 'grid_path';      // Programmatic SVG — grid with colored path cells

export interface QuestionImage {
  kind: ImageKind;
  prompt: string;             // What to generate (data spec for SVG, text prompt for AI)
  svgData?: string;           // Filled client-side for SVG types
  base64Data?: string;        // Filled by API for AI types
  alt: string;                // Accessibility / print alt text
}

/** Question types that always require an image */
export const IMAGE_QUESTION_TYPES: QuestionType[] = [
  'read_pictogram', 'read_chart', 'read_scratch', 'debug_scratch', 'grid_trace',
];

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
  // Image support (Phase 2)
  image?: QuestionImage;      // Optional image for this question
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
    case 'read_pictogram':
      return `The question references a pictogram (picture graph). You MUST include an "image" field:
"image": { "kind": "pictogram", "prompt": "title: Favourite Fruits; key: 1 icon = 2 students; data: Apple=6, Banana=8, Mango=4, Orange=10", "alt": "Pictogram showing favourite fruits of students" }
The "prompt" field must specify: title, key (what each icon represents), and data (label=value pairs).
Ask 2-3 sub-questions about the pictogram data (reading values, comparing, totals). Set "answerLines": 4.`;
    case 'read_chart':
      return `The question references a bar chart. You MUST include an "image" field:
"image": { "kind": "bar_chart", "prompt": "title: Monthly Rainfall; xLabel: Month; yLabel: Rainfall (mm); data: Jan=30, Feb=20, Mar=45, Apr=60, May=50", "alt": "Bar chart showing monthly rainfall" }
The "prompt" field must specify: title, axis labels, and data (label=value pairs).
Ask 2-3 sub-questions about reading values, comparing bars, finding highest/lowest. Set "answerLines": 4.`;
    case 'read_scratch':
      return `The question shows Scratch coding blocks and asks students to read/analyze the code. You MUST include an "image" field:
"image": { "kind": "scratch_blocks", "prompt": "when green flag clicked\\nrepeat 4\\n  move 100 steps\\n  turn right 90 degrees\\nend", "alt": "Scratch code blocks" }
The "prompt" field contains one Scratch block per line. Indented lines (2 spaces) are inside C-shaped blocks (repeat/forever). "end" closes a C-block.
Block types detected automatically: events (when...), motion (move/turn/glide), control (repeat/forever/stop/wait), looks (say/show/hide/size).
Ask about what the code does, what shape it draws, how many times something repeats, or what the output is. Set "answerLines": 3.`;
    case 'debug_scratch':
      return `The question shows Scratch coding blocks alongside an algorithm, and asks students to find the bug. You MUST include an "image" field:
"image": { "kind": "scratch_blocks", "prompt": "when green flag clicked\\nmove 100 steps\\nturn right 80 degrees\\nmove 100 steps\\nturn right 90 degrees\\nstop all", "alt": "Scratch code with a bug" }
Provide a text algorithm in the question that DIFFERS from the Scratch blocks in one specific way (the bug).
Ask the student to identify the bug/difference. Set "answerLines": 2.`;
    case 'grid_trace':
      return `The question shows a grid and asks students to trace an algorithm path. You MUST include an "image" field:
"image": { "kind": "grid_path", "prompt": "rows: 6; cols: 6; start: 1:1; end: 4:5; path: 1:1, 1:2, 1:3, 2:3, 3:3, 3:4, 3:5, 4:5", "alt": "Grid showing algorithm path" }
The "prompt" uses row:col format (1-indexed). "path" lists the cells to color.
Ask about the path, direction changes, or have students write the algorithm that produces the path. Set "answerLines": 4.`;
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

## Image Field (for image-dependent question types)
For question types "read_pictogram", "read_chart", "read_scratch", "debug_scratch", and "grid_trace", you MUST include an "image" field:
{
  "image": {
    "kind": "pictogram" | "bar_chart" | "scratch_blocks" | "grid_path",
    "prompt": "Specification for image generation (see type examples above)",
    "alt": "Accessibility description of the image"
  }
}
- For "read_pictogram": kind must be "pictogram", prompt has title, key, and data
- For "read_chart": kind must be "bar_chart", prompt has title, axis labels, and data
- For "read_scratch" and "debug_scratch": kind must be "scratch_blocks", prompt has one block per line (newline-separated), indented lines inside C-blocks, "end" closes C-blocks
- For "grid_trace": kind must be "grid_path", prompt has rows, cols, start, end, and path (row:col pairs)

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
- For image question types, the "image" field is REQUIRED — never omit it
- Pictogram/chart data in the image prompt must be based on the chapter content
- Scratch block prompts must use real Scratch block names (move, turn, repeat, etc.)
- Grid path coordinates use 1-indexed row:col format

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
      // Normalize image fields on questions
      for (const q of section.questions) {
        if (q.image) {
          // Ensure required image fields exist
          if (!q.image.kind || !q.image.prompt) {
            delete (q as unknown as Record<string, unknown>).image;
          } else if (!q.image.alt) {
            q.image.alt = q.image.prompt.slice(0, 100);
          }
        }
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
