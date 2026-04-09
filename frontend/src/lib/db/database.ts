import initSqlJs, { Database } from 'sql.js';
import { saveDatabase, loadDatabase } from './persist';

let dbInstance: Database | null = null;
let dbPromise: Promise<Database> | null = null;

async function initDatabase(): Promise<Database> {
  // Use jsDelivr CDN - reliable and CORS-enabled
  const SQL = await initSqlJs({
    locateFile: () => 'https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/sql-wasm.wasm',
  });

  const savedData = await loadDatabase();

  if (savedData) {
    return new SQL.Database(savedData);
  }

  return new SQL.Database();
}

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = initDatabase();
  dbInstance = await dbPromise;
  return dbInstance;
}

export async function persistDb(): Promise<void> {
  if (!dbInstance) return;

  const data = dbInstance.export();
  await saveDatabase(data);
}

export async function runMigrations(db: Database): Promise<void> {
  // Create tables if they don't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      class_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      roll_number TEXT NOT NULL,
      class_id TEXT NOT NULL,
      parent_name TEXT,
      parent_phone TEXT,
      parent_email TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      UNIQUE(class_id, roll_number)
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      max_marks INTEGER NOT NULL,
      date TEXT NOT NULL,
      term INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS marks (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      assessment_id TEXT NOT NULL,
      marks_obtained INTEGER NOT NULL,
      remarks TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
      UNIQUE(student_id, assessment_id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      assessment_id TEXT NOT NULL,
      message TEXT NOT NULL,
      tone TEXT NOT NULL,
      performance_level TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      name TEXT NOT NULL,
      chapter_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      page_count INTEGER DEFAULT 1,
      source_type TEXT NOT NULL CHECK (source_type IN ('pdf', 'image')),
      difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lesson_plans (
      id TEXT PRIMARY KEY,
      chapter_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      name TEXT NOT NULL,
      duration INTEGER NOT NULL,
      objectives TEXT NOT NULL,
      sections TEXT NOT NULL,
      materials TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS question_papers (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      chapter_ids TEXT NOT NULL,
      name TEXT NOT NULL,
      total_marks INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
      template TEXT NOT NULL CHECK (template IN ('unit_test', 'monthly_test', 'term_exam', 'custom', 'ct', 'mtpt', 'ftpt')),
      sections TEXT NOT NULL,
      answer_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);
    CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
    CREATE INDEX IF NOT EXISTS idx_assessments_class_id ON assessments(class_id);
    CREATE INDEX IF NOT EXISTS idx_assessments_subject_id ON assessments(subject_id);
    CREATE INDEX IF NOT EXISTS idx_marks_student_id ON marks(student_id);
    CREATE INDEX IF NOT EXISTS idx_marks_assessment_id ON marks(assessment_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_student_id ON feedback(student_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_assessment_id ON feedback(assessment_id);
    CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON chapters(subject_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_plans_chapter_id ON lesson_plans(chapter_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_plans_subject_id ON lesson_plans(subject_id);
    CREATE INDEX IF NOT EXISTS idx_question_papers_subject_id ON question_papers(subject_id);
  `);

  // Vision scanning: chapter_pages table
  db.run(`CREATE TABLE IF NOT EXISTS chapter_pages (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    extraction TEXT NOT NULL,
    teacher_corrections TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_chapter_pages_chapter_id ON chapter_pages(chapter_id)`);
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_pages_unique ON chapter_pages(chapter_id, page_number)`);

  // Migration: expand template CHECK constraint to include new paper formats (ct, mtpt, ftpt)
  // SQLite doesn't support ALTER CHECK, so recreate the table if needed
  try {
    // Test if new values are accepted
    db.run(`INSERT INTO question_papers (id, subject_id, chapter_ids, name, total_marks, duration, difficulty, template, sections, answer_key, created_at, updated_at)
            VALUES ('__migration_test__', 'test', '[]', 'test', 0, 0, 'easy', 'ct', '[]', '[]', '', '')`);
    db.run(`DELETE FROM question_papers WHERE id = '__migration_test__'`);
  } catch {
    // Constraint rejects 'ct' — recreate the table
    db.run(`ALTER TABLE question_papers RENAME TO question_papers_old`);
    db.run(`
      CREATE TABLE question_papers (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        chapter_ids TEXT NOT NULL,
        name TEXT NOT NULL,
        total_marks INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
        template TEXT NOT NULL CHECK (template IN ('unit_test', 'monthly_test', 'term_exam', 'custom', 'ct', 'mtpt', 'ftpt')),
        sections TEXT NOT NULL,
        answer_key TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);
    db.run(`INSERT INTO question_papers SELECT * FROM question_papers_old`);
    db.run(`DROP TABLE question_papers_old`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_question_papers_subject_id ON question_papers(subject_id)`);
  }

  await persistDb();
}

export async function initializeDb(): Promise<Database> {
  const db = await getDb();
  await runMigrations(db);
  return db;
}

export async function closeDb(): Promise<void> {
  if (dbInstance) {
    await persistDb();
    dbInstance.close();
    dbInstance = null;
    dbPromise = null;
  }
}
