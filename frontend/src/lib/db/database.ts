import initSqlJs, { Database } from 'sql.js';
import { saveDatabase, loadDatabase } from './persist';

let dbInstance: Database | null = null;
let dbPromise: Promise<Database> | null = null;

async function initDatabase(): Promise<Database> {
  const SQL = await initSqlJs({
    locateFile: (file) => `/${file}`,
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

    CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);
    CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
    CREATE INDEX IF NOT EXISTS idx_assessments_class_id ON assessments(class_id);
    CREATE INDEX IF NOT EXISTS idx_assessments_subject_id ON assessments(subject_id);
    CREATE INDEX IF NOT EXISTS idx_marks_student_id ON marks(student_id);
    CREATE INDEX IF NOT EXISTS idx_marks_assessment_id ON marks(assessment_id);
  `);

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
