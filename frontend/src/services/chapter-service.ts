import { getDb, persistDb } from '@/lib/db/database';
import type { Chapter, NewChapter } from '@/lib/db/schema';
import { v4 as uuid } from 'uuid';

export type ChapterDifficulty = 'easy' | 'medium' | 'hard';
export type ChapterSourceType = 'pdf' | 'image';

export const chapterService = {
  async getBySubjectId(subjectId: string): Promise<Chapter[]> {
    const db = await getDb();
    const stmt = db.prepare(
      `SELECT id, subject_id, name, chapter_number, content, page_count, source_type, difficulty, created_at, updated_at
       FROM chapters WHERE subject_id = ? ORDER BY chapter_number ASC`
    );
    stmt.bind([subjectId]);

    const chapters: Chapter[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      chapters.push({
        id: row[0] as string,
        subjectId: row[1] as string,
        name: row[2] as string,
        chapterNumber: row[3] as number,
        content: row[4] as string,
        pageCount: row[5] as number | null,
        sourceType: row[6] as string,
        difficulty: row[7] as string | null,
        createdAt: row[8] as string,
        updatedAt: row[9] as string,
      });
    }
    stmt.free();

    return chapters;
  },

  async getById(id: string): Promise<Chapter | null> {
    const db = await getDb();
    const stmt = db.prepare(
      `SELECT id, subject_id, name, chapter_number, content, page_count, source_type, difficulty, created_at, updated_at
       FROM chapters WHERE id = ?`
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
      name: row[2] as string,
      chapterNumber: row[3] as number,
      content: row[4] as string,
      pageCount: row[5] as number | null,
      sourceType: row[6] as string,
      difficulty: row[7] as string | null,
      createdAt: row[8] as string,
      updatedAt: row[9] as string,
    };
  },

  async create(
    data: Omit<NewChapter, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Chapter> {
    const db = await getDb();
    const now = new Date().toISOString();
    const id = uuid();

    const stmt = db.prepare(
      `INSERT INTO chapters (id, subject_id, name, chapter_number, content, page_count, source_type, difficulty, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run([
      id,
      data.subjectId,
      data.name,
      data.chapterNumber,
      data.content,
      data.pageCount ?? 1,
      data.sourceType,
      data.difficulty ?? null,
      now,
      now,
    ]);
    stmt.free();

    await persistDb();

    return {
      id,
      subjectId: data.subjectId,
      name: data.name,
      chapterNumber: data.chapterNumber,
      content: data.content,
      pageCount: data.pageCount ?? 1,
      sourceType: data.sourceType,
      difficulty: data.difficulty ?? null,
      createdAt: now,
      updatedAt: now,
    };
  },

  async update(
    id: string,
    data: Partial<Omit<Chapter, 'id' | 'subjectId' | 'createdAt'>>
  ): Promise<Chapter> {
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Chapter with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: now,
    };

    const stmt = db.prepare(
      `UPDATE chapters SET name = ?, chapter_number = ?, content = ?, page_count = ?, difficulty = ?, updated_at = ? WHERE id = ?`
    );
    stmt.run([
      updated.name,
      updated.chapterNumber,
      updated.content,
      updated.pageCount,
      updated.difficulty,
      now,
      id,
    ]);
    stmt.free();

    await persistDb();

    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM chapters WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    await persistDb();
  },

  async deleteBySubjectId(subjectId: string): Promise<void> {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM chapters WHERE subject_id = ?');
    stmt.run([subjectId]);
    stmt.free();
    await persistDb();
  },

  async getNextChapterNumber(subjectId: string): Promise<number> {
    const db = await getDb();
    const stmt = db.prepare(
      'SELECT MAX(chapter_number) FROM chapters WHERE subject_id = ?'
    );
    stmt.bind([subjectId]);

    if (!stmt.step()) {
      stmt.free();
      return 1;
    }

    const row = stmt.get();
    stmt.free();

    const maxNumber = row[0] as number | null;
    return (maxNumber ?? 0) + 1;
  },

  async getChapterCount(subjectId: string): Promise<number> {
    const db = await getDb();
    const stmt = db.prepare(
      'SELECT COUNT(*) FROM chapters WHERE subject_id = ?'
    );
    stmt.bind([subjectId]);
    stmt.step();
    const row = stmt.get();
    stmt.free();
    return row[0] as number;
  },

  async search(query: string, subjectId?: string): Promise<Chapter[]> {
    const db = await getDb();
    const searchTerm = `%${query}%`;

    let sql = `SELECT id, subject_id, name, chapter_number, content, page_count, source_type, difficulty, created_at, updated_at
               FROM chapters WHERE name LIKE ?`;
    const params: (string | null)[] = [searchTerm];

    if (subjectId) {
      sql += ' AND subject_id = ?';
      params.push(subjectId);
    }

    sql += ' ORDER BY chapter_number ASC';

    const stmt = db.prepare(sql);
    stmt.bind(params);

    const chapters: Chapter[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      chapters.push({
        id: row[0] as string,
        subjectId: row[1] as string,
        name: row[2] as string,
        chapterNumber: row[3] as number,
        content: row[4] as string,
        pageCount: row[5] as number | null,
        sourceType: row[6] as string,
        difficulty: row[7] as string | null,
        createdAt: row[8] as string,
        updatedAt: row[9] as string,
      });
    }
    stmt.free();

    return chapters;
  },
};
