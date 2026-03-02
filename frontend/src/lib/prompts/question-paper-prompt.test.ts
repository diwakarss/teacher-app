import { describe, it, expect } from 'vitest';
import {
  buildQuestionPaperPrompt,
  parseQuestionPaperResponse,
  getDefaultDistribution,
  type QuestionPaperOutput,
} from './question-paper-prompt';

describe('getDefaultDistribution', () => {
  it('returns correct distribution for unit_test', () => {
    const dist = getDefaultDistribution(40, 'unit_test');
    expect(dist.sectionA).toEqual({ count: 10, marksEach: 1 });
    expect(dist.sectionB).toEqual({ count: 5, marksEach: 2 });
    expect(dist.sectionC).toEqual({ count: 4, marksEach: 5 });
    // Total: 10 + 10 + 20 = 40
  });

  it('returns correct distribution for monthly_test', () => {
    const dist = getDefaultDistribution(50, 'monthly_test');
    expect(dist.sectionA).toEqual({ count: 10, marksEach: 1 });
    expect(dist.sectionB).toEqual({ count: 10, marksEach: 2 });
    expect(dist.sectionC).toEqual({ count: 4, marksEach: 5 });
    // Total: 10 + 20 + 20 = 50
  });

  it('returns correct distribution for term_exam', () => {
    const dist = getDefaultDistribution(100, 'term_exam');
    expect(dist.sectionA).toEqual({ count: 20, marksEach: 1 });
    expect(dist.sectionB).toEqual({ count: 15, marksEach: 2 });
    expect(dist.sectionC).toEqual({ count: 10, marksEach: 5 });
    // Total: 20 + 30 + 50 = 100
  });

  it('calculates proportional distribution for custom', () => {
    const dist = getDefaultDistribution(80, 'custom');
    expect(dist.sectionA.marksEach).toBe(1);
    expect(dist.sectionB.marksEach).toBe(2);
    expect(dist.sectionC.marksEach).toBe(5);
  });
});

describe('buildQuestionPaperPrompt', () => {
  it('builds prompt with paper info', () => {
    const prompt = buildQuestionPaperPrompt({
      chaptersContent: [{ name: 'Chapter 1', content: 'Content here' }],
      subjectName: 'Mathematics',
      totalMarks: 40,
      duration: 45,
      difficulty: 'medium',
      template: 'unit_test',
    });

    expect(prompt).toContain('Mathematics');
    expect(prompt).toContain('40');
    expect(prompt).toContain('45 minutes');
    expect(prompt).toContain('medium');
  });

  it('uses custom section distribution when provided', () => {
    const prompt = buildQuestionPaperPrompt({
      chaptersContent: [{ name: 'Ch1', content: 'Text' }],
      subjectName: 'Science',
      totalMarks: 30,
      duration: 30,
      difficulty: 'easy',
      template: 'custom',
      sectionDistribution: {
        sectionA: { count: 5, marksEach: 2 },
        sectionB: { count: 5, marksEach: 2 },
        sectionC: { count: 2, marksEach: 5 },
      },
    });

    expect(prompt).toContain('5 questions × 2 mark');
  });

  it('includes difficulty guidelines', () => {
    const easyPrompt = buildQuestionPaperPrompt({
      chaptersContent: [{ name: 'Ch1', content: 'Text' }],
      subjectName: 'Test',
      totalMarks: 40,
      duration: 45,
      difficulty: 'easy',
      template: 'unit_test',
    });
    expect(easyPrompt).toContain('basic recall');

    const hardPrompt = buildQuestionPaperPrompt({
      chaptersContent: [{ name: 'Ch1', content: 'Text' }],
      subjectName: 'Test',
      totalMarks: 40,
      duration: 45,
      difficulty: 'hard',
      template: 'unit_test',
    });
    expect(hardPrompt).toContain('problem-solving');
  });

  it('truncates very long chapter content', () => {
    const longContent = 'x'.repeat(50000);
    const prompt = buildQuestionPaperPrompt({
      chaptersContent: [{ name: 'Long', content: longContent }],
      subjectName: 'Test',
      totalMarks: 40,
      duration: 45,
      difficulty: 'medium',
      template: 'unit_test',
    });

    // Content is truncated to 20000 chars per chapter
    expect(prompt.length).toBeLessThan(longContent.length);
  });
});

describe('parseQuestionPaperResponse', () => {
  const validResponse: QuestionPaperOutput = {
    name: 'Unit Test - Mathematics',
    header: {
      schoolName: 'Test School',
      examName: 'UNIT TEST',
      subject: 'Mathematics',
      duration: '45 minutes',
      maxMarks: 40,
      instructions: ['Answer all questions', 'Show your work'],
    },
    sections: [
      {
        name: 'Section A',
        instructions: 'Choose the correct answer',
        marksPerQuestion: 1,
        totalMarks: 10,
        questions: [
          {
            number: 1,
            text: 'What is 2+2?',
            marks: 1,
            type: 'mcq',
            options: ['A) 3', 'B) 4', 'C) 5', 'D) 6'],
            answer: 'B',
          },
        ],
      },
    ],
    answerKey: [{ questionNumber: 'A1', answer: 'B' }],
  };

  it('parses valid JSON response', () => {
    const result = parseQuestionPaperResponse(JSON.stringify(validResponse));
    expect(result).toEqual(validResponse);
  });

  it('extracts JSON from markdown code blocks', () => {
    const response = `Here is the paper:\n\`\`\`json\n${JSON.stringify(validResponse)}\n\`\`\``;
    const result = parseQuestionPaperResponse(response);
    expect(result?.name).toBe('Unit Test - Mathematics');
  });

  it('returns null for invalid JSON', () => {
    const result = parseQuestionPaperResponse('not json');
    expect(result).toBeNull();
  });

  it('returns null for JSON missing required fields', () => {
    const incomplete = { name: 'Test' }; // missing header, sections, answerKey
    const result = parseQuestionPaperResponse(JSON.stringify(incomplete));
    expect(result).toBeNull();
  });
});
