import { getDb, persistDb } from '@/lib/db/database';
import type { Subject, NewSubject } from '@/lib/db/schema';
import { v4 as uuid } from 'uuid';

export interface IGCSESubjectTemplate {
  name: string;
  code: string;
}

export const IGCSE_SUBJECTS: IGCSESubjectTemplate[] = [
  { name: 'English Language', code: '0500' },
  { name: 'English Literature', code: '0475' },
  { name: 'Mathematics', code: '0580' },
  { name: 'Additional Mathematics', code: '0606' },
  { name: 'Physics', code: '0625' },
  { name: 'Chemistry', code: '0620' },
  { name: 'Biology', code: '0610' },
  { name: 'Combined Science', code: '0653' },
  { name: 'Computer Science', code: '0478' },
  { name: 'ICT', code: '0417' },
  { name: 'Economics', code: '0455' },
  { name: 'Business Studies', code: '0450' },
  { name: 'Accounting', code: '0452' },
  { name: 'History', code: '0470' },
  { name: 'Geography', code: '0460' },
  { name: 'French', code: '0520' },
  { name: 'Spanish', code: '0530' },
  { name: 'Art & Design', code: '0400' },
  { name: 'Music', code: '0410' },
  { name: 'Physical Education', code: '0413' },
];

export const subjectService = {
  async getByClassId(classId: string): Promise<Subject[]> {
    const db = await getDb();
    const stmt = db.prepare(
      'SELECT id, name, class_id, created_at, updated_at FROM subjects WHERE class_id = ? ORDER BY name ASC'
    );
    stmt.bind([classId]);

    const subjects: Subject[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      subjects.push({
        id: row[0] as string,
        name: row[1] as string,
        classId: row[2] as string,
        createdAt: row[3] as string,
        updatedAt: row[4] as string,
      });
    }
    stmt.free();

    return subjects;
  },

  async getById(id: string): Promise<Subject | null> {
    const db = await getDb();
    const stmt = db.prepare(
      'SELECT id, name, class_id, created_at, updated_at FROM subjects WHERE id = ?'
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
      classId: row[2] as string,
      createdAt: row[3] as string,
      updatedAt: row[4] as string,
    };
  },

  async create(data: Omit<NewSubject, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subject> {
    const db = await getDb();
    const now = new Date().toISOString();
    const id = uuid();

    const stmt = db.prepare(
      'INSERT INTO subjects (id, name, class_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run([id, data.name, data.classId, now, now]);
    stmt.free();

    await persistDb();

    return {
      id,
      name: data.name,
      classId: data.classId,
      createdAt: now,
      updatedAt: now,
    };
  },

  async createMany(classId: string, names: string[]): Promise<Subject[]> {
    const db = await getDb();
    const now = new Date().toISOString();
    const subjects: Subject[] = [];

    const stmt = db.prepare(
      'INSERT INTO subjects (id, name, class_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    );

    for (const name of names) {
      const id = uuid();
      stmt.run([id, name, classId, now, now]);
      subjects.push({
        id,
        name,
        classId,
        createdAt: now,
        updatedAt: now,
      });
    }

    stmt.free();
    await persistDb();
    return subjects;
  },

  async update(id: string, data: Partial<Omit<Subject, 'id' | 'classId' | 'createdAt'>>): Promise<Subject> {
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Subject with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: now,
    };

    const stmt = db.prepare('UPDATE subjects SET name = ?, updated_at = ? WHERE id = ?');
    stmt.run([updated.name, now, id]);
    stmt.free();

    await persistDb();

    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM subjects WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    await persistDb();
  },

  async deleteByClassId(classId: string): Promise<void> {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM subjects WHERE class_id = ?');
    stmt.run([classId]);
    stmt.free();
    await persistDb();
  },
};
