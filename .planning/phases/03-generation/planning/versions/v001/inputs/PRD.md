# Product Requirements Document — Phase 3: Generation

## Executive Summary

Phase 3 adds AI-powered generation capabilities for lesson plans and question papers, enabling teachers to create structured educational content from uploaded chapter material in under 2 minutes.

## Problem Statement

Teachers spend significant time manually creating lesson plans and question papers. With chapter content already digitized (Phase 2), AI can generate structured educational materials that teachers can review and customize.

## Goals

1. Generate lesson plans from chapter content with configurable duration
2. Generate question papers with automatic marks distribution
3. Store generated content for reuse and editing
4. Export to PDF for printing

## Non-Goals

- Worksheet generation (separate feature)
- Word document export (Phase 4)
- Multi-language support
- Curriculum database integration
- Collaborative editing

## User Stories

### Lesson Plan Generation

**US-LP-1**: As a teacher, I want to select a chapter and generate a lesson plan so I can prepare for class quickly.

**Acceptance Criteria**:
- Can select any uploaded chapter
- Can specify duration in minutes (free-form)
- Can optionally add custom learning objectives
- Generation completes in < 30 seconds
- Plan includes: introduction, main content, activities, assessment, materials
- Can edit generated content before saving
- Can save to database for later access

**US-LP-2**: As a teacher, I want to view and edit my saved lesson plans so I can reuse and improve them.

**Acceptance Criteria**:
- Can view list of saved lesson plans by chapter
- Can open and edit any saved plan
- Can delete plans I no longer need
- Changes persist to database

### Question Paper Generation

**US-QP-1**: As a teacher, I want to generate a question paper with specified total marks so I can create assessments efficiently.

**Acceptance Criteria**:
- Can select one or more chapters
- Can specify total marks (40, 50, 100, or custom)
- Can choose preset template (Unit Test, Monthly Test, Term Exam)
- Template prefills section distribution, can be adjusted
- Can set difficulty level (Easy, Medium, Hard, Mixed)
- Generation completes in < 2 minutes
- Paper includes proper header, sections, marks per question
- Answer key generated separately
- Can edit before saving

**US-QP-2**: As a teacher, I want question papers auto-formatted for printing so I can use them directly.

**Acceptance Criteria**:
- Preview shows print-ready layout
- Can export to PDF via browser print
- Includes school header placeholder, date, duration, max marks
- Clear section numbering and marks allocation

### Export

**US-EX-1**: As a teacher, I want to export lesson plans and question papers to PDF so I can print or share them.

**Acceptance Criteria**:
- PDF export button on preview screen
- Clean formatting without UI chrome
- Works in Chrome, Safari, Firefox
- Answer key on separate page (for question papers)

### Offline Handling

**US-OFF-1**: As a teacher, I want clear feedback when offline so I know generation requires internet.

**Acceptance Criteria**:
- Generate buttons disabled when offline
- Clear message: "Generation requires internet connection"
- Previously saved content viewable offline

## Technical Specifications

### Database Schema

**lesson_plans**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| chapterId | TEXT FK | Reference to chapters |
| subjectId | TEXT FK | Reference to subjects |
| name | TEXT | Plan title |
| duration | INTEGER | Duration in minutes |
| objectives | TEXT | JSON array of objectives |
| sections | TEXT | JSON with intro/content/activities/assessment |
| materials | TEXT | JSON array of required materials |
| createdAt | TEXT | ISO timestamp |
| updatedAt | TEXT | ISO timestamp |

**question_papers**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| subjectId | TEXT FK | Reference to subjects |
| chapterIds | TEXT | JSON array of chapter IDs |
| name | TEXT | Paper title |
| totalMarks | INTEGER | Total marks |
| duration | INTEGER | Duration in minutes |
| difficulty | TEXT | easy/medium/hard/mixed |
| template | TEXT | unit_test/monthly_test/term_exam/custom |
| sections | TEXT | JSON with Section A/B/C questions |
| answerKey | TEXT | JSON answer key |
| createdAt | TEXT | ISO timestamp |
| updatedAt | TEXT | ISO timestamp |

### API Endpoints

**POST /api/generate**
```typescript
// Request
{
  type: 'lesson_plan' | 'question_paper',
  chapterId?: string,      // for lesson plan
  chapterIds?: string[],   // for question paper
  duration: number,
  objectives?: string[],   // for lesson plan
  totalMarks?: number,     // for question paper
  template?: string,       // for question paper
  difficulty?: string      // for question paper
}

// Response
{
  success: boolean,
  content: LessonPlan | QuestionPaper,
  tokensUsed?: number
}
```

### Preset Templates

| Template | Marks | Section A | Section B | Section C |
|----------|-------|-----------|-----------|-----------|
| Unit Test | 40 | 10×1=10 | 5×2=10 | 4×5=20 |
| Monthly Test | 50 | 10×1=10 | 10×2=20 | 4×5=20 |
| Term Exam | 100 | 20×1=20 | 15×2=30 | 10×5=50 |

### UI Routes

| Route | Purpose |
|-------|---------|
| /generate/lesson-plan | Lesson plan generator form |
| /generate/lesson-plan/[id] | View/edit saved plan |
| /generate/question-paper | Question paper generator form |
| /generate/question-paper/[id] | View/edit saved paper |

## Success Metrics

| Metric | Target |
|--------|--------|
| Lesson plan generation time | < 30 seconds |
| Question paper generation time | < 2 minutes |
| Content requiring editing | < 10% (ideal) |
| PDF export success rate | 100% |
| Offline error clarity | Clear message shown |

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| @aws-sdk/client-bedrock-runtime | ^3.x | Bedrock API client |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| API latency | Use Haiku (fastest model) |
| Poor generation quality | Iterate on prompts, allow editing |
| AWS credential exposure | Server-side route handlers only |
| Large chapter content | Truncate to 50K tokens max |

## Open Items

1. Rate limiting strategy (if needed)
2. Token usage monitoring
3. Generation history display

## Timeline Estimate

| Wave | Focus | Tasks |
|------|-------|-------|
| 1 | Database + API | Schema, migration, /api/generate route |
| 2 | Lesson Plans | Service, store, UI, prompt |
| 3 | Question Papers | Service, store, UI, templates |
| 4 | Export + Polish | PDF export, error handling, tests |

---
*PRD v1.0 — Phase 3 Generation*
