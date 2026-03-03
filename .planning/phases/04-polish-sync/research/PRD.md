# Product Requirements Document: Phase 4 - Polish & Sync

## Executive Summary

Phase 4 adds polish features to make the Teacher Assistant PWA production-ready: Document Formatter for Word documents, Analytics Dashboard for performance visualization, Data Export/Import for backup, and Google Drive integration for cloud sync.

## Problem Statement

Teachers need to:
1. **Format documents** - Apply consistent formatting to worksheets and handouts
2. **Track progress** - Visualize student performance trends over time
3. **Backup data** - Protect their work with exportable backups
4. **Sync across devices** - Access data from multiple devices via cloud

## User Stories

### Document Formatter (Wave 1 - P0)

**US-4.1**: As a teacher, I want to upload a Word document and apply formatting rules so that my documents have consistent styling.

**Acceptance Criteria**:
- Can upload .docx files up to 10MB
- Can preview document content before formatting
- Can apply font, size, and spacing rules
- Can save formatting presets for reuse
- Can download formatted document as .docx

**US-4.2**: As a teacher, I want to save formatting presets so that I can quickly apply the same rules to multiple documents.

**Acceptance Criteria**:
- Can create named presets with custom rules
- Can edit existing presets
- Can delete presets
- Presets persist across sessions

### Analytics Dashboard (Wave 2 - P1)

**US-4.3**: As a teacher, I want to see student progress over time so that I can identify students who need help.

**Acceptance Criteria**:
- Line chart showing marks trend per student
- Filter by class, subject, date range
- Highlight students below passing threshold
- Export chart as image

**US-4.4**: As a teacher, I want to see assessment breakdown so that I can understand class performance.

**Acceptance Criteria**:
- Bar chart comparing assessment averages
- Grade distribution pie chart
- Filter by class and subject
- Show statistics (mean, median, pass rate)

### Data Export/Import (Wave 3 - P2)

**US-4.5**: As a teacher, I want to export all my data so that I have a backup I can restore later.

**Acceptance Criteria**:
- Single-click export of all data
- JSON format with schema version
- Includes: classes, subjects, students, marks, chapters, lesson plans, question papers
- File named with timestamp

**US-4.6**: As a teacher, I want to import data from a backup so that I can restore my work.

**Acceptance Criteria**:
- Upload JSON backup file
- Validate schema version compatibility
- Preview data before import
- Choose merge or replace strategy
- Show import summary

### Google Drive Sync (Wave 4 - P3)

**US-4.7**: As a teacher, I want to backup my data to Google Drive so that it's safe in the cloud.

**Acceptance Criteria**:
- OAuth login with Google account
- Upload backup to user's Drive folder
- Show last backup timestamp
- Manual backup trigger

**US-4.8**: As a teacher, I want to restore from Google Drive so that I can recover my data on a new device.

**Acceptance Criteria**:
- List available backups from Drive
- Select and download backup
- Import with same flow as local import

## Technical Specifications

### Document Formatter

```typescript
interface FormattingPreset {
  id: string;
  name: string;
  rules: {
    headingFont: string;
    headingSize: number;
    bodyFont: string;
    bodySize: number;
    lineSpacing: number;
    margins: { top: number; bottom: number; left: number; right: number };
  };
  createdAt: string;
}

interface DocFormatterService {
  parseDocx(file: File): Promise<ParsedDocument>;
  applyFormatting(doc: ParsedDocument, preset: FormattingPreset): Promise<Blob>;
  savePreset(preset: FormattingPreset): void;
  getPresets(): FormattingPreset[];
  deletePreset(id: string): void;
}
```

### Analytics Service

```typescript
interface AnalyticsService {
  getStudentProgress(studentId: string, options?: {
    subjectId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<ProgressDataPoint[]>;

  getAssessmentBreakdown(classId: string, options?: {
    subjectId?: string;
  }): Promise<AssessmentSummary[]>;

  getGradeDistribution(classId: string, subjectId?: string): Promise<GradeCount[]>;

  getClassStats(classId: string): Promise<ClassStatistics>;
}

interface ProgressDataPoint {
  date: string;
  assessmentName: string;
  percentage: number;
  grade: string;
}

interface ClassStatistics {
  mean: number;
  median: number;
  passRate: number;
  topPerformer: string;
  needsAttention: string[];
}
```

### Export Service

```typescript
interface ExportData {
  version: string;
  exportedAt: string;
  data: {
    classes: Class[];
    subjects: Subject[];
    students: Student[];
    assessments: Assessment[];
    marks: Mark[];
    chapters: Chapter[];
    lessonPlans: LessonPlan[];
    questionPapers: QuestionPaper[];
  };
}

interface ExportService {
  exportAll(): Promise<ExportData>;
  downloadAsJson(data: ExportData): void;
  validateImport(file: File): Promise<ValidationResult>;
  importData(data: ExportData, strategy: 'merge' | 'replace'): Promise<ImportResult>;
}
```

### Drive Service

```typescript
interface DriveService {
  authenticate(): Promise<boolean>;
  isAuthenticated(): boolean;
  logout(): void;
  uploadBackup(data: ExportData): Promise<DriveFile>;
  listBackups(): Promise<DriveFile[]>;
  downloadBackup(fileId: string): Promise<ExportData>;
  deleteBackup(fileId: string): Promise<void>;
}
```

## UI/UX Requirements

### Settings Page Layout

```
/settings
├── Document Formatter (Tab 1 - Default)
│   ├── Upload Zone
│   ├── Preview Panel
│   ├── Formatting Options
│   ├── Preset Selector
│   └── Download Button
├── Data Management (Tab 2)
│   ├── Export Section
│   │   ├── Export All Button
│   │   └── Last Export Info
│   └── Import Section
│       ├── Upload Zone
│       └── Import Options
└── Cloud Sync (Tab 3)
    ├── Google Account Connection
    ├── Backup Now Button
    ├── Backup History
    └── Restore Options
```

### Analytics on Home Page

```
/ (Home)
├── Quick Stats Cards (existing)
├── Student Progress Chart (new)
│   └── Line chart with filter controls
├── Assessment Breakdown (new)
│   └── Bar chart with class/subject filter
└── Grade Distribution (new)
    └── Pie chart for selected class
```

## Non-Functional Requirements

| Requirement | Target | Notes |
|-------------|--------|-------|
| Document upload size | ≤10MB | Browser memory constraint |
| Export file size | No limit | Streaming for large data |
| Chart render time | <500ms | Lazy load recharts |
| Offline support | Full | Except Google Drive |
| Test coverage | ≥70% | New code only |

## Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| mammoth | ^1.6.0 | .docx parsing |
| docx | ^8.5.0 | .docx generation |
| recharts | ^2.12.0 | Charts |
| gapi-script | ^1.2.0 | Google API (optional) |

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| mammoth.js formatting limitations | Test early; document known limitations |
| Google OAuth user friction | Make Drive optional; local export always works |
| Large data import performance | Show progress; process in chunks |

## Success Metrics

- Document Formatter: 80% of uploaded docs format successfully
- Analytics: Dashboard loads in <2s with 1000 marks
- Export: 100% data recovery from backup
- Drive: OAuth success rate >95%

## Timeline

| Wave | Feature | Estimate |
|------|---------|----------|
| Wave 1 | Document Formatter | — |
| Wave 2 | Analytics Dashboard | — |
| Wave 3 | Data Export/Import | — |
| Wave 4 | Google Drive Sync | — |

---
*PRD Version: 1.0 | Created: 2026-03-03*
