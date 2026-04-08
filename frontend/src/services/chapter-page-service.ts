import { getDb, persistDb } from '@/lib/db/database';
import type { ChapterPage } from '@/lib/db/schema';
import { v4 as uuid } from 'uuid';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToChapterPage(row: any[]): ChapterPage {
  return {
    id: row[0] as string,
    chapterId: row[1] as string,
    pageNumber: row[2] as number,
    extraction: row[3] as string,
    teacherCorrections: row[4] as string | null,
    createdAt: row[5] as string,
    updatedAt: row[6] as string,
  };
}

export const chapterPageService = {
  async getByChapterId(chapterId: string): Promise<ChapterPage[]> {
    const db = await getDb();
    const stmt = db.prepare(
      `SELECT id, chapter_id, page_number, extraction, teacher_corrections, created_at, updated_at
       FROM chapter_pages WHERE chapter_id = ? ORDER BY page_number ASC`
    );
    stmt.bind([chapterId]);

    const pages: ChapterPage[] = [];
    while (stmt.step()) {
      pages.push(rowToChapterPage(stmt.get()));
    }
    stmt.free();

    return pages;
  },

  async getById(id: string): Promise<ChapterPage | null> {
    const db = await getDb();
    const stmt = db.prepare(
      `SELECT id, chapter_id, page_number, extraction, teacher_corrections, created_at, updated_at
       FROM chapter_pages WHERE id = ?`
    );
    stmt.bind([id]);

    if (!stmt.step()) {
      stmt.free();
      return null;
    }

    const page = rowToChapterPage(stmt.get());
    stmt.free();

    return page;
  },

  async updateCorrections(id: string, corrections: string): Promise<ChapterPage> {
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`ChapterPage with id ${id} not found`);
    }

    const stmt = db.prepare(
      `UPDATE chapter_pages SET teacher_corrections = ?, updated_at = ? WHERE id = ?`
    );
    stmt.run([corrections, now, id]);
    stmt.free();

    await persistDb();

    return {
      ...existing,
      teacherCorrections: corrections,
      updatedAt: now,
    };
  },

  async deleteByChapterId(chapterId: string): Promise<void> {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM chapter_pages WHERE chapter_id = ?');
    stmt.run([chapterId]);
    stmt.free();
    await persistDb();
  },
};
