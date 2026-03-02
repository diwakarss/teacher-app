import { getDb, persistDb } from '@/lib/db/database';
import type { QuestionPaper, NewQuestionPaper } from '@/lib/db/schema';
import type {
  QuestionPaperOutput,
  Section,
  QuestionPaperPromptInput,
} from '@/lib/prompts/question-paper-prompt';
import {
  parseQuestionPaperResponse,
  getDefaultDistribution,
} from '@/lib/prompts/question-paper-prompt';
import { v4 as uuid } from 'uuid';

export type QuestionPaperDifficulty = 'easy' | 'medium' | 'hard' | 'mixed';
export type QuestionPaperTemplate =
  | 'unit_test'
  | 'monthly_test'
  | 'term_exam'
  | 'custom';

export interface GenerateQuestionPaperParams {
  subjectId: string;
  subjectName: string;
  chapterIds: string[];
  chaptersContent: { name: string; content: string }[];
  totalMarks: number;
  duration: number;
  difficulty: QuestionPaperDifficulty;
  template: QuestionPaperTemplate;
  sectionDistribution?: {
    sectionA: { count: number; marksEach: number };
    sectionB: { count: number; marksEach: number };
    sectionC: { count: number; marksEach: number };
  };
}

export interface QuestionPaperWithParsed extends QuestionPaper {
  parsedChapterIds: string[];
  parsedSections: Section[];
  parsedAnswerKey: Array<{ questionNumber: string; answer: string }>;
}

export const questionPaperService = {
  async getBySubjectId(subjectId: string): Promise<QuestionPaper[]> {
    const db = await getDb();
    const stmt = db.prepare(
      `SELECT id, subject_id, chapter_ids, name, total_marks, duration, difficulty, template, sections, answer_key, created_at, updated_at
       FROM question_papers WHERE subject_id = ? ORDER BY created_at DESC`
    );
    stmt.bind([subjectId]);

    const papers: QuestionPaper[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      papers.push({
        id: row[0] as string,
        subjectId: row[1] as string,
        chapterIds: row[2] as string,
        name: row[3] as string,
        totalMarks: row[4] as number,
        duration: row[5] as number,
        difficulty: row[6] as string,
        template: row[7] as string,
        sections: row[8] as string,
        answerKey: row[9] as string,
        createdAt: row[10] as string,
        updatedAt: row[11] as string,
      });
    }
    stmt.free();

    return papers;
  },

  async getById(id: string): Promise<QuestionPaper | null> {
    const db = await getDb();
    const stmt = db.prepare(
      `SELECT id, subject_id, chapter_ids, name, total_marks, duration, difficulty, template, sections, answer_key, created_at, updated_at
       FROM question_papers WHERE id = ?`
    );
    stmt.bind([id]);

    if (!stmt.step()) {
      stmt.free();
      return null;
    }

    const row = stmt.get();
    stmt.free();

    return {
      id: row[0] as string,
      subjectId: row[1] as string,
      chapterIds: row[2] as string,
      name: row[3] as string,
      totalMarks: row[4] as number,
      duration: row[5] as number,
      difficulty: row[6] as string,
      template: row[7] as string,
      sections: row[8] as string,
      answerKey: row[9] as string,
      createdAt: row[10] as string,
      updatedAt: row[11] as string,
    };
  },

  async getAll(): Promise<QuestionPaper[]> {
    const db = await getDb();
    const stmt = db.prepare(
      `SELECT id, subject_id, chapter_ids, name, total_marks, duration, difficulty, template, sections, answer_key, created_at, updated_at
       FROM question_papers ORDER BY created_at DESC`
    );

    const papers: QuestionPaper[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      papers.push({
        id: row[0] as string,
        subjectId: row[1] as string,
        chapterIds: row[2] as string,
        name: row[3] as string,
        totalMarks: row[4] as number,
        duration: row[5] as number,
        difficulty: row[6] as string,
        template: row[7] as string,
        sections: row[8] as string,
        answerKey: row[9] as string,
        createdAt: row[10] as string,
        updatedAt: row[11] as string,
      });
    }
    stmt.free();

    return papers;
  },

  async create(
    data: Omit<NewQuestionPaper, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<QuestionPaper> {
    const db = await getDb();
    const now = new Date().toISOString();
    const id = uuid();

    const stmt = db.prepare(
      `INSERT INTO question_papers (id, subject_id, chapter_ids, name, total_marks, duration, difficulty, template, sections, answer_key, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run([
      id,
      data.subjectId,
      data.chapterIds,
      data.name,
      data.totalMarks,
      data.duration,
      data.difficulty,
      data.template,
      data.sections,
      data.answerKey,
      now,
      now,
    ]);
    stmt.free();

    await persistDb();

    return {
      id,
      subjectId: data.subjectId,
      chapterIds: data.chapterIds,
      name: data.name,
      totalMarks: data.totalMarks,
      duration: data.duration,
      difficulty: data.difficulty,
      template: data.template,
      sections: data.sections,
      answerKey: data.answerKey,
      createdAt: now,
      updatedAt: now,
    };
  },

  async update(
    id: string,
    data: Partial<Omit<QuestionPaper, 'id' | 'subjectId' | 'createdAt'>>
  ): Promise<QuestionPaper> {
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Question paper with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: now,
    };

    const stmt = db.prepare(
      `UPDATE question_papers SET chapter_ids = ?, name = ?, total_marks = ?, duration = ?, difficulty = ?, template = ?, sections = ?, answer_key = ?, updated_at = ? WHERE id = ?`
    );
    stmt.run([
      updated.chapterIds,
      updated.name,
      updated.totalMarks,
      updated.duration,
      updated.difficulty,
      updated.template,
      updated.sections,
      updated.answerKey,
      now,
      id,
    ]);
    stmt.free();

    await persistDb();

    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM question_papers WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    await persistDb();
  },

  async generate(
    params: GenerateQuestionPaperParams
  ): Promise<QuestionPaperOutput> {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'question_paper',
        chaptersContent: params.chaptersContent,
        subjectName: params.subjectName,
        totalMarks: params.totalMarks,
        duration: params.duration,
        difficulty: params.difficulty,
        template: params.template,
        sectionDistribution: params.sectionDistribution,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate question paper');
    }

    const data = await response.json();
    if (!data.success || !data.content) {
      throw new Error('Generation failed: No content returned');
    }

    const parsed = parseQuestionPaperResponse(data.content);
    if (!parsed) {
      throw new Error('Failed to parse AI response');
    }

    return parsed;
  },

  async saveGenerated(
    params: GenerateQuestionPaperParams,
    output: QuestionPaperOutput
  ): Promise<QuestionPaper> {
    return this.create({
      subjectId: params.subjectId,
      chapterIds: JSON.stringify(params.chapterIds),
      name: output.name,
      totalMarks: params.totalMarks,
      duration: params.duration,
      difficulty: params.difficulty,
      template: params.template,
      sections: JSON.stringify(output.sections),
      answerKey: JSON.stringify(output.answerKey),
    });
  },

  parsePaper(paper: QuestionPaper): QuestionPaperWithParsed {
    return {
      ...paper,
      parsedChapterIds: JSON.parse(paper.chapterIds) as string[],
      parsedSections: JSON.parse(paper.sections) as Section[],
      parsedAnswerKey: JSON.parse(paper.answerKey) as Array<{
        questionNumber: string;
        answer: string;
      }>,
    };
  },

  getDefaultDistribution,

  getTemplateInfo(
    template: QuestionPaperTemplate
  ): { totalMarks: number; duration: number } {
    switch (template) {
      case 'unit_test':
        return { totalMarks: 40, duration: 45 };
      case 'monthly_test':
        return { totalMarks: 50, duration: 60 };
      case 'term_exam':
        return { totalMarks: 100, duration: 180 };
      default:
        return { totalMarks: 50, duration: 60 };
    }
  },

  async getCount(): Promise<number> {
    const db = await getDb();
    const stmt = db.prepare('SELECT COUNT(*) FROM question_papers');
    stmt.step();
    const row = stmt.get();
    stmt.free();
    return row[0] as number;
  },

  async getRecent(limit: number = 5): Promise<QuestionPaper[]> {
    const db = await getDb();
    const stmt = db.prepare(
      `SELECT id, subject_id, chapter_ids, name, total_marks, duration, difficulty, template, sections, answer_key, created_at, updated_at
       FROM question_papers ORDER BY created_at DESC LIMIT ?`
    );
    stmt.bind([limit]);

    const papers: QuestionPaper[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      papers.push({
        id: row[0] as string,
        subjectId: row[1] as string,
        chapterIds: row[2] as string,
        name: row[3] as string,
        totalMarks: row[4] as number,
        duration: row[5] as number,
        difficulty: row[6] as string,
        template: row[7] as string,
        sections: row[8] as string,
        answerKey: row[9] as string,
        createdAt: row[10] as string,
        updatedAt: row[11] as string,
      });
    }
    stmt.free();

    return papers;
  },
};
