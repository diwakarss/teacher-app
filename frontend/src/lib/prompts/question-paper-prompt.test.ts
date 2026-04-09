import { describe, it, expect } from 'vitest';
import {
  buildQuestionPaperPrompt,
  parseQuestionPaperResponse,
  getDefaultSections,
  calculateTotalMarks,
  validateSections,
  PAPER_FORMAT_PRESETS,
  QUESTION_TYPE_LABELS,
  IMAGE_QUESTION_TYPES,
  type QuestionPaperOutput,
  type SectionConfig,
  type PaperFormat,
  type QuestionType,
} from './question-paper-prompt';

describe('getDefaultSections', () => {
  it('returns sections for CT format', () => {
    const sections = getDefaultSections('ct');
    expect(sections.length).toBeGreaterThan(0);
    const total = calculateTotalMarks(sections);
    expect(total).toBe(PAPER_FORMAT_PRESETS.ct.defaultMarks);
  });

  it('returns sections for MTPT format', () => {
    const sections = getDefaultSections('mtpt');
    expect(sections.length).toBeGreaterThan(0);
    const total = calculateTotalMarks(sections);
    expect(total).toBe(PAPER_FORMAT_PRESETS.mtpt.defaultMarks);
  });

  it('returns sections for FTPT format', () => {
    const sections = getDefaultSections('ftpt');
    expect(sections.length).toBeGreaterThan(0);
    const total = calculateTotalMarks(sections);
    expect(total).toBe(PAPER_FORMAT_PRESETS.ftpt.defaultMarks);
  });

  it('returns sections for custom format', () => {
    const sections = getDefaultSections('custom');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('all presets have valid question types', () => {
    const formats: PaperFormat[] = ['ct', 'mtpt', 'ftpt', 'custom'];
    for (const fmt of formats) {
      const sections = getDefaultSections(fmt);
      for (const s of sections) {
        expect(QUESTION_TYPE_LABELS).toHaveProperty(s.questionType);
      }
    }
  });
});

describe('calculateTotalMarks', () => {
  it('sums count * marksEach for all sections', () => {
    const sections: SectionConfig[] = [
      { questionType: 'fill_blank', count: 5, marksEach: 1 },
      { questionType: 'short_answer', count: 3, marksEach: 2 },
      { questionType: 'long_answer', count: 2, marksEach: 5 },
    ];
    expect(calculateTotalMarks(sections)).toBe(5 + 6 + 10);
  });

  it('returns 0 for empty sections', () => {
    expect(calculateTotalMarks([])).toBe(0);
  });
});

describe('validateSections', () => {
  it('returns valid when totals match', () => {
    const sections: SectionConfig[] = [
      { questionType: 'fill_blank', count: 10, marksEach: 1 },
      { questionType: 'short_answer', count: 5, marksEach: 2 },
    ];
    const result = validateSections(sections, 20);
    expect(result.valid).toBe(true);
    expect(result.calculated).toBe(20);
  });

  it('returns invalid when totals do not match', () => {
    const sections: SectionConfig[] = [
      { questionType: 'fill_blank', count: 5, marksEach: 1 },
    ];
    const result = validateSections(sections, 20);
    expect(result.valid).toBe(false);
    expect(result.calculated).toBe(5);
  });
});

describe('buildQuestionPaperPrompt', () => {
  const baseInput = {
    chaptersContent: [{ name: 'Chapter 1', content: 'Content here' }],
    subjectName: 'Science',
    grade: 'Grade 3',
    totalMarks: 15,
    duration: 30,
    difficulty: 'medium' as const,
    paperFormat: 'ct' as PaperFormat,
    sections: [
      { questionType: 'fill_blank' as QuestionType, count: 5, marksEach: 1 },
      { questionType: 'true_false' as QuestionType, count: 5, marksEach: 1 },
      { questionType: 'short_answer' as QuestionType, count: 5, marksEach: 1 },
    ],
  };

  it('includes paper metadata', () => {
    const prompt = buildQuestionPaperPrompt(baseInput);
    expect(prompt).toContain('Science');
    expect(prompt).toContain('Grade 3');
    expect(prompt).toContain('30 minutes');
    expect(prompt).toContain('medium');
  });

  it('includes section specs with question types', () => {
    const prompt = buildQuestionPaperPrompt(baseInput);
    expect(prompt).toContain('Section A');
    expect(prompt).toContain('Section B');
    expect(prompt).toContain('Section C');
    expect(prompt).toContain('Fill in the Blanks');
    expect(prompt).toContain('True or False');
    expect(prompt).toContain('Short Answer');
  });

  it('includes marks notation', () => {
    const prompt = buildQuestionPaperPrompt(baseInput);
    expect(prompt).toContain('[5 x 1 = 5]');
  });

  it('includes chapter content', () => {
    const prompt = buildQuestionPaperPrompt(baseInput);
    expect(prompt).toContain('Chapter 1');
    expect(prompt).toContain('Content here');
  });

  it('uses custom school name when provided', () => {
    const prompt = buildQuestionPaperPrompt({
      ...baseInput,
      schoolName: 'My School',
    });
    expect(prompt).toContain('My School');
  });

  it('truncates very long chapter content', () => {
    const longContent = 'x'.repeat(50000);
    const prompt = buildQuestionPaperPrompt({
      ...baseInput,
      chaptersContent: [{ name: 'Long', content: longContent }],
    });
    expect(prompt.length).toBeLessThan(longContent.length);
  });

  it('handles many sections with correct lettering', () => {
    const sections: SectionConfig[] = Array.from({ length: 6 }, (_, i) => ({
      questionType: 'short_answer' as QuestionType,
      count: 2,
      marksEach: 1,
    }));
    const prompt = buildQuestionPaperPrompt({
      ...baseInput,
      sections,
      totalMarks: 12,
    });
    expect(prompt).toContain('Section A');
    expect(prompt).toContain('Section F');
  });

  it('includes difficulty guidelines', () => {
    const easyPrompt = buildQuestionPaperPrompt({
      ...baseInput,
      difficulty: 'easy',
    });
    expect(easyPrompt).toContain('basic recall');

    const hardPrompt = buildQuestionPaperPrompt({
      ...baseInput,
      difficulty: 'hard',
    });
    expect(hardPrompt).toContain('reasoning');
  });
});

describe('parseQuestionPaperResponse', () => {
  const validResponse: QuestionPaperOutput = {
    name: 'Cycle Test - Science',
    header: {
      schoolName: 'DPS Bangalore East',
      examType: 'CT',
      grade: 'Grade 3',
      subject: 'Science',
      duration: '30 minutes',
      maxMarks: 15,
      instructions: ['Answer all questions'],
    },
    sections: [
      {
        name: 'Section A',
        instructions: 'Fill in the blanks',
        questionType: 'fill_blank',
        count: 5,
        marksEach: 1,
        totalMarks: 5,
        questions: [
          {
            number: 1,
            text: 'Water boils at ______ degrees Celsius.',
            marks: 1,
            type: 'fill_blank',
            answer: '100',
          },
        ],
      },
    ],
    answerKey: [{ questionNumber: 'A1', answer: '100' }],
  };

  it('parses valid JSON response', () => {
    const result = parseQuestionPaperResponse(JSON.stringify(validResponse));
    expect(result).toEqual(validResponse);
  });

  it('strips markdown code fences', () => {
    const response = `\`\`\`json\n${JSON.stringify(validResponse)}\n\`\`\``;
    const result = parseQuestionPaperResponse(response);
    expect(result?.name).toBe('Cycle Test - Science');
  });

  it('returns null for invalid JSON', () => {
    expect(parseQuestionPaperResponse('not json')).toBeNull();
  });

  it('returns null for JSON missing required fields', () => {
    const incomplete = { name: 'Test' };
    expect(parseQuestionPaperResponse(JSON.stringify(incomplete))).toBeNull();
  });

  it('fills in missing answerKey', () => {
    const noAnswerKey = { ...validResponse, answerKey: undefined };
    const json = JSON.stringify(noAnswerKey);
    const result = parseQuestionPaperResponse(json);
    expect(result?.answerKey).toEqual([]);
  });

  it('computes missing totalMarks on sections', () => {
    const noTotalMarks = {
      ...validResponse,
      sections: [
        {
          ...validResponse.sections[0],
          totalMarks: 0,
          count: 5,
          marksEach: 1,
        },
      ],
    };
    const result = parseQuestionPaperResponse(JSON.stringify(noTotalMarks));
    expect(result?.sections[0].totalMarks).toBe(5);
  });

  it('ensures questions array exists on sections', () => {
    const noQuestions = {
      ...validResponse,
      sections: [
        {
          name: 'Section A',
          instructions: 'test',
          questionType: 'fill_blank',
          count: 5,
          marksEach: 1,
          totalMarks: 5,
        },
      ],
    };
    const result = parseQuestionPaperResponse(JSON.stringify(noQuestions));
    expect(result?.sections[0].questions).toEqual([]);
  });
});

describe('PAPER_FORMAT_PRESETS', () => {
  it('all presets have required fields', () => {
    const formats: PaperFormat[] = ['ct', 'mtpt', 'ftpt', 'custom'];
    for (const fmt of formats) {
      const preset = PAPER_FORMAT_PRESETS[fmt];
      expect(preset.label).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.defaultMarks).toBeGreaterThan(0);
      expect(preset.defaultDuration).toBeGreaterThan(0);
      expect(preset.suggestedSections.length).toBeGreaterThan(0);
    }
  });

  it('preset sections add up to defaultMarks', () => {
    const formats: PaperFormat[] = ['ct', 'mtpt', 'ftpt'];
    for (const fmt of formats) {
      const preset = PAPER_FORMAT_PRESETS[fmt];
      const total = preset.suggestedSections.reduce(
        (sum, s) => sum + s.count * s.marksEach,
        0
      );
      expect(total).toBe(preset.defaultMarks);
    }
  });
});

describe('QUESTION_TYPE_LABELS', () => {
  it('has a label for every question type including image types', () => {
    const types: QuestionType[] = [
      'define', 'fill_blank', 'fill_blank_word_bank', 'true_false',
      'complete_paragraph', 'classify', 'comparison_table', 'match',
      'short_answer', 'long_answer', 'advantages_disadvantages', 'mcq',
      'read_pictogram', 'read_chart', 'read_scratch', 'debug_scratch', 'grid_trace',
    ];
    for (const t of types) {
      expect(QUESTION_TYPE_LABELS[t]).toBeTruthy();
    }
  });
});

describe('IMAGE_QUESTION_TYPES', () => {
  it('contains all image-dependent types', () => {
    expect(IMAGE_QUESTION_TYPES).toContain('read_pictogram');
    expect(IMAGE_QUESTION_TYPES).toContain('read_chart');
    expect(IMAGE_QUESTION_TYPES).toContain('read_scratch');
    expect(IMAGE_QUESTION_TYPES).toContain('debug_scratch');
    expect(IMAGE_QUESTION_TYPES).toContain('grid_trace');
  });

  it('does not contain text-only types', () => {
    expect(IMAGE_QUESTION_TYPES).not.toContain('fill_blank');
    expect(IMAGE_QUESTION_TYPES).not.toContain('short_answer');
    expect(IMAGE_QUESTION_TYPES).not.toContain('mcq');
  });
});

describe('image question type prompts', () => {
  it('includes image instructions for read_pictogram sections', () => {
    const prompt = buildQuestionPaperPrompt({
      chaptersContent: [{ name: 'Data Handling', content: 'Students collected data about fruits' }],
      subjectName: 'Math',
      grade: 'Grade 3',
      totalMarks: 5,
      duration: 15,
      difficulty: 'easy',
      paperFormat: 'custom',
      sections: [{ questionType: 'read_pictogram', count: 1, marksEach: 5 }],
    });
    expect(prompt).toContain('pictogram');
    expect(prompt).toContain('"image"');
    expect(prompt).toContain('"kind"');
  });

  it('includes image instructions for read_chart sections', () => {
    const prompt = buildQuestionPaperPrompt({
      chaptersContent: [{ name: 'Graphs', content: 'Monthly rainfall data' }],
      subjectName: 'Math',
      grade: 'Grade 3',
      totalMarks: 5,
      duration: 15,
      difficulty: 'easy',
      paperFormat: 'custom',
      sections: [{ questionType: 'read_chart', count: 1, marksEach: 5 }],
    });
    expect(prompt).toContain('bar_chart');
    expect(prompt).toContain('"image"');
  });

  it('includes image instructions for read_scratch sections', () => {
    const prompt = buildQuestionPaperPrompt({
      chaptersContent: [{ name: 'Algorithms', content: 'Scratch programming basics' }],
      subjectName: 'Computing',
      grade: 'Grade 3',
      totalMarks: 3,
      duration: 10,
      difficulty: 'easy',
      paperFormat: 'custom',
      sections: [{ questionType: 'read_scratch', count: 1, marksEach: 3 }],
    });
    expect(prompt).toContain('scratch_blocks');
    expect(prompt).toContain('"image"');
  });
});

describe('parseQuestionPaperResponse with images', () => {
  const paperWithImage: QuestionPaperOutput = {
    name: 'Math CT',
    header: {
      schoolName: 'DPS', examType: 'CT', grade: 'Grade 3',
      subject: 'Math', duration: '30 min', maxMarks: 5,
      instructions: [],
    },
    sections: [{
      name: 'Section A',
      instructions: 'Read the pictogram and answer',
      questionType: 'read_pictogram',
      count: 1,
      marksEach: 5,
      totalMarks: 5,
      questions: [{
        number: 1,
        type: 'read_pictogram',
        text: 'Look at the pictogram and answer:',
        marks: 5,
        image: {
          kind: 'pictogram',
          prompt: 'title: Fruits; key: 1 icon = 2; data: Apple=6, Banana=4',
          alt: 'Pictogram of fruits',
        },
        answerLines: 4,
        answer: ['6', '4', '10'],
      }],
    }],
    answerKey: [{ questionNumber: 'A1', answer: '6, 4, 10' }],
  };

  it('preserves valid image fields', () => {
    const result = parseQuestionPaperResponse(JSON.stringify(paperWithImage));
    expect(result?.sections[0].questions[0].image).toBeDefined();
    expect(result?.sections[0].questions[0].image?.kind).toBe('pictogram');
    expect(result?.sections[0].questions[0].image?.prompt).toContain('Fruits');
  });

  it('drops image fields missing kind or prompt', () => {
    const bad = JSON.parse(JSON.stringify(paperWithImage));
    bad.sections[0].questions[0].image = { kind: '', prompt: '', alt: 'test' };
    const result = parseQuestionPaperResponse(JSON.stringify(bad));
    expect(result?.sections[0].questions[0].image).toBeUndefined();
  });

  it('fills in missing alt from prompt', () => {
    const noAlt = JSON.parse(JSON.stringify(paperWithImage));
    delete noAlt.sections[0].questions[0].image.alt;
    const result = parseQuestionPaperResponse(JSON.stringify(noAlt));
    expect(result?.sections[0].questions[0].image?.alt).toContain('Fruits');
  });
});
