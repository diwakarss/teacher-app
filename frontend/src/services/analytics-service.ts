/**
 * Analytics Service
 *
 * Aggregates data from marks, students, and assessments
 * for dashboard visualization.
 */

import { getDb } from '@/lib/db/database';
import { calculateIGCSEGrade } from './marks-service';

// Helper to calculate grade from percentage
function calculateGrade(percentage: number): string {
  return calculateIGCSEGrade(percentage, 100);
}

export interface ProgressDataPoint {
  date: string;
  assessmentName: string;
  percentage: number;
  grade: string;
}

export interface AssessmentSummary {
  assessmentId: string;
  assessmentName: string;
  type: string;
  average: number;
  highest: number;
  lowest: number;
  passRate: number;
  studentCount: number;
}

export interface GradeCount {
  grade: string;
  count: number;
  color: string;
}

export interface ClassStatistics {
  totalStudents: number;
  totalAssessments: number;
  overallAverage: number;
  passRate: number;
  topPerformers: Array<{ name: string; average: number }>;
  needsAttention: Array<{ name: string; average: number }>;
}

export interface StudentProgressSummary {
  studentId: string;
  studentName: string;
  dataPoints: ProgressDataPoint[];
}

const GRADE_COLORS: Record<string, string> = {
  'A*': '#22c55e',
  A: '#4ade80',
  B: '#86efac',
  C: '#fde047',
  D: '#fdba74',
  E: '#fb923c',
  F: '#f87171',
  G: '#ef4444',
  U: '#dc2626',
};

export const analyticsService = {
  /**
   * Get student progress over time
   */
  async getStudentProgress(
    studentId: string,
    options?: { subjectId?: string; fromDate?: string; toDate?: string }
  ): Promise<ProgressDataPoint[]> {
    const db = await getDb();

    let query = `
      SELECT
        a.name as assessment_name,
        a.date,
        m.marks_obtained,
        a.max_marks,
        ROUND(CAST(m.marks_obtained AS FLOAT) / a.max_marks * 100, 1) as percentage
      FROM marks m
      JOIN assessments a ON m.assessment_id = a.id
      WHERE m.student_id = ?
    `;
    const params: (string | number)[] = [studentId];

    if (options?.subjectId) {
      query += ' AND a.subject_id = ?';
      params.push(options.subjectId);
    }
    if (options?.fromDate) {
      query += ' AND a.date >= ?';
      params.push(options.fromDate);
    }
    if (options?.toDate) {
      query += ' AND a.date <= ?';
      params.push(options.toDate);
    }

    query += ' ORDER BY a.date ASC';

    const stmt = db.prepare(query);
    stmt.bind(params);

    const dataPoints: ProgressDataPoint[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      const percentage = row[4] as number;
      dataPoints.push({
        assessmentName: row[0] as string,
        date: row[1] as string,
        percentage,
        grade: calculateGrade(percentage),
      });
    }
    stmt.free();

    return dataPoints;
  },

  /**
   * Get all students' progress for a class (for multi-line chart)
   */
  async getClassStudentsProgress(
    classId: string,
    options?: { subjectId?: string; limit?: number }
  ): Promise<StudentProgressSummary[]> {
    const db = await getDb();

    // Get students in class
    const studentStmt = db.prepare(
      'SELECT id, name FROM students WHERE class_id = ? ORDER BY name LIMIT ?'
    );
    studentStmt.bind([classId, options?.limit || 10]);

    const students: Array<{ id: string; name: string }> = [];
    while (studentStmt.step()) {
      const row = studentStmt.get();
      students.push({ id: row[0] as string, name: row[1] as string });
    }
    studentStmt.free();

    // Get progress for each student
    const summaries: StudentProgressSummary[] = [];
    for (const student of students) {
      const dataPoints = await this.getStudentProgress(student.id, {
        subjectId: options?.subjectId,
      });
      summaries.push({
        studentId: student.id,
        studentName: student.name,
        dataPoints,
      });
    }

    return summaries;
  },

  /**
   * Get assessment breakdown for a class
   */
  async getAssessmentBreakdown(
    classId: string,
    options?: { subjectId?: string }
  ): Promise<AssessmentSummary[]> {
    const db = await getDb();

    let query = `
      SELECT
        a.id,
        a.name,
        a.type,
        a.max_marks,
        COUNT(m.id) as student_count,
        AVG(m.marks_obtained) as avg_marks,
        MAX(m.marks_obtained) as highest_marks,
        MIN(m.marks_obtained) as lowest_marks
      FROM assessments a
      LEFT JOIN marks m ON a.id = m.assessment_id
      WHERE a.class_id = ?
    `;
    const params: string[] = [classId];

    if (options?.subjectId) {
      query += ' AND a.subject_id = ?';
      params.push(options.subjectId);
    }

    query += ' GROUP BY a.id ORDER BY a.date DESC LIMIT 10';

    const stmt = db.prepare(query);
    stmt.bind(params);

    const summaries: AssessmentSummary[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      const maxMarks = row[3] as number;
      const studentCount = row[4] as number;
      const avgMarks = row[5] as number;
      const highestMarks = row[6] as number;
      const lowestMarks = row[7] as number;

      // Calculate pass rate based on percentage >= 50%
      const avgPct = maxMarks > 0 ? (avgMarks / maxMarks) * 100 : 0;
      const passRate = avgPct >= 50 ? 100 : 0; // Simplified: will calculate properly below

      summaries.push({
        assessmentId: row[0] as string,
        assessmentName: row[1] as string,
        type: row[2] as string,
        average: maxMarks > 0 ? Math.round((avgMarks / maxMarks) * 100) : 0,
        highest: maxMarks > 0 ? Math.round((highestMarks / maxMarks) * 100) : 0,
        lowest: maxMarks > 0 ? Math.round((lowestMarks / maxMarks) * 100) : 0,
        passRate,
        studentCount,
      });
    }
    stmt.free();

    return summaries;
  },

  /**
   * Get grade distribution for a class
   */
  async getGradeDistribution(
    classId: string,
    subjectId?: string
  ): Promise<GradeCount[]> {
    const db = await getDb();

    // Grade is calculated, not stored, so we need to fetch marks and calculate
    let query = `
      SELECT
        m.marks_obtained,
        a.max_marks
      FROM marks m
      JOIN assessments a ON m.assessment_id = a.id
      WHERE a.class_id = ?
    `;
    const params: string[] = [classId];

    if (subjectId) {
      query += ' AND a.subject_id = ?';
      params.push(subjectId);
    }

    const stmt = db.prepare(query);
    stmt.bind(params);

    // Count grades
    const gradeCounts: Record<string, number> = {};
    while (stmt.step()) {
      const row = stmt.get();
      const marksObtained = row[0] as number;
      const maxMarks = row[1] as number;
      const percentage = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0;
      const grade = calculateGrade(percentage);
      gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
    }
    stmt.free();

    // Convert to array sorted by grade
    const gradeOrder = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U'];
    const grades: GradeCount[] = gradeOrder
      .filter((g) => gradeCounts[g])
      .map((grade) => ({
        grade,
        count: gradeCounts[grade],
        color: GRADE_COLORS[grade] || '#9ca3af',
      }));

    return grades;
  },

  /**
   * Get class statistics overview
   */
  async getClassStats(classId: string): Promise<ClassStatistics> {
    const db = await getDb();

    // Count students
    const studentStmt = db.prepare('SELECT COUNT(*) FROM students WHERE class_id = ?');
    studentStmt.bind([classId]);
    studentStmt.step();
    const totalStudents = studentStmt.get()[0] as number;
    studentStmt.free();

    // Count assessments
    const assessmentStmt = db.prepare('SELECT COUNT(*) FROM assessments WHERE class_id = ?');
    assessmentStmt.bind([classId]);
    assessmentStmt.step();
    const totalAssessments = assessmentStmt.get()[0] as number;
    assessmentStmt.free();

    // Get overall stats from marks
    const statsStmt = db.prepare(`
      SELECT
        m.marks_obtained,
        a.max_marks
      FROM marks m
      JOIN assessments a ON m.assessment_id = a.id
      WHERE a.class_id = ?
    `);
    statsStmt.bind([classId]);

    let totalPct = 0;
    let passCount = 0;
    let markCount = 0;

    while (statsStmt.step()) {
      const row = statsStmt.get();
      const marksObtained = row[0] as number;
      const maxMarks = row[1] as number;
      if (maxMarks > 0) {
        const pct = (marksObtained / maxMarks) * 100;
        totalPct += pct;
        markCount++;
        // Pass if grade is not F, G, or U (i.e., >= 40%)
        if (pct >= 40) passCount++;
      }
    }
    statsStmt.free();

    const overallAverage = markCount > 0 ? Math.round(totalPct / markCount) : 0;
    const passRate = markCount > 0 ? Math.round((passCount / markCount) * 100) : 0;

    // Get top performers
    const topStmt = db.prepare(`
      SELECT s.name, AVG(CAST(m.marks_obtained AS FLOAT) / a.max_marks * 100) as avg_pct
      FROM students s
      JOIN marks m ON s.id = m.student_id
      JOIN assessments a ON m.assessment_id = a.id
      WHERE s.class_id = ?
      GROUP BY s.id
      ORDER BY avg_pct DESC
      LIMIT 3
    `);
    topStmt.bind([classId]);
    const topPerformers: Array<{ name: string; average: number }> = [];
    while (topStmt.step()) {
      const row = topStmt.get();
      topPerformers.push({
        name: row[0] as string,
        average: Math.round(row[1] as number),
      });
    }
    topStmt.free();

    // Get students needing attention (below 50%)
    const bottomStmt = db.prepare(`
      SELECT s.name, AVG(CAST(m.marks_obtained AS FLOAT) / a.max_marks * 100) as avg_pct
      FROM students s
      JOIN marks m ON s.id = m.student_id
      JOIN assessments a ON m.assessment_id = a.id
      WHERE s.class_id = ?
      GROUP BY s.id
      HAVING avg_pct < 50
      ORDER BY avg_pct ASC
      LIMIT 5
    `);
    bottomStmt.bind([classId]);
    const needsAttention: Array<{ name: string; average: number }> = [];
    while (bottomStmt.step()) {
      const row = bottomStmt.get();
      needsAttention.push({
        name: row[0] as string,
        average: Math.round(row[1] as number),
      });
    }
    bottomStmt.free();

    return {
      totalStudents,
      totalAssessments,
      overallAverage,
      passRate,
      topPerformers,
      needsAttention,
    };
  },
};
