import { getDb, persistDb } from '@/lib/db/database';
import type { Student, NewStudent } from '@/lib/db/schema';
import { v4 as uuid } from 'uuid';

export const studentService = {
  async getByClassId(classId: string): Promise<Student[]> {
    const db = await getDb();
    const stmt = db.prepare(
      'SELECT id, name, roll_number, class_id, parent_name, parent_phone, parent_email, created_at, updated_at FROM students WHERE class_id = ? ORDER BY roll_number ASC'
    );
    stmt.bind([classId]);

    const students: Student[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      students.push({
        id: row[0] as string,
        name: row[1] as string,
        rollNumber: row[2] as string,
        classId: row[3] as string,
        parentName: row[4] as string | null,
        parentPhone: row[5] as string | null,
        parentEmail: row[6] as string | null,
        createdAt: row[7] as string,
        updatedAt: row[8] as string,
      });
    }
    stmt.free();

    return students;
  },

  async getById(id: string): Promise<Student | null> {
    const db = await getDb();
    const stmt = db.prepare(
      'SELECT id, name, roll_number, class_id, parent_name, parent_phone, parent_email, created_at, updated_at FROM students WHERE id = ?'
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
      rollNumber: row[2] as string,
      classId: row[3] as string,
      parentName: row[4] as string | null,
      parentPhone: row[5] as string | null,
      parentEmail: row[6] as string | null,
      createdAt: row[7] as string,
      updatedAt: row[8] as string,
    };
  },

  async search(classId: string, query: string): Promise<Student[]> {
    const db = await getDb();
    const searchTerm = `%${query}%`;
    const stmt = db.prepare(
      'SELECT id, name, roll_number, class_id, parent_name, parent_phone, parent_email, created_at, updated_at FROM students WHERE class_id = ? AND (name LIKE ? OR roll_number LIKE ?) ORDER BY roll_number ASC'
    );
    stmt.bind([classId, searchTerm, searchTerm]);

    const students: Student[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      students.push({
        id: row[0] as string,
        name: row[1] as string,
        rollNumber: row[2] as string,
        classId: row[3] as string,
        parentName: row[4] as string | null,
        parentPhone: row[5] as string | null,
        parentEmail: row[6] as string | null,
        createdAt: row[7] as string,
        updatedAt: row[8] as string,
      });
    }
    stmt.free();

    return students;
  },

  async create(data: Omit<NewStudent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> {
    const db = await getDb();
    const now = new Date().toISOString();
    const id = uuid();

    const stmt = db.prepare(
      'INSERT INTO students (id, name, roll_number, class_id, parent_name, parent_phone, parent_email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run([
      id,
      data.name,
      data.rollNumber,
      data.classId,
      data.parentName || null,
      data.parentPhone || null,
      data.parentEmail || null,
      now,
      now,
    ]);
    stmt.free();

    await persistDb();

    return {
      id,
      name: data.name,
      rollNumber: data.rollNumber,
      classId: data.classId,
      parentName: data.parentName || null,
      parentPhone: data.parentPhone || null,
      parentEmail: data.parentEmail || null,
      createdAt: now,
      updatedAt: now,
    };
  },

  async update(
    id: string,
    data: Partial<Omit<Student, 'id' | 'classId' | 'createdAt'>>
  ): Promise<Student> {
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Student with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: now,
    };

    const stmt = db.prepare(
      'UPDATE students SET name = ?, roll_number = ?, parent_name = ?, parent_phone = ?, parent_email = ?, updated_at = ? WHERE id = ?'
    );
    stmt.run([
      updated.name,
      updated.rollNumber,
      updated.parentName,
      updated.parentPhone,
      updated.parentEmail,
      now,
      id,
    ]);
    stmt.free();

    await persistDb();

    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM students WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    await persistDb();
  },

  async getCount(classId: string): Promise<number> {
    const db = await getDb();
    const stmt = db.prepare('SELECT COUNT(*) FROM students WHERE class_id = ?');
    stmt.bind([classId]);
    stmt.step();
    const count = stmt.get()[0] as number;
    stmt.free();
    return count;
  },
};
