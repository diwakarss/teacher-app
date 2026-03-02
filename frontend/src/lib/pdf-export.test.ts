import { describe, it, expect } from 'vitest';
import { formatLessonPlanForPrint, formatQuestionPaperForPrint } from './pdf-export';

describe('formatLessonPlanForPrint', () => {
  const samplePlan = {
    name: 'Introduction to Photosynthesis',
    duration: 45,
    objectives: ['Understand the process', 'Identify components'],
    sections: {
      introduction: {
        duration: 5,
        content: 'Overview of photosynthesis',
        hook: 'What do plants eat?',
      },
      mainContent: {
        duration: 20,
        topics: ['Light reactions', 'Calvin cycle'],
        teachingStrategies: ['Visual aids', 'Discussion'],
      },
      activities: {
        duration: 15,
        activities: [
          {
            name: 'Leaf experiment',
            description: 'Test for starch in leaves',
            materials: ['Leaves', 'Iodine'],
          },
        ],
      },
      assessment: {
        duration: 5,
        methods: ['Quiz', 'Exit ticket'],
        questions: ['What is photosynthesis?', 'Name the reactants'],
      },
      differentiation: {
        advanced: ['Research C4 plants'],
        struggling: ['Visual summary cards'],
      },
    },
    materials: ['Whiteboard', 'Leaves', 'Iodine'],
  };

  it('includes the lesson plan name in header', () => {
    const html = formatLessonPlanForPrint(samplePlan);
    expect(html).toContain('Introduction to Photosynthesis');
  });

  it('includes duration info', () => {
    const html = formatLessonPlanForPrint(samplePlan);
    expect(html).toContain('45 minutes');
  });

  it('includes learning objectives', () => {
    const html = formatLessonPlanForPrint(samplePlan);
    expect(html).toContain('Understand the process');
    expect(html).toContain('Identify components');
  });

  it('includes all sections', () => {
    const html = formatLessonPlanForPrint(samplePlan);
    expect(html).toContain('Introduction');
    expect(html).toContain('Main Content');
    expect(html).toContain('Activities');
    expect(html).toContain('Assessment');
    expect(html).toContain('Differentiation');
  });

  it('includes section durations', () => {
    const html = formatLessonPlanForPrint(samplePlan);
    expect(html).toContain('5 min');
    expect(html).toContain('20 min');
    expect(html).toContain('15 min');
  });

  it('includes activity details with materials', () => {
    const html = formatLessonPlanForPrint(samplePlan);
    expect(html).toContain('Leaf experiment');
    expect(html).toContain('Test for starch');
    expect(html).toContain('Leaves');
    expect(html).toContain('Iodine');
  });

  it('includes materials list', () => {
    const html = formatLessonPlanForPrint(samplePlan);
    expect(html).toContain('Materials Needed');
    expect(html).toContain('Whiteboard');
  });
});

describe('formatQuestionPaperForPrint', () => {
  const samplePaper = {
    name: 'Unit Test - Biology',
    totalMarks: 40,
    duration: 45,
    sections: [
      {
        name: 'Section A',
        instructions: 'Choose the correct answer',
        totalMarks: 10,
        marksPerQuestion: 1,
        questions: [
          {
            number: 1,
            text: 'What is photosynthesis?',
            marks: 1,
            type: 'mcq' as const,
            options: ['A) Breathing', 'B) Food making', 'C) Sleeping', 'D) Growing'],
          },
        ],
      },
      {
        name: 'Section B',
        instructions: 'Write short answers',
        totalMarks: 20,
        marksPerQuestion: 2,
        questions: [
          {
            number: 1,
            text: 'Explain cellular respiration.',
            marks: 2,
            type: 'short_answer' as const,
          },
        ],
      },
    ],
  };

  it('includes paper title', () => {
    const html = formatQuestionPaperForPrint(samplePaper, false);
    expect(html).toContain('Unit Test - Biology');
  });

  it('includes total marks and duration', () => {
    const html = formatQuestionPaperForPrint(samplePaper, false);
    expect(html).toContain('40');
    expect(html).toContain('45 minutes');
  });

  it('includes section names with marks', () => {
    const html = formatQuestionPaperForPrint(samplePaper, false);
    expect(html).toContain('Section A');
    expect(html).toContain('10 marks');
    expect(html).toContain('Section B');
    expect(html).toContain('20 marks');
  });

  it('includes questions with marks', () => {
    const html = formatQuestionPaperForPrint(samplePaper, false);
    expect(html).toContain('What is photosynthesis?');
    expect(html).toContain('[1 mark]');
    expect(html).toContain('Explain cellular respiration');
    expect(html).toContain('[2 marks]');
  });

  it('includes MCQ options', () => {
    const html = formatQuestionPaperForPrint(samplePaper, false);
    expect(html).toContain('A) Breathing');
    expect(html).toContain('B) Food making');
  });

  it('does not include answer key when includeAnswers is false', () => {
    const html = formatQuestionPaperForPrint(samplePaper, false);
    expect(html).not.toContain('Answer Key');
  });

  it('includes answer key when includeAnswers is true', () => {
    const answerKey = [
      { questionNumber: 'A1', answer: 'B' },
      { questionNumber: 'B1', answer: 'Process of breaking down glucose' },
    ];
    const html = formatQuestionPaperForPrint(samplePaper, true, answerKey);
    expect(html).toContain('Answer Key');
    expect(html).toContain('A1');
    expect(html).toContain('B');
  });
});
