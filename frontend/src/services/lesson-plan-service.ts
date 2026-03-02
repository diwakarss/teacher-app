import { getDb, persistDb } from '@/lib/db/database';
import type { LessonPlan, NewLessonPlan } from '@/lib/db/schema';
import type {
  LessonPlanOutput,
  LessonPlanSections,
} from '@/lib/prompts/lesson-plan-prompt';
import { parseLessonPlanResponse } from '@/lib/prompts/lesson-plan-prompt';
import { v4 as uuid } from 'uuid';

export interface GenerateLessonPlanParams {
  chapterId: string;
  subjectId: string;
  chapterName: string;
  chapterContent: string;
  subjectName: string;
  duration: number;
  customObjectives?: string[];
}

export interface LessonPlanWithParsed extends LessonPlan {
  parsedObjectives: string[];
  parsedSections: LessonPlanSections;
  parsedMaterials: string[];
}

export const lessonPlanService = {
  async getByChapterId(chapterId: string): Promise<LessonPlan[]> {
    const db = await getDb();
    const stmt = db.prepare(
      `SELECT id, chapter_id, subject_id, name, duration, objectives, sections, materials, created_at, updated_at
       FROM lesson_plans WHERE chapter_id = ? ORDER BY created_at DESC`
    );
    stmt.bind([chapterId]);

    const plans: LessonPlan[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      plans.push({
        id: row[0] as string,
        chapterId: row[1] as string,
        subjectId: row[2] as string,
        name: row[3] as string,
        duration: row[4] as number,
        objectives: row[5] as string,
        sections: row[6] as string,
        materials: row[7] as string | null,
        createdAt: row[8] as string,
        updatedAt: row[9] as string,
      });
    }
    stmt.free();

    return plans;
  },

  async getBySubjectId(subjectId: string): Promise<LessonPlan[]> {
    const db = await getDb();
    const stmt = db.prepare(
      `SELECT id, chapter_id, subject_id, name, duration, objectives, sections, materials, created_at, updated_at
       FROM lesson_plans WHERE subject_id = ? ORDER BY created_at DESC`
    );
    stmt.bind([subjectId]);

    const plans: LessonPlan[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      plans.push({
        id: row[0] as string,
        chapterId: row[1] as string,
        subjectId: row[2] as string,
        name: row[3] as string,
        duration: row[4] as number,
        objectives: row[5] as string,
        sections: row[6] as string,
        materials: row[7] as string | null,
        createdAt: row[8] as string,
        updatedAt: row[9] as string,
      });
    }
    stmt.free();

    return plans;
  },

  async getById(id: string): Promise<LessonPlan | null> {
    const db = await getDb();
    const stmt = db.prepare(
      `SELECT id, chapter_id, subject_id, name, duration, objectives, sections, materials, created_at, updated_at
       FROM lesson_plans WHERE id = ?`
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
      chapterId: row[1] as string,
      subjectId: row[2] as string,
      name: row[3] as string,
      duration: row[4] as number,
      objectives: row[5] as string,
      sections: row[6] as string,
      materials: row[7] as string | null,
      createdAt: row[8] as string,
      updatedAt: row[9] as string,
    };
  },

  async getAll(): Promise<LessonPlan[]> {
    const db = await getDb();
    const stmt = db.prepare(
      `SELECT id, chapter_id, subject_id, name, duration, objectives, sections, materials, created_at, updated_at
       FROM lesson_plans ORDER BY created_at DESC`
    );

    const plans: LessonPlan[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      plans.push({
        id: row[0] as string,
        chapterId: row[1] as string,
        subjectId: row[2] as string,
        name: row[3] as string,
        duration: row[4] as number,
        objectives: row[5] as string,
        sections: row[6] as string,
        materials: row[7] as string | null,
        createdAt: row[8] as string,
        updatedAt: row[9] as string,
      });
    }
    stmt.free();

    return plans;
  },

  async create(
    data: Omit<NewLessonPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<LessonPlan> {
    const db = await getDb();
    const now = new Date().toISOString();
    const id = uuid();

    const stmt = db.prepare(
      `INSERT INTO lesson_plans (id, chapter_id, subject_id, name, duration, objectives, sections, materials, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run([
      id,
      data.chapterId,
      data.subjectId,
      data.name,
      data.duration,
      data.objectives,
      data.sections,
      data.materials ?? null,
      now,
      now,
    ]);
    stmt.free();

    await persistDb();

    return {
      id,
      chapterId: data.chapterId,
      subjectId: data.subjectId,
      name: data.name,
      duration: data.duration,
      objectives: data.objectives,
      sections: data.sections,
      materials: data.materials ?? null,
      createdAt: now,
      updatedAt: now,
    };
  },

  async update(
    id: string,
    data: Partial<Omit<LessonPlan, 'id' | 'chapterId' | 'subjectId' | 'createdAt'>>
  ): Promise<LessonPlan> {
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Lesson plan with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: now,
    };

    const stmt = db.prepare(
      `UPDATE lesson_plans SET name = ?, duration = ?, objectives = ?, sections = ?, materials = ?, updated_at = ? WHERE id = ?`
    );
    stmt.run([
      updated.name,
      updated.duration,
      updated.objectives,
      updated.sections,
      updated.materials,
      now,
      id,
    ]);
    stmt.free();

    await persistDb();

    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM lesson_plans WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    await persistDb();
  },

  async deleteByChapterId(chapterId: string): Promise<void> {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM lesson_plans WHERE chapter_id = ?');
    stmt.run([chapterId]);
    stmt.free();
    await persistDb();
  },

  async generate(params: GenerateLessonPlanParams): Promise<LessonPlanOutput> {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'lesson_plan',
        chapterContent: params.chapterContent,
        chapterName: params.chapterName,
        subjectName: params.subjectName,
        duration: params.duration,
        customObjectives: params.customObjectives,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate lesson plan');
    }

    const data = await response.json();
    if (!data.success || !data.content) {
      throw new Error('Generation failed: No content returned');
    }

    const parsed = parseLessonPlanResponse(data.content);
    if (!parsed) {
      throw new Error('Failed to parse AI response');
    }

    return parsed;
  },

  async saveGenerated(
    params: GenerateLessonPlanParams,
    output: LessonPlanOutput
  ): Promise<LessonPlan> {
    return this.create({
      chapterId: params.chapterId,
      subjectId: params.subjectId,
      name: output.name,
      duration: params.duration,
      objectives: JSON.stringify(output.objectives),
      sections: JSON.stringify(output.sections),
      materials: output.materials ? JSON.stringify(output.materials) : null,
    });
  },

  parsePlan(plan: LessonPlan): LessonPlanWithParsed {
    return {
      ...plan,
      parsedObjectives: JSON.parse(plan.objectives) as string[],
      parsedSections: JSON.parse(plan.sections) as LessonPlanSections,
      parsedMaterials: plan.materials
        ? (JSON.parse(plan.materials) as string[])
        : [],
    };
  },

  async getCount(): Promise<number> {
    const db = await getDb();
    const stmt = db.prepare('SELECT COUNT(*) FROM lesson_plans');
    stmt.step();
    const row = stmt.get();
    stmt.free();
    return row[0] as number;
  },

  async getRecent(limit: number = 5): Promise<LessonPlan[]> {
    const db = await getDb();
    const stmt = db.prepare(
      `SELECT id, chapter_id, subject_id, name, duration, objectives, sections, materials, created_at, updated_at
       FROM lesson_plans ORDER BY created_at DESC LIMIT ?`
    );
    stmt.bind([limit]);

    const plans: LessonPlan[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      plans.push({
        id: row[0] as string,
        chapterId: row[1] as string,
        subjectId: row[2] as string,
        name: row[3] as string,
        duration: row[4] as number,
        objectives: row[5] as string,
        sections: row[6] as string,
        materials: row[7] as string | null,
        createdAt: row[8] as string,
        updatedAt: row[9] as string,
      });
    }
    stmt.free();

    return plans;
  },
};
