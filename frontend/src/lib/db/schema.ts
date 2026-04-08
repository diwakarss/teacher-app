import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const classes = sqliteTable('classes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  academicYear: text('academic_year').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const subjects = sqliteTable('subjects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  classId: text('class_id')
    .notNull()
    .references(() => classes.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const students = sqliteTable('students', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  rollNumber: text('roll_number').notNull(),
  classId: text('class_id')
    .notNull()
    .references(() => classes.id, { onDelete: 'cascade' }),
  parentName: text('parent_name'),
  parentPhone: text('parent_phone'),
  parentEmail: text('parent_email'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const assessments = sqliteTable('assessments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'unit' | 'monthly' | 'term' | 'quiz'
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  classId: text('class_id')
    .notNull()
    .references(() => classes.id, { onDelete: 'cascade' }),
  maxMarks: integer('max_marks').notNull(),
  date: text('date').notNull(),
  term: integer('term').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const marks = sqliteTable('marks', {
  id: text('id').primaryKey(),
  studentId: text('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  assessmentId: text('assessment_id')
    .notNull()
    .references(() => assessments.id, { onDelete: 'cascade' }),
  marksObtained: integer('marks_obtained').notNull(),
  remarks: text('remarks'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const feedback = sqliteTable('feedback', {
  id: text('id').primaryKey(),
  studentId: text('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  assessmentId: text('assessment_id')
    .notNull()
    .references(() => assessments.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  tone: text('tone').notNull(), // 'encouraging' | 'neutral' | 'serious'
  performanceLevel: text('performance_level').notNull(), // 'excellent' | 'good' | 'average' | 'needsWork' | 'struggling'
  createdAt: text('created_at').notNull(),
});

export const chapters = sqliteTable('chapters', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  chapterNumber: integer('chapter_number').notNull(),
  content: text('content').notNull(),
  pageCount: integer('page_count').default(1),
  sourceType: text('source_type').notNull(), // 'pdf' | 'image'
  difficulty: text('difficulty'), // 'easy' | 'medium' | 'hard'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Type exports for use in services
export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;

export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;

export type Assessment = typeof assessments.$inferSelect;
export type NewAssessment = typeof assessments.$inferInsert;

export type Mark = typeof marks.$inferSelect;
export type NewMark = typeof marks.$inferInsert;

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;

export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;

export const chapterPages = sqliteTable('chapter_pages', {
  id: text('id').primaryKey(),
  chapterId: text('chapter_id')
    .notNull()
    .references(() => chapters.id, { onDelete: 'cascade' }),
  pageNumber: integer('page_number').notNull(),
  extraction: text('extraction').notNull(),
  teacherCorrections: text('teacher_corrections'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type ChapterPage = typeof chapterPages.$inferSelect;
export type NewChapterPage = typeof chapterPages.$inferInsert;

export const lessonPlans = sqliteTable('lesson_plans', {
  id: text('id').primaryKey(),
  chapterId: text('chapter_id')
    .notNull()
    .references(() => chapters.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  duration: integer('duration').notNull(), // minutes
  objectives: text('objectives').notNull(), // JSON array
  sections: text('sections').notNull(), // JSON: intro, content, activities, assessment
  materials: text('materials'), // JSON array
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const questionPapers = sqliteTable('question_papers', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  chapterIds: text('chapter_ids').notNull(), // JSON array of chapter IDs
  name: text('name').notNull(),
  totalMarks: integer('total_marks').notNull(),
  duration: integer('duration').notNull(), // minutes
  difficulty: text('difficulty').notNull(), // 'easy' | 'medium' | 'hard' | 'mixed'
  template: text('template').notNull(), // 'unit_test' | 'monthly_test' | 'term_exam' | 'custom'
  sections: text('sections').notNull(), // JSON: Section A/B/C with questions
  answerKey: text('answer_key').notNull(), // JSON
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type LessonPlan = typeof lessonPlans.$inferSelect;
export type NewLessonPlan = typeof lessonPlans.$inferInsert;

export type QuestionPaper = typeof questionPapers.$inferSelect;
export type NewQuestionPaper = typeof questionPapers.$inferInsert;
