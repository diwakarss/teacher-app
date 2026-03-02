import { getDb, persistDb } from '@/lib/db/database';
import type { Class, NewClass } from '@/lib/db/schema';
import { v4 as uuid } from 'uuid';

export const classService = {
  async getAll(): Promise<Class[]> {
    const db = await getDb();
    const result = db.exec(
      'SELECT id, name, academic_year, created_at, updated_at FROM classes ORDER BY created_at DESC'
    );

    if (!result.length || !result[0].values.length) {
      return [];
    }

    return result[0].values.map((row) => ({
      id: row[0] as string,
      name: row[1] as string,
      academicYear: row[2] as string,
      createdAt: row[3] as string,
      updatedAt: row[4] as string,
    }));
  },

  async getById(id: string): Promise<Class | null> {
    const db = await getDb();
    const result = db.exec(
      'SELECT id, name, academic_year, created_at, updated_at FROM classes WHERE id = ?',
      [id]
    );

    if (!result.length || !result[0].values.length) {
      return null;
    }

    const row = result[0].values[0];
    return {
      id: row[0] as string,
      name: row[1] as string,
      academicYear: row[2] as string,
      createdAt: row[3] as string,
      updatedAt: row[4] as string,
    };
  },

  async create(data: Omit<NewClass, 'id' | 'createdAt' | 'updatedAt'>): Promise<Class> {
    const db = await getDb();
    const now = new Date().toISOString();
    const id = uuid();

    db.run(
      'INSERT INTO classes (id, name, academic_year, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, data.name, data.academicYear, now, now]
    );

    await persistDb();

    return {
      id,
      name: data.name,
      academicYear: data.academicYear,
      createdAt: now,
      updatedAt: now,
    };
  },

  async update(id: string, data: Partial<Omit<Class, 'id' | 'createdAt'>>): Promise<Class> {
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Class with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: now,
    };

    db.run(
      'UPDATE classes SET name = ?, academic_year = ?, updated_at = ? WHERE id = ?',
      [updated.name, updated.academicYear, now, id]
    );

    await persistDb();

    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    db.run('DELETE FROM classes WHERE id = ?', [id]);
    await persistDb();
  },
};
