import { describe, it, expect } from 'vitest';
import {
  buildLessonPlanPrompt,
  parseLessonPlanResponse,
  type LessonPlanOutput,
} from './lesson-plan-prompt';

describe('buildLessonPlanPrompt', () => {
  it('builds prompt with chapter info', () => {
    const prompt = buildLessonPlanPrompt({
      chapterContent: 'Photosynthesis is the process...',
      chapterName: 'Photosynthesis',
      subjectName: 'Biology',
      duration: 45,
    });

    expect(prompt).toContain('Biology');
    expect(prompt).toContain('Photosynthesis');
    expect(prompt).toContain('45 minutes');
    expect(prompt).toContain('Extract 3-5 key learning objectives');
  });

  it('uses custom objectives when provided', () => {
    const prompt = buildLessonPlanPrompt({
      chapterContent: 'Content here',
      chapterName: 'Chapter 1',
      subjectName: 'Science',
      duration: 60,
      customObjectives: ['Understand X', 'Apply Y'],
    });

    expect(prompt).toContain('Use these learning objectives');
    expect(prompt).toContain('Understand X');
    expect(prompt).toContain('Apply Y');
  });

  it('truncates very long content', () => {
    const longContent = 'x'.repeat(100000);
    const prompt = buildLessonPlanPrompt({
      chapterContent: longContent,
      chapterName: 'Long Chapter',
      subjectName: 'Test',
      duration: 30,
    });

    // Content is truncated to 50000 chars
    expect(prompt.length).toBeLessThan(longContent.length);
  });
});

describe('parseLessonPlanResponse', () => {
  const validResponse: LessonPlanOutput = {
    name: 'Introduction to Photosynthesis',
    objectives: ['Understand the process', 'Identify key components'],
    sections: {
      introduction: {
        duration: 5,
        content: 'Overview of photosynthesis',
        hook: 'What do plants eat?',
      },
      mainContent: {
        duration: 20,
        topics: ['Light reactions', 'Calvin cycle'],
        teachingStrategies: ['Visual aids', 'Group discussion'],
      },
      activities: {
        duration: 15,
        activities: [
          {
            name: 'Leaf experiment',
            description: 'Test for starch',
            materials: ['Leaves', 'Iodine'],
          },
        ],
      },
      assessment: {
        duration: 5,
        methods: ['Quiz', 'Exit ticket'],
        questions: ['What is photosynthesis?'],
      },
      differentiation: {
        advanced: ['Research alternative pathways'],
        struggling: ['Visual summary cards'],
      },
    },
    materials: ['Whiteboard', 'Leaves', 'Iodine'],
  };

  it('parses valid JSON response', () => {
    const result = parseLessonPlanResponse(JSON.stringify(validResponse));
    expect(result).toEqual(validResponse);
  });

  it('extracts JSON from markdown code blocks', () => {
    const response = `Here is the lesson plan:\n\`\`\`json\n${JSON.stringify(validResponse)}\n\`\`\``;
    const result = parseLessonPlanResponse(response);
    expect(result?.name).toBe('Introduction to Photosynthesis');
  });

  it('returns null for invalid JSON', () => {
    const result = parseLessonPlanResponse('not json at all');
    expect(result).toBeNull();
  });

  it('returns null for JSON missing required fields', () => {
    const incomplete = { name: 'Test' }; // missing objectives and sections
    const result = parseLessonPlanResponse(JSON.stringify(incomplete));
    expect(result).toBeNull();
  });

  it('handles malformed JSON gracefully', () => {
    const result = parseLessonPlanResponse('{ name: "broken }');
    expect(result).toBeNull();
  });
});
