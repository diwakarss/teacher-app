import { getDb, persistDb } from '@/lib/db/database';
import type { Feedback, NewFeedback } from '@/lib/db/schema';
import { v4 as uuid } from 'uuid';
import { calculateIGCSEGrade } from './marks-service';

export type FeedbackTone = 'encouraging' | 'neutral' | 'serious';
export type PerformanceLevel = 'excellent' | 'good' | 'average' | 'needsWork' | 'struggling';

export const FEEDBACK_TONES: { value: FeedbackTone; label: string; description: string }[] = [
  { value: 'encouraging', label: 'Encouraging', description: 'Positive and supportive tone' },
  { value: 'neutral', label: 'Neutral', description: 'Balanced and factual tone' },
  { value: 'serious', label: 'Serious', description: 'Direct and action-focused tone' },
];

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  rollNumber: string;
  parentName: string | null;
  currentMarks: number;
  maxMarks: number;
  grade: string;
  percentage: number;
  performanceLevel: PerformanceLevel;
  subjectName: string;
  assessmentName: string;
  classAverage: number;
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
}

export function calculatePerformanceLevel(percentage: number): PerformanceLevel {
  if (percentage >= 80) return 'excellent';
  if (percentage >= 65) return 'good';
  if (percentage >= 50) return 'average';
  if (percentage >= 35) return 'needsWork';
  return 'struggling';
}

export function getPerformanceLevelColor(level: PerformanceLevel): string {
  switch (level) {
    case 'excellent':
      return 'text-purple-600 bg-purple-50';
    case 'good':
      return 'text-green-600 bg-green-50';
    case 'average':
      return 'text-blue-600 bg-blue-50';
    case 'needsWork':
      return 'text-orange-600 bg-orange-50';
    case 'struggling':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

// Generate feedback using Claude API
export async function generateFeedbackWithAI(
  performance: StudentPerformance,
  tone: FeedbackTone,
  apiKey: string
): Promise<string> {
  const toneInstructions = {
    encouraging: 'Use a warm, supportive, and encouraging tone. Focus on positives and frame areas for improvement constructively.',
    neutral: 'Use a balanced, factual tone. Present both achievements and areas for improvement objectively.',
    serious: 'Use a direct, action-focused tone. Be clear about concerns and specific about what needs to be done.',
  };

  const trendDescription = {
    improving: 'showing improvement',
    stable: 'maintaining consistent performance',
    declining: 'showing a decline in performance',
    unknown: '',
  };

  const prompt = `Generate a brief parent feedback message (2-3 sentences) for a student.

Student: ${performance.studentName}
Subject: ${performance.subjectName}
Assessment: ${performance.assessmentName}
Score: ${performance.currentMarks}/${performance.maxMarks} (${performance.percentage.toFixed(0)}%)
Grade: ${performance.grade}
Class Average: ${performance.classAverage.toFixed(0)}%
Performance: ${performance.performanceLevel}${performance.trend !== 'unknown' ? `, ${trendDescription[performance.trend]}` : ''}

${toneInstructions[tone]}

Write the message as if addressing "Dear Parent" and sign off as "Class Teacher". Keep it concise and actionable. Do not use markdown formatting.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate feedback');
  }

  const data = await response.json();
  return data.content[0].text;
}

// Generate feedback using templates (fallback when no API key)
export function generateFeedbackFromTemplate(
  performance: StudentPerformance,
  tone: FeedbackTone
): string {
  const { studentName, subjectName, percentage, grade, classAverage, performanceLevel, trend } = performance;

  const comparedToClass = percentage >= classAverage
    ? `above the class average of ${classAverage.toFixed(0)}%`
    : `below the class average of ${classAverage.toFixed(0)}%`;

  const trendText = {
    improving: ' and showing good improvement',
    stable: '',
    declining: ' but has been declining recently',
    unknown: '',
  };

  const templates: Record<PerformanceLevel, Record<FeedbackTone, string>> = {
    excellent: {
      encouraging: `Dear Parent, ${studentName} has achieved an excellent grade of ${grade} (${percentage.toFixed(0)}%) in ${subjectName}, ${comparedToClass}${trendText[trend]}. Outstanding work! Please continue to encourage this dedication. - Class Teacher`,
      neutral: `Dear Parent, ${studentName} scored ${grade} (${percentage.toFixed(0)}%) in ${subjectName}, ${comparedToClass}${trendText[trend]}. This reflects strong understanding of the subject matter. - Class Teacher`,
      serious: `Dear Parent, ${studentName} achieved ${grade} (${percentage.toFixed(0)}%) in ${subjectName}, ${comparedToClass}${trendText[trend]}. To maintain this standard, continued practice is essential. - Class Teacher`,
    },
    good: {
      encouraging: `Dear Parent, ${studentName} scored a good ${grade} (${percentage.toFixed(0)}%) in ${subjectName}, ${comparedToClass}${trendText[trend]}. With continued effort, even better results are possible! - Class Teacher`,
      neutral: `Dear Parent, ${studentName} achieved ${grade} (${percentage.toFixed(0)}%) in ${subjectName}, ${comparedToClass}${trendText[trend]}. Performance is satisfactory with room for improvement. - Class Teacher`,
      serious: `Dear Parent, ${studentName} scored ${grade} (${percentage.toFixed(0)}%) in ${subjectName}, ${comparedToClass}${trendText[trend]}. Please ensure regular revision to improve further. - Class Teacher`,
    },
    average: {
      encouraging: `Dear Parent, ${studentName} achieved ${grade} (${percentage.toFixed(0)}%) in ${subjectName}, ${comparedToClass}${trendText[trend]}. With some focused practice, there's great potential for improvement! - Class Teacher`,
      neutral: `Dear Parent, ${studentName} scored ${grade} (${percentage.toFixed(0)}%) in ${subjectName}, ${comparedToClass}${trendText[trend]}. Additional practice in weak areas would be beneficial. - Class Teacher`,
      serious: `Dear Parent, ${studentName} achieved ${grade} (${percentage.toFixed(0)}%) in ${subjectName}, ${comparedToClass}${trendText[trend]}. Please ensure daily revision and complete all homework assignments. - Class Teacher`,
    },
    needsWork: {
      encouraging: `Dear Parent, ${studentName} scored ${grade} (${percentage.toFixed(0)}%) in ${subjectName}, ${comparedToClass}${trendText[trend]}. With dedicated practice and support, we can help improve this together. - Class Teacher`,
      neutral: `Dear Parent, ${studentName} achieved ${grade} (${percentage.toFixed(0)}%) in ${subjectName}, ${comparedToClass}${trendText[trend]}. Extra support and regular practice are recommended. - Class Teacher`,
      serious: `Dear Parent, ${studentName} scored ${grade} (${percentage.toFixed(0)}%) in ${subjectName}, ${comparedToClass}${trendText[trend]}. Immediate attention is needed. Please arrange for extra study time and consider remedial support. - Class Teacher`,
    },
    struggling: {
      encouraging: `Dear Parent, ${studentName} scored ${grade} (${percentage.toFixed(0)}%) in ${subjectName}, ${comparedToClass}${trendText[trend]}. Let's work together to provide the support needed for improvement. Please contact me to discuss a study plan. - Class Teacher`,
      neutral: `Dear Parent, ${studentName} achieved ${grade} (${percentage.toFixed(0)}%) in ${subjectName}, ${comparedToClass}${trendText[trend]}. Significant improvement is required. Please schedule a meeting to discuss support options. - Class Teacher`,
      serious: `Dear Parent, ${studentName} scored ${grade} (${percentage.toFixed(0)}%) in ${subjectName}, ${comparedToClass}${trendText[trend]}. Urgent intervention is required. Please contact me immediately to discuss remedial measures. - Class Teacher`,
    },
  };

  return templates[performanceLevel][tone];
}

export const feedbackService = {
  async getByAssessment(assessmentId: string): Promise<Feedback[]> {
    const db = await getDb();
    const stmt = db.prepare(
      'SELECT id, student_id, assessment_id, message, tone, performance_level, created_at FROM feedback WHERE assessment_id = ? ORDER BY created_at DESC'
    );
    stmt.bind([assessmentId]);

    const feedbacks: Feedback[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      feedbacks.push({
        id: row[0] as string,
        studentId: row[1] as string,
        assessmentId: row[2] as string,
        message: row[3] as string,
        tone: row[4] as string,
        performanceLevel: row[5] as string,
        createdAt: row[6] as string,
      });
    }
    stmt.free();

    return feedbacks;
  },

  async getByStudent(studentId: string): Promise<Feedback[]> {
    const db = await getDb();
    const stmt = db.prepare(
      'SELECT id, student_id, assessment_id, message, tone, performance_level, created_at FROM feedback WHERE student_id = ? ORDER BY created_at DESC'
    );
    stmt.bind([studentId]);

    const feedbacks: Feedback[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      feedbacks.push({
        id: row[0] as string,
        studentId: row[1] as string,
        assessmentId: row[2] as string,
        message: row[3] as string,
        tone: row[4] as string,
        performanceLevel: row[5] as string,
        createdAt: row[6] as string,
      });
    }
    stmt.free();

    return feedbacks;
  },

  async create(
    data: Omit<NewFeedback, 'id' | 'createdAt'>
  ): Promise<Feedback> {
    const db = await getDb();
    const now = new Date().toISOString();
    const id = uuid();

    const stmt = db.prepare(
      'INSERT INTO feedback (id, student_id, assessment_id, message, tone, performance_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run([
      id,
      data.studentId,
      data.assessmentId,
      data.message,
      data.tone,
      data.performanceLevel,
      now,
    ]);
    stmt.free();

    await persistDb();

    return {
      id,
      studentId: data.studentId,
      assessmentId: data.assessmentId,
      message: data.message,
      tone: data.tone,
      performanceLevel: data.performanceLevel,
      createdAt: now,
    };
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM feedback WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    await persistDb();
  },

  async deleteByAssessment(assessmentId: string): Promise<void> {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM feedback WHERE assessment_id = ?');
    stmt.run([assessmentId]);
    stmt.free();
    await persistDb();
  },
};
