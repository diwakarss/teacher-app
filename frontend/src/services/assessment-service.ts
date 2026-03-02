import { getDb, persistDb } from '@/lib/db/database';
import type { Assessment, NewAssessment } from '@/lib/db/schema';
import { v4 as uuid } from 'uuid';

export type AssessmentType = 'unit' | 'monthly' | 'term' | 'quiz';

export const ASSESSMENT_TYPES: { value: AssessmentType; label: string }[] = [
  { value: 'quiz', label: 'Quiz' },
  { value: 'unit', label: 'Unit Test' },
  { value: 'monthly', label: 'Monthly Test' },
  { value: 'term', label: 'Term Exam' },
];

export const assessmentService = {
  async getBySubject(subjectId: string): Promise<Assessment[]> {
    const db = await getDb();
    const stmt = db.prepare(
      'SELECT id, name, type, subject_id, class_id, max_marks, date, term, created_at, updated_at FROM assessments WHERE subject_id = ? ORDER BY date DESC'
    );
    stmt.bind([subjectId]);

    const assessments: Assessment[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      assessments.push({
        id: row[0] as string,
        name: row[1] as string,
        type: row[2] as string,
        subjectId: row[3] as string,
        classId: row[4] as string,
        maxMarks: row[5] as number,
        date: row[6] as string,
        term: row[7] as number,
        createdAt: row[8] as string,
        updatedAt: row[9] as string,
      });
    }
    stmt.free();

    return assessments;
  },

  async getByClass(classId: string): Promise<Assessment[]> {
    const db = await getDb();
    const stmt = db.prepare(
      'SELECT id, name, type, subject_id, class_id, max_marks, date, term, created_at, updated_at FROM assessments WHERE class_id = ? ORDER BY date DESC'
    );
    stmt.bind([classId]);

    const assessments: Assessment[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      assessments.push({
        id: row[0] as string,
        name: row[1] as string,
        type: row[2] as string,
        subjectId: row[3] as string,
        classId: row[4] as string,
        maxMarks: row[5] as number,
        date: row[6] as string,
        term: row[7] as number,
        createdAt: row[8] as string,
        updatedAt: row[9] as string,
      });
    }
    stmt.free();

    return assessments;
  },

  async getById(id: string): Promise<Assessment | null> {
    const db = await getDb();
    const stmt = db.prepare(
      'SELECT id, name, type, subject_id, class_id, max_marks, date, term, created_at, updated_at FROM assessments WHERE id = ?'
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
      name: row[1] as string,
      type: row[2] as string,
      subjectId: row[3] as string,
      classId: row[4] as string,
      maxMarks: row[5] as number,
      date: row[6] as string,
      term: row[7] as number,
      createdAt: row[8] as string,
      updatedAt: row[9] as string,
    };
  },

  async create(
    data: Omit<NewAssessment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Assessment> {
    const db = await getDb();
    const now = new Date().toISOString();
    const id = uuid();

    const stmt = db.prepare(
      'INSERT INTO assessments (id, name, type, subject_id, class_id, max_marks, date, term, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run([
      id,
      data.name,
      data.type,
      data.subjectId,
      data.classId,
      data.maxMarks,
      data.date,
      data.term,
      now,
      now,
    ]);
    stmt.free();

    await persistDb();

    return {
      id,
      name: data.name,
      type: data.type,
      subjectId: data.subjectId,
      classId: data.classId,
      maxMarks: data.maxMarks,
      date: data.date,
      term: data.term,
      createdAt: now,
      updatedAt: now,
    };
  },

  async update(
    id: string,
    data: Partial<Omit<Assessment, 'id' | 'createdAt'>>
  ): Promise<Assessment> {
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Assessment with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: now,
    };

    const stmt = db.prepare(
      'UPDATE assessments SET name = ?, type = ?, max_marks = ?, date = ?, term = ?, updated_at = ? WHERE id = ?'
    );
    stmt.run([
      updated.name,
      updated.type,
      updated.maxMarks,
      updated.date,
      updated.term,
      now,
      id,
    ]);
    stmt.free();

    await persistDb();

    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM assessments WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    await persistDb();
  },
};
