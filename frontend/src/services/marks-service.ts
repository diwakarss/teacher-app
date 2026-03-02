import { getDb, persistDb } from '@/lib/db/database';
import type { Mark, NewMark } from '@/lib/db/schema';
import { v4 as uuid } from 'uuid';

// IGCSE grade boundaries (percentage-based)
export const IGCSE_GRADES = [
  { grade: 'A*', min: 90, max: 100 },
  { grade: 'A', min: 80, max: 89 },
  { grade: 'B', min: 70, max: 79 },
  { grade: 'C', min: 60, max: 69 },
  { grade: 'D', min: 50, max: 59 },
  { grade: 'E', min: 40, max: 49 },
  { grade: 'F', min: 30, max: 39 },
  { grade: 'G', min: 20, max: 29 },
  { grade: 'U', min: 0, max: 19 },
] as const;

export function calculateIGCSEGrade(
  marksObtained: number,
  maxMarks: number
): string {
  if (maxMarks === 0) return 'U';
  const percentage = (marksObtained / maxMarks) * 100;

  for (const { grade, min } of IGCSE_GRADES) {
    if (percentage >= min) {
      return grade;
    }
  }
  return 'U';
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A*':
      return 'text-purple-600 bg-purple-50';
    case 'A':
      return 'text-green-600 bg-green-50';
    case 'B':
      return 'text-blue-600 bg-blue-50';
    case 'C':
      return 'text-teal-600 bg-teal-50';
    case 'D':
      return 'text-yellow-600 bg-yellow-50';
    case 'E':
      return 'text-orange-600 bg-orange-50';
    case 'F':
      return 'text-red-500 bg-red-50';
    case 'G':
      return 'text-red-600 bg-red-50';
    case 'U':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export interface MarkWithStudent extends Mark {
  studentName: string;
  rollNumber: string;
}

export const marksService = {
  async getByAssessment(assessmentId: string): Promise<MarkWithStudent[]> {
    const db = await getDb();
    const stmt = db.prepare(`
      SELECT m.id, m.student_id, m.assessment_id, m.marks_obtained, m.remarks, m.created_at, m.updated_at,
             s.name as student_name, s.roll_number
      FROM marks m
      JOIN students s ON m.student_id = s.id
      WHERE m.assessment_id = ?
      ORDER BY s.roll_number ASC
    `);
    stmt.bind([assessmentId]);

    const marks: MarkWithStudent[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      marks.push({
        id: row[0] as string,
        studentId: row[1] as string,
        assessmentId: row[2] as string,
        marksObtained: row[3] as number,
        remarks: row[4] as string | null,
        createdAt: row[5] as string,
        updatedAt: row[6] as string,
        studentName: row[7] as string,
        rollNumber: row[8] as string,
      });
    }
    stmt.free();

    return marks;
  },

  async getByStudent(studentId: string): Promise<Mark[]> {
    const db = await getDb();
    const stmt = db.prepare(
      'SELECT id, student_id, assessment_id, marks_obtained, remarks, created_at, updated_at FROM marks WHERE student_id = ?'
    );
    stmt.bind([studentId]);

    const marks: Mark[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      marks.push({
        id: row[0] as string,
        studentId: row[1] as string,
        assessmentId: row[2] as string,
        marksObtained: row[3] as number,
        remarks: row[4] as string | null,
        createdAt: row[5] as string,
        updatedAt: row[6] as string,
      });
    }
    stmt.free();

    return marks;
  },

  async getByStudentAndAssessment(
    studentId: string,
    assessmentId: string
  ): Promise<Mark | null> {
    const db = await getDb();
    const stmt = db.prepare(
      'SELECT id, student_id, assessment_id, marks_obtained, remarks, created_at, updated_at FROM marks WHERE student_id = ? AND assessment_id = ?'
    );
    stmt.bind([studentId, assessmentId]);

    if (!stmt.step()) {
      stmt.free();
      return null;
    }

    const row = stmt.get();
    stmt.free();

    return {
      id: row[0] as string,
      studentId: row[1] as string,
      assessmentId: row[2] as string,
      marksObtained: row[3] as number,
      remarks: row[4] as string | null,
      createdAt: row[5] as string,
      updatedAt: row[6] as string,
    };
  },

  async upsert(
    studentId: string,
    assessmentId: string,
    marksObtained: number,
    remarks?: string
  ): Promise<Mark> {
    const existing = await this.getByStudentAndAssessment(
      studentId,
      assessmentId
    );

    if (existing) {
      return this.update(existing.id, { marksObtained, remarks: remarks ?? null });
    }

    return this.create({
      studentId,
      assessmentId,
      marksObtained,
      remarks: remarks || null,
    });
  },

  async create(
    data: Omit<NewMark, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Mark> {
    const db = await getDb();
    const now = new Date().toISOString();
    const id = uuid();

    const stmt = db.prepare(
      'INSERT INTO marks (id, student_id, assessment_id, marks_obtained, remarks, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run([
      id,
      data.studentId,
      data.assessmentId,
      data.marksObtained,
      data.remarks || null,
      now,
      now,
    ]);
    stmt.free();

    await persistDb();

    return {
      id,
      studentId: data.studentId,
      assessmentId: data.assessmentId,
      marksObtained: data.marksObtained,
      remarks: data.remarks || null,
      createdAt: now,
      updatedAt: now,
    };
  },

  async update(
    id: string,
    data: Partial<Omit<Mark, 'id' | 'studentId' | 'assessmentId' | 'createdAt'>>
  ): Promise<Mark> {
    const db = await getDb();
    const now = new Date().toISOString();

    // Get existing mark
    const stmtGet = db.prepare(
      'SELECT id, student_id, assessment_id, marks_obtained, remarks, created_at, updated_at FROM marks WHERE id = ?'
    );
    stmtGet.bind([id]);

    if (!stmtGet.step()) {
      stmtGet.free();
      throw new Error(`Mark with id ${id} not found`);
    }

    const row = stmtGet.get();
    stmtGet.free();

    const existing: Mark = {
      id: row[0] as string,
      studentId: row[1] as string,
      assessmentId: row[2] as string,
      marksObtained: row[3] as number,
      remarks: row[4] as string | null,
      createdAt: row[5] as string,
      updatedAt: row[6] as string,
    };

    const updated = {
      ...existing,
      ...data,
      updatedAt: now,
    };

    const stmt = db.prepare(
      'UPDATE marks SET marks_obtained = ?, remarks = ?, updated_at = ? WHERE id = ?'
    );
    // sql.js doesn't accept undefined, must use null
    stmt.run([updated.marksObtained, updated.remarks ?? null, now, id]);
    stmt.free();

    await persistDb();

    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM marks WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    await persistDb();
  },

  async bulkUpsert(
    assessmentId: string,
    entries: { studentId: string; marksObtained: number; remarks?: string }[]
  ): Promise<void> {
    for (const entry of entries) {
      await this.upsert(
        entry.studentId,
        assessmentId,
        entry.marksObtained,
        entry.remarks
      );
    }
  },
};
