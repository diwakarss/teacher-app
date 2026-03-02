import { describe, it, expect } from 'vitest';
import {
  detectChapters,
  detectChapterFromFilename,
  suggestChapterName,
} from './chapter-detector';

describe('detectChapters', () => {
  it('detects "Chapter X: Title" format', () => {
    const text = `Chapter 1: Introduction
This is the introduction content.

Chapter 2: Getting Started
This is chapter 2 content.`;

    const chapters = detectChapters(text);

    expect(chapters).toHaveLength(2);
    expect(chapters[0].name).toBe('Introduction');
    expect(chapters[0].chapterNumber).toBe(1);
    expect(chapters[1].name).toBe('Getting Started');
    expect(chapters[1].chapterNumber).toBe(2);
  });

  it('detects "CHAPTER X" uppercase format', () => {
    const text = `CHAPTER 1
Content for chapter one.

CHAPTER 2 - Advanced Topics
Content for chapter two.`;

    const chapters = detectChapters(text);

    expect(chapters).toHaveLength(2);
    expect(chapters[0].chapterNumber).toBe(1);
    expect(chapters[1].name).toBe('Advanced Topics');
  });

  it('detects "Unit X" format', () => {
    const text = `Unit 1: Basics
Unit content here.

Unit 2: Intermediate
More content.`;

    const chapters = detectChapters(text);

    expect(chapters).toHaveLength(2);
    expect(chapters[0].name).toBe('Basics');
    expect(chapters[1].name).toBe('Intermediate');
  });

  it('detects "Lesson X" format', () => {
    const text = `Lesson 1 - First Steps
Lesson content.

Lesson 2: Second Steps
More lesson content.`;

    const chapters = detectChapters(text);

    expect(chapters).toHaveLength(2);
    expect(chapters[0].name).toBe('First Steps');
    expect(chapters[1].name).toBe('Second Steps');
  });

  it('detects "Module X" format', () => {
    const text = `Module 1: Overview
Module overview content.`;

    const chapters = detectChapters(text);

    expect(chapters).toHaveLength(1);
    expect(chapters[0].name).toBe('Overview');
    expect(chapters[0].chapterNumber).toBe(1);
  });

  it('detects "Topic X" format', () => {
    const text = `Topic 1: Introduction to Math
Math intro content.

Topic 2: Algebra
Algebra content.`;

    const chapters = detectChapters(text);

    expect(chapters).toHaveLength(2);
    expect(chapters[0].name).toBe('Introduction to Math');
    expect(chapters[1].name).toBe('Algebra');
  });

  it('captures chapter content correctly', () => {
    const text = `Chapter 1: Intro
Line 1 of intro.
Line 2 of intro.

Chapter 2: Next
Line 1 of next.`;

    const chapters = detectChapters(text);

    expect(chapters[0].content).toContain('Line 1 of intro');
    expect(chapters[0].content).toContain('Line 2 of intro');
    expect(chapters[0].content).not.toContain('Line 1 of next');
  });

  it('returns empty array for text without chapters', () => {
    const text = `This is just regular text.
No chapter markers here.
Just plain content.`;

    const chapters = detectChapters(text);

    expect(chapters).toHaveLength(0);
  });

  it('handles chapter with no title', () => {
    const text = `Chapter 5
Content without explicit title.`;

    const chapters = detectChapters(text);

    expect(chapters).toHaveLength(1);
    expect(chapters[0].name).toBe('Chapter 5');
    expect(chapters[0].chapterNumber).toBe(5);
  });
});

describe('detectChapterFromFilename', () => {
  it('detects "Chapter_X_Name" pattern', () => {
    const result = detectChapterFromFilename('Chapter_5_Fractions.pdf');

    expect(result).not.toBeNull();
    expect(result?.chapterNumber).toBe(5);
    expect(result?.name).toBe('Fractions');
  });

  it('detects "ch5-name" pattern', () => {
    const result = detectChapterFromFilename('ch5-basic-algebra.pdf');

    expect(result).not.toBeNull();
    expect(result?.chapterNumber).toBe(5);
    expect(result?.name).toBe('Basic Algebra');
  });

  it('detects "unit_X_name" pattern', () => {
    const result = detectChapterFromFilename('unit_3_geometry.pdf');

    expect(result).not.toBeNull();
    expect(result?.chapterNumber).toBe(3);
    expect(result?.name).toBe('Geometry');
  });

  it('detects "lesson-X" pattern without name', () => {
    const result = detectChapterFromFilename('lesson-7.pdf');

    expect(result).not.toBeNull();
    expect(result?.chapterNumber).toBe(7);
    expect(result?.name).toBe('Chapter 7');
  });

  it('returns null for unrecognized filenames', () => {
    const result = detectChapterFromFilename('random_document.pdf');

    expect(result).toBeNull();
  });

  it('handles mixed case', () => {
    const result = detectChapterFromFilename('CHAPTER_2_INTRO.pdf');

    expect(result).not.toBeNull();
    expect(result?.chapterNumber).toBe(2);
  });
});

describe('suggestChapterName', () => {
  it('prioritizes detected chapters from content', () => {
    const text = `Chapter 3: Quadratic Equations
Content about quadratics.`;

    const result = suggestChapterName(text, 'some_file.pdf', 1);

    expect(result.name).toBe('Quadratic Equations');
    expect(result.chapterNumber).toBe(3);
  });

  it('falls back to filename when no chapters in content', () => {
    const text = 'Just some plain text without chapter markers.';

    const result = suggestChapterName(text, 'Chapter_4_Triangles.pdf', 1);

    expect(result.name).toBe('Triangles');
    expect(result.chapterNumber).toBe(4);
  });

  it('uses first meaningful line as fallback', () => {
    const text = `Introduction to Biology
This document covers the basics of biology.`;

    const result = suggestChapterName(text, 'random.pdf', 5);

    expect(result.name).toBe('Introduction to Biology');
    expect(result.chapterNumber).toBe(5);
  });

  it('uses default number when no pattern found', () => {
    const text = 'Short.';

    const result = suggestChapterName(text, 'doc.pdf', 10);

    expect(result.name).toBe('Chapter 10');
    expect(result.chapterNumber).toBe(10);
  });

  it('handles empty text gracefully', () => {
    const result = suggestChapterName('', 'file.pdf', 1);

    expect(result.name).toBe('Chapter 1');
    expect(result.chapterNumber).toBe(1);
  });

  it('truncates long first lines', () => {
    const text =
      'This is a very long line that should be truncated because it exceeds the maximum length allowed for chapter names in the system so we need to cut it off.';

    const result = suggestChapterName(text, 'file.pdf', 1);

    expect(result.name.length).toBeLessThanOrEqual(50);
  });
});
