export interface FeedbackRequest {
  type: 'feedback';
  studentName: string;
  subjectName: string;
  assessmentName: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  classAverage: number;
  performanceLevel: string;
  trend: string;
  tone: 'encouraging' | 'neutral' | 'serious';
}

export function buildFeedbackPrompt(req: FeedbackRequest): string {
  const toneInstructions = {
    encouraging: 'Use a warm, supportive, and encouraging tone. Focus on positives and frame areas for improvement constructively.',
    neutral: 'Use a balanced, factual tone. Present both achievements and areas for improvement objectively.',
    serious: 'Use a direct, action-focused tone. Be clear about concerns and specific about what needs to be done.',
  };

  const trendDescription: Record<string, string> = {
    improving: 'showing improvement',
    stable: 'maintaining consistent performance',
    declining: 'showing a decline in performance',
    unknown: '',
  };

  return `Generate a brief parent feedback message (2-3 sentences) for a student.

Student: ${req.studentName}
Subject: ${req.subjectName}
Assessment: ${req.assessmentName}
Score: ${req.marksObtained}/${req.maxMarks} (${req.percentage.toFixed(0)}%)
Grade: ${req.grade}
Class Average: ${req.classAverage.toFixed(0)}%
Performance: ${req.performanceLevel}${req.trend !== 'unknown' ? `, ${trendDescription[req.trend]}` : ''}

${toneInstructions[req.tone]}

Write the message as if addressing "Dear Parent" and sign off as "Class Teacher". Keep it concise and actionable. Do not use markdown formatting.`;
}
