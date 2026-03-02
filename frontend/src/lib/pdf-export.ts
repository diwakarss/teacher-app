/**
 * PDF Export Utility
 *
 * Uses browser print functionality with a dedicated print window.
 * This approach is simpler and produces better formatted PDFs than
 * client-side PDF libraries for document-style content.
 */

export interface PrintOptions {
  title: string;
  filename?: string;
}

/**
 * Opens a print dialog for the given HTML content
 */
export function printContent(html: string, options: PrintOptions): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${options.title}</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #1a1a1a;
          padding: 20mm;
          max-width: 210mm;
          margin: 0 auto;
        }

        h1 {
          font-size: 18pt;
          margin-bottom: 16pt;
          color: #111;
          border-bottom: 2px solid #333;
          padding-bottom: 8pt;
        }

        h2 {
          font-size: 14pt;
          margin-top: 16pt;
          margin-bottom: 8pt;
          color: #222;
        }

        h3 {
          font-size: 12pt;
          margin-top: 12pt;
          margin-bottom: 6pt;
          color: #333;
        }

        h4 {
          font-size: 11pt;
          margin-top: 10pt;
          margin-bottom: 4pt;
          color: #444;
        }

        p {
          margin-bottom: 8pt;
        }

        ul, ol {
          margin-left: 20pt;
          margin-bottom: 8pt;
        }

        li {
          margin-bottom: 4pt;
        }

        .header {
          text-align: center;
          margin-bottom: 20pt;
          padding-bottom: 12pt;
          border-bottom: 1px solid #ccc;
        }

        .header h1 {
          border-bottom: none;
          margin-bottom: 8pt;
        }

        .header-info {
          display: flex;
          justify-content: space-between;
          font-size: 10pt;
          color: #666;
        }

        .section {
          margin-bottom: 16pt;
          page-break-inside: avoid;
        }

        .section-title {
          background: #f5f5f5;
          padding: 8pt 12pt;
          margin-bottom: 8pt;
          border-left: 4px solid #333;
        }

        .question {
          margin-bottom: 12pt;
          padding: 8pt;
          border: 1px solid #ddd;
          border-radius: 4pt;
          page-break-inside: avoid;
        }

        .question-number {
          font-weight: bold;
          color: #333;
        }

        .question-marks {
          float: right;
          font-size: 10pt;
          color: #666;
        }

        .options {
          margin-left: 16pt;
          margin-top: 8pt;
        }

        .options li {
          list-style: none;
        }

        .answer-key {
          margin-top: 24pt;
          padding-top: 12pt;
          border-top: 2px solid #333;
        }

        .answer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4pt;
          font-size: 10pt;
        }

        .answer-item {
          padding: 4pt;
          background: #f9f9f9;
        }

        .objectives {
          background: #f0f7ff;
          padding: 12pt;
          border-radius: 4pt;
          margin-bottom: 16pt;
        }

        .activity {
          background: #fff8f0;
          padding: 8pt;
          border-radius: 4pt;
          margin-bottom: 8pt;
        }

        .materials {
          background: #f0fff4;
          padding: 8pt;
          border-radius: 4pt;
        }

        .badge {
          display: inline-block;
          padding: 2pt 6pt;
          background: #e0e0e0;
          border-radius: 2pt;
          font-size: 9pt;
          margin-right: 4pt;
        }

        .instructions {
          font-style: italic;
          color: #555;
          margin-bottom: 12pt;
          padding: 8pt;
          background: #fafafa;
          border-left: 3px solid #999;
        }

        @media print {
          body {
            padding: 0;
          }

          .no-print {
            display: none;
          }

          .page-break {
            page-break-before: always;
          }
        }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;

  printWindow.document.write(fullHtml);
  printWindow.document.close();

  // Wait for content to load, then trigger print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

/**
 * Formats a lesson plan as printable HTML
 */
export function formatLessonPlanForPrint(plan: {
  name: string;
  duration: number;
  objectives: string[];
  sections: {
    introduction: { duration: number; content: string; hook: string };
    mainContent: { duration: number; topics: string[]; teachingStrategies: string[] };
    activities: { duration: number; activities: Array<{ name: string; description: string; materials?: string[] }> };
    assessment: { duration: number; methods: string[]; questions: string[] };
    differentiation: { advanced: string[]; struggling: string[] };
  };
  materials: string[];
}): string {
  return `
    <div class="header">
      <h1>${plan.name}</h1>
      <div class="header-info">
        <span>Duration: ${plan.duration} minutes</span>
        <span>Generated: ${new Date().toLocaleDateString()}</span>
      </div>
    </div>

    <div class="objectives">
      <h2>Learning Objectives</h2>
      <ol>
        ${plan.objectives.map((obj) => `<li>${obj}</li>`).join('')}
      </ol>
    </div>

    <div class="section">
      <div class="section-title">
        <h2>Introduction <span class="badge">${plan.sections.introduction.duration} min</span></h2>
      </div>
      <p>${plan.sections.introduction.content}</p>
      <p><strong>Hook:</strong> ${plan.sections.introduction.hook}</p>
    </div>

    <div class="section">
      <div class="section-title">
        <h2>Main Content <span class="badge">${plan.sections.mainContent.duration} min</span></h2>
      </div>
      <h4>Topics</h4>
      <ul>
        ${plan.sections.mainContent.topics.map((t) => `<li>${t}</li>`).join('')}
      </ul>
      <h4>Teaching Strategies</h4>
      <ul>
        ${plan.sections.mainContent.teachingStrategies.map((s) => `<li>${s}</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <div class="section-title">
        <h2>Activities <span class="badge">${plan.sections.activities.duration} min</span></h2>
      </div>
      ${plan.sections.activities.activities
        .map(
          (a) => `
        <div class="activity">
          <h4>${a.name}</h4>
          <p>${a.description}</p>
          ${a.materials?.length ? `<p><strong>Materials:</strong> ${a.materials.join(', ')}</p>` : ''}
        </div>
      `
        )
        .join('')}
    </div>

    <div class="section">
      <div class="section-title">
        <h2>Assessment <span class="badge">${plan.sections.assessment.duration} min</span></h2>
      </div>
      <h4>Methods</h4>
      <ul>
        ${plan.sections.assessment.methods.map((m) => `<li>${m}</li>`).join('')}
      </ul>
      <h4>Questions</h4>
      <ol>
        ${plan.sections.assessment.questions.map((q) => `<li>${q}</li>`).join('')}
      </ol>
    </div>

    <div class="section">
      <div class="section-title">
        <h2>Differentiation</h2>
      </div>
      <h4>For Advanced Students</h4>
      <ul>
        ${plan.sections.differentiation.advanced.map((a) => `<li>${a}</li>`).join('')}
      </ul>
      <h4>For Struggling Students</h4>
      <ul>
        ${plan.sections.differentiation.struggling.map((s) => `<li>${s}</li>`).join('')}
      </ul>
    </div>

    ${
      plan.materials.length > 0
        ? `
    <div class="materials">
      <h2>Materials Needed</h2>
      <ul>
        ${plan.materials.map((m) => `<li>${m}</li>`).join('')}
      </ul>
    </div>
    `
        : ''
    }
  `;
}

/**
 * Formats a question paper as printable HTML
 */
export function formatQuestionPaperForPrint(
  paper: {
    name: string;
    totalMarks: number;
    duration: number;
    sections: Array<{
      name: string;
      instructions: string;
      totalMarks: number;
      questions: Array<{
        number: number;
        text: string;
        marks: number;
        type: string;
        options?: string[];
      }>;
    }>;
  },
  includeAnswers: boolean = false,
  answerKey?: Array<{ questionNumber: string; answer: string }>
): string {
  const sectionPrefixes = ['A', 'B', 'C', 'D', 'E'];

  return `
    <div class="header">
      <h1>${paper.name}</h1>
      <div class="header-info">
        <span>Total Marks: ${paper.totalMarks}</span>
        <span>Duration: ${paper.duration} minutes</span>
      </div>
    </div>

    <div class="instructions">
      <strong>General Instructions:</strong>
      <ul>
        <li>Answer all questions.</li>
        <li>Write clearly and legibly.</li>
        <li>Show all working where applicable.</li>
      </ul>
    </div>

    ${paper.sections
      .map(
        (section, sIdx) => `
      <div class="section">
        <div class="section-title">
          <h2>${section.name} <span class="badge">${section.totalMarks} marks</span></h2>
        </div>
        <p class="instructions">${section.instructions}</p>

        ${section.questions
          .map(
            (q) => `
          <div class="question">
            <span class="question-marks">[${q.marks} ${q.marks === 1 ? 'mark' : 'marks'}]</span>
            <span class="question-number">${sectionPrefixes[sIdx] || 'Q'}${q.number}.</span>
            ${q.text}
            ${
              q.options?.length
                ? `
              <ul class="options">
                ${q.options.map((opt) => `<li>${opt}</li>`).join('')}
              </ul>
            `
                : ''
            }
          </div>
        `
          )
          .join('')}
      </div>
    `
      )
      .join('')}

    ${
      includeAnswers && answerKey
        ? `
      <div class="answer-key page-break">
        <h2>Answer Key</h2>
        <div class="answer-grid">
          ${answerKey.map((item) => `<div class="answer-item"><strong>${item.questionNumber}:</strong> ${item.answer}</div>`).join('')}
        </div>
      </div>
    `
        : ''
    }
  `;
}

/**
 * Export lesson plan as PDF
 */
export function exportLessonPlanPdf(plan: Parameters<typeof formatLessonPlanForPrint>[0]): void {
  const html = formatLessonPlanForPrint(plan);
  printContent(html, { title: plan.name });
}

/**
 * Export question paper as PDF
 */
export function exportQuestionPaperPdf(
  paper: Parameters<typeof formatQuestionPaperForPrint>[0],
  includeAnswers: boolean = false,
  answerKey?: Array<{ questionNumber: string; answer: string }>
): void {
  const html = formatQuestionPaperForPrint(paper, includeAnswers, answerKey);
  printContent(html, { title: paper.name });
}
