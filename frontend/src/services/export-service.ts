/**
 * Export/Import Service
 *
 * Export all data to JSON backup, import with validation and merge/replace strategies.
 * Aligns with actual Drizzle schema in lib/db/schema.ts
 */

import { getDb } from '@/lib/db/database';
import type {
  Class,
  Subject,
  Student,
  Assessment,
  Mark,
  Feedback,
  Chapter,
  LessonPlan,
  QuestionPaper,
} from '@/lib/db/schema';

const EXPORT_VERSION = '1.0.0';

export interface ExportData {
  version: string;
  exportedAt: string;
  data: {
    classes: Class[];
    subjects: Subject[];
    students: Student[];
    assessments: Assessment[];
    marks: Mark[];
    feedback: Feedback[];
    chapters: Chapter[];
    lessonPlans: LessonPlan[];
    questionPapers: QuestionPaper[];
  };
}

export interface ValidationResult {
  valid: boolean;
  version: string;
  errors: string[];
  warnings: string[];
  summary: {
    classes: number;
    subjects: number;
    students: number;
    assessments: number;
    marks: number;
    feedback: number;
    chapters: number;
    lessonPlans: number;
    questionPapers: number;
  };
}

export interface ImportResult {
  success: boolean;
  strategy: 'merge' | 'replace';
  imported: {
    classes: number;
    subjects: number;
    students: number;
    assessments: number;
    marks: number;
    feedback: number;
    chapters: number;
    lessonPlans: number;
    questionPapers: number;
  };
  errors: string[];
}

// Row mappers aligned with actual Drizzle schema
function mapRowToClass(row: Record<string, unknown>): Class {
  return {
    id: row.id as string,
    name: row.name as string,
    academicYear: row.academic_year as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapRowToSubject(row: Record<string, unknown>): Subject {
  return {
    id: row.id as string,
    name: row.name as string,
    classId: row.class_id as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapRowToStudent(row: Record<string, unknown>): Student {
  return {
    id: row.id as string,
    name: row.name as string,
    rollNumber: row.roll_number as string,
    classId: row.class_id as string,
    parentName: (row.parent_name as string) || null,
    parentPhone: (row.parent_phone as string) || null,
    parentEmail: (row.parent_email as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapRowToAssessment(row: Record<string, unknown>): Assessment {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as string,
    subjectId: row.subject_id as string,
    classId: row.class_id as string,
    maxMarks: row.max_marks as number,
    date: row.date as string,
    term: row.term as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapRowToMark(row: Record<string, unknown>): Mark {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    assessmentId: row.assessment_id as string,
    marksObtained: row.marks_obtained as number,
    remarks: (row.remarks as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapRowToFeedback(row: Record<string, unknown>): Feedback {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    assessmentId: row.assessment_id as string,
    message: row.message as string,
    tone: row.tone as string,
    performanceLevel: row.performance_level as string,
    createdAt: row.created_at as string,
  };
}

function mapRowToChapter(row: Record<string, unknown>): Chapter {
  return {
    id: row.id as string,
    subjectId: row.subject_id as string,
    name: row.name as string,
    chapterNumber: row.chapter_number as number,
    content: row.content as string,
    pageCount: (row.page_count as number) || null,
    sourceType: row.source_type as string,
    difficulty: (row.difficulty as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapRowToLessonPlan(row: Record<string, unknown>): LessonPlan {
  return {
    id: row.id as string,
    chapterId: row.chapter_id as string,
    subjectId: row.subject_id as string,
    name: row.name as string,
    duration: row.duration as number,
    objectives: row.objectives as string,
    sections: row.sections as string,
    materials: (row.materials as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapRowToQuestionPaper(row: Record<string, unknown>): QuestionPaper {
  return {
    id: row.id as string,
    subjectId: row.subject_id as string,
    chapterIds: row.chapter_ids as string,
    name: row.name as string,
    totalMarks: row.total_marks as number,
    duration: row.duration as number,
    difficulty: row.difficulty as string,
    template: row.template as string,
    sections: row.sections as string,
    answerKey: row.answer_key as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export const exportService = {
  /**
   * Export all data to JSON format
   */
  async exportAll(): Promise<ExportData> {
    const db = await getDb();

    const tableQueries = [
      { name: 'classes', mapper: mapRowToClass },
      { name: 'subjects', mapper: mapRowToSubject },
      { name: 'students', mapper: mapRowToStudent },
      { name: 'assessments', mapper: mapRowToAssessment },
      { name: 'marks', mapper: mapRowToMark },
      { name: 'feedback', mapper: mapRowToFeedback },
      { name: 'chapters', mapper: mapRowToChapter },
      { name: 'lesson_plans', mapper: mapRowToLessonPlan },
      { name: 'question_papers', mapper: mapRowToQuestionPaper },
    ];

    const results: Record<string, unknown[]> = {};

    for (const { name, mapper } of tableQueries) {
      try {
        const columnsResult = db.exec(`PRAGMA table_info(${name})`);
        const columns = columnsResult[0]?.values.map((v) => v[1] as string) || [];

        const dataResult = db.exec(`SELECT * FROM ${name}`);
        const rows = dataResult[0]?.values || [];

        results[name] = rows.map((row) => {
          const rowObj: Record<string, unknown> = {};
          columns.forEach((col, i) => {
            rowObj[col] = row[i];
          });
          return mapper(rowObj);
        });
      } catch {
        results[name] = [];
      }
    }

    return {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        classes: results.classes as Class[],
        subjects: results.subjects as Subject[],
        students: results.students as Student[],
        assessments: results.assessments as Assessment[],
        marks: results.marks as Mark[],
        feedback: results.feedback as Feedback[],
        chapters: results.chapters as Chapter[],
        lessonPlans: results.lesson_plans as LessonPlan[],
        questionPapers: results.question_papers as QuestionPaper[],
      },
    };
  },

  /**
   * Download export data as JSON file
   */
  downloadAsJson(data: ExportData): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher-assistant-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Validate import file
   */
  async validateImport(file: File): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;

      if (!data.version) {
        errors.push('Missing version field');
      }

      if (!data.data) {
        errors.push('Missing data field');
        return {
          valid: false,
          version: data.version || 'unknown',
          errors,
          warnings,
          summary: {
            classes: 0,
            subjects: 0,
            students: 0,
            assessments: 0,
            marks: 0,
            feedback: 0,
            chapters: 0,
            lessonPlans: 0,
            questionPapers: 0,
          },
        };
      }

      // Check version compatibility
      if (data.version !== EXPORT_VERSION) {
        warnings.push(`Version mismatch: file is ${data.version}, current is ${EXPORT_VERSION}`);
      }

      // Validate required arrays
      const requiredFields = ['classes', 'subjects', 'students', 'assessments', 'marks'] as const;
      for (const field of requiredFields) {
        if (!Array.isArray(data.data[field])) {
          errors.push(`Missing or invalid ${field} array`);
        }
      }

      // Validate relationships
      const classIds = new Set(data.data.classes?.map((c) => c.id) || []);
      const subjectIds = new Set(data.data.subjects?.map((s) => s.id) || []);
      const studentIds = new Set(data.data.students?.map((s) => s.id) || []);
      const assessmentIds = new Set(data.data.assessments?.map((a) => a.id) || []);

      // Check foreign keys
      for (const subject of data.data.subjects || []) {
        if (!classIds.has(subject.classId)) {
          warnings.push(`Subject "${subject.name}" references unknown class ${subject.classId}`);
        }
      }

      for (const student of data.data.students || []) {
        if (!classIds.has(student.classId)) {
          warnings.push(`Student "${student.name}" references unknown class ${student.classId}`);
        }
      }

      for (const assessment of data.data.assessments || []) {
        if (!subjectIds.has(assessment.subjectId)) {
          warnings.push(`Assessment "${assessment.name}" references unknown subject ${assessment.subjectId}`);
        }
      }

      for (const mark of data.data.marks || []) {
        if (!assessmentIds.has(mark.assessmentId)) {
          warnings.push(`Mark references unknown assessment ${mark.assessmentId}`);
        }
        if (!studentIds.has(mark.studentId)) {
          warnings.push(`Mark references unknown student ${mark.studentId}`);
        }
      }

      return {
        valid: errors.length === 0,
        version: data.version || 'unknown',
        errors,
        warnings,
        summary: {
          classes: data.data.classes?.length || 0,
          subjects: data.data.subjects?.length || 0,
          students: data.data.students?.length || 0,
          assessments: data.data.assessments?.length || 0,
          marks: data.data.marks?.length || 0,
          feedback: data.data.feedback?.length || 0,
          chapters: data.data.chapters?.length || 0,
          lessonPlans: data.data.lessonPlans?.length || 0,
          questionPapers: data.data.questionPapers?.length || 0,
        },
      };
    } catch (error) {
      errors.push(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        valid: false,
        version: 'unknown',
        errors,
        warnings,
        summary: {
          classes: 0,
          subjects: 0,
          students: 0,
          assessments: 0,
          marks: 0,
          feedback: 0,
          chapters: 0,
          lessonPlans: 0,
          questionPapers: 0,
        },
      };
    }
  },

  /**
   * Import data with merge or replace strategy
   */
  async importData(file: File, strategy: 'merge' | 'replace'): Promise<ImportResult> {
    const errors: string[] = [];
    const imported = {
      classes: 0,
      subjects: 0,
      students: 0,
      assessments: 0,
      marks: 0,
      feedback: 0,
      chapters: 0,
      lessonPlans: 0,
      questionPapers: 0,
    };

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;
      const db = await getDb();

      // If replace strategy, clear all existing data (in correct order for FK constraints)
      if (strategy === 'replace') {
        db.run('DELETE FROM marks');
        db.run('DELETE FROM feedback');
        db.run('DELETE FROM assessments');
        db.run('DELETE FROM lesson_plans');
        db.run('DELETE FROM question_papers');
        db.run('DELETE FROM chapters');
        db.run('DELETE FROM students');
        db.run('DELETE FROM subjects');
        db.run('DELETE FROM classes');
      }

      const now = new Date().toISOString();

      // Import classes
      for (const cls of data.data.classes || []) {
        try {
          db.run(
            `INSERT OR REPLACE INTO classes (id, name, academic_year, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
            [cls.id, cls.name, cls.academicYear, cls.createdAt || now, now]
          );
          imported.classes++;
        } catch (e) {
          errors.push(`Failed to import class "${cls.name}": ${e}`);
        }
      }

      // Import subjects
      for (const subject of data.data.subjects || []) {
        try {
          db.run(
            `INSERT OR REPLACE INTO subjects (id, name, class_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
            [subject.id, subject.name, subject.classId, subject.createdAt || now, now]
          );
          imported.subjects++;
        } catch (e) {
          errors.push(`Failed to import subject "${subject.name}": ${e}`);
        }
      }

      // Import students
      for (const student of data.data.students || []) {
        try {
          db.run(
            `INSERT OR REPLACE INTO students (id, name, roll_number, class_id, parent_name, parent_phone, parent_email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [student.id, student.name, student.rollNumber, student.classId, student.parentName || null, student.parentPhone || null, student.parentEmail || null, student.createdAt || now, now]
          );
          imported.students++;
        } catch (e) {
          errors.push(`Failed to import student "${student.name}": ${e}`);
        }
      }

      // Import assessments
      for (const assessment of data.data.assessments || []) {
        try {
          db.run(
            `INSERT OR REPLACE INTO assessments (id, name, type, subject_id, class_id, max_marks, date, term, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [assessment.id, assessment.name, assessment.type, assessment.subjectId, assessment.classId, assessment.maxMarks, assessment.date, assessment.term, assessment.createdAt || now, now]
          );
          imported.assessments++;
        } catch (e) {
          errors.push(`Failed to import assessment "${assessment.name}": ${e}`);
        }
      }

      // Import marks
      for (const mark of data.data.marks || []) {
        try {
          db.run(
            `INSERT OR REPLACE INTO marks (id, student_id, assessment_id, marks_obtained, remarks, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [mark.id, mark.studentId, mark.assessmentId, mark.marksObtained, mark.remarks || null, mark.createdAt || now, now]
          );
          imported.marks++;
        } catch (e) {
          errors.push(`Failed to import mark: ${e}`);
        }
      }

      // Import feedback
      for (const fb of data.data.feedback || []) {
        try {
          db.run(
            `INSERT OR REPLACE INTO feedback (id, student_id, assessment_id, message, tone, performance_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [fb.id, fb.studentId, fb.assessmentId, fb.message, fb.tone, fb.performanceLevel, fb.createdAt || now]
          );
          imported.feedback++;
        } catch (e) {
          errors.push(`Failed to import feedback: ${e}`);
        }
      }

      // Import chapters
      for (const chapter of data.data.chapters || []) {
        try {
          db.run(
            `INSERT OR REPLACE INTO chapters (id, subject_id, name, chapter_number, content, page_count, source_type, difficulty, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [chapter.id, chapter.subjectId, chapter.name, chapter.chapterNumber, chapter.content, chapter.pageCount || null, chapter.sourceType, chapter.difficulty || null, chapter.createdAt || now, now]
          );
          imported.chapters++;
        } catch (e) {
          errors.push(`Failed to import chapter "${chapter.name}": ${e}`);
        }
      }

      // Import lesson plans
      for (const lp of data.data.lessonPlans || []) {
        try {
          db.run(
            `INSERT OR REPLACE INTO lesson_plans (id, chapter_id, subject_id, name, duration, objectives, sections, materials, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [lp.id, lp.chapterId, lp.subjectId, lp.name, lp.duration, lp.objectives, lp.sections, lp.materials || null, lp.createdAt || now, now]
          );
          imported.lessonPlans++;
        } catch (e) {
          errors.push(`Failed to import lesson plan "${lp.name}": ${e}`);
        }
      }

      // Import question papers
      for (const qp of data.data.questionPapers || []) {
        try {
          db.run(
            `INSERT OR REPLACE INTO question_papers (id, subject_id, chapter_ids, name, total_marks, duration, difficulty, template, sections, answer_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [qp.id, qp.subjectId, qp.chapterIds, qp.name, qp.totalMarks, qp.duration, qp.difficulty, qp.template, qp.sections, qp.answerKey, qp.createdAt || now, now]
          );
          imported.questionPapers++;
        } catch (e) {
          errors.push(`Failed to import question paper "${qp.name}": ${e}`);
        }
      }

      return {
        success: errors.length === 0,
        strategy,
        imported,
        errors,
      };
    } catch (error) {
      errors.push(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        strategy,
        imported,
        errors,
      };
    }
  },
};
