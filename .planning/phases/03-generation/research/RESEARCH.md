# Phase 3 Research — Generation

## Context

| Attribute | Value |
|-----------|-------|
| Project Mode | existing |
| Work Mode | feature |
| Phase | 03-generation |
| Scope | Lesson plan and question paper generation |

## Existing State

Phase 1 (MVP) and Phase 2 (Content Upload & OCR) are complete. The codebase has:

- **79 files** analyzed, 0 circular dependencies
- **Database**: sql.js + IndexedDB with Drizzle ORM
- **Tables**: classes, subjects, students, assessments, marks, feedback, chapters
- **Stores**: app-store, class-store, student-store, marks-store, feedback-store, content-store
- **Services**: class-service, subject-service, student-service, assessment-service, marks-service, feedback-service, chapter-service
- **Content System**: PDF extraction, OCR, chapter detection, content viewing/editing

Key integration points for Phase 3:
- `chapter-service.ts` — fetch chapter content for AI prompts
- `content-store.ts` — chapter selection in UI
- Existing service/store pattern to follow

## Existing Debt

No architecture violations detected. Codebase is clean.

## Proposed Approach

### 1. AI Integration Layer

**New dependency**: `@aws-sdk/client-bedrock-runtime`

**API Route**: `/api/generate/route.ts`
- Server-side only (credentials protected)
- Uses Bedrock Converse API
- Model: Claude 3 Haiku (`anthropic.claude-3-haiku-20240307-v1:0`)

**Prompt Templates**: `src/lib/prompts/`
- `lesson-plan-prompt.ts` — structured lesson plan generation
- `question-paper-prompt.ts` — question paper with marks distribution

### 2. Database Schema

**lesson_plans table**
```typescript
{
  id: text().primaryKey(),
  chapterId: text().references(chapters.id),
  subjectId: text().references(subjects.id),
  name: text().notNull(),
  duration: integer().notNull(), // minutes
  objectives: text().notNull(), // JSON array
  sections: text().notNull(), // JSON: intro, content, activities, assessment
  materials: text(), // JSON array
  createdAt: text().notNull(),
  updatedAt: text().notNull()
}
```

**question_papers table**
```typescript
{
  id: text().primaryKey(),
  subjectId: text().references(subjects.id),
  chapterIds: text().notNull(), // JSON array of chapter IDs
  name: text().notNull(),
  totalMarks: integer().notNull(),
  duration: integer().notNull(), // minutes
  difficulty: text().notNull(), // 'easy' | 'medium' | 'hard' | 'mixed'
  template: text().notNull(), // 'unit_test' | 'term_exam' | 'custom'
  sections: text().notNull(), // JSON: Section A/B/C with questions
  answerKey: text().notNull(), // JSON
  createdAt: text().notNull(),
  updatedAt: text().notNull()
}
```

### 3. Services

**lesson-plan-service.ts**
- `generate(chapterId, duration, customObjectives?)` — call AI, parse response
- `save(lessonPlan)` — persist to DB
- `getByChapterId(chapterId)` — list saved plans
- `getById(id)` — fetch single plan
- `update(id, data)` — edit plan
- `delete(id)` — remove plan

**question-paper-service.ts**
- `generate(chapterIds, totalMarks, template, difficulty)` — call AI
- `calculateDistribution(totalMarks, template)` — auto-calculate sections
- `save(paper)` — persist to DB
- `getBySubjectId(subjectId)` — list saved papers
- `getById(id)` — fetch single paper
- `update(id, data)` — edit paper
- `delete(id)` — remove paper
- `regenerateAnswerKey(id)` — regenerate answer key only

### 4. UI Components

**Routes**:
- `/generate/lesson-plan` — lesson plan generator
- `/generate/question-paper` — question paper generator
- `/generate/lesson-plan/[id]` — view/edit saved plan
- `/generate/question-paper/[id]` — view/edit saved paper

**Components**:
- `lesson-plan-form.tsx` — chapter select, duration input, objectives
- `question-paper-form.tsx` — chapter multi-select, marks, template picker
- `generation-preview.tsx` — display generated content with edit mode
- `pdf-export-button.tsx` — trigger browser print / PDF download

### 5. Preset Templates

**Question Paper Templates**:
| Template | Total Marks | Section A (1-mark) | Section B (2-mark) | Section C (5-mark) |
|----------|-------------|--------------------|--------------------|---------------------|
| Unit Test | 40 | 10×1=10 | 5×2=10 | 4×5=20 |
| Monthly Test | 50 | 10×1=10 | 10×2=20 | 4×5=20 |
| Term Exam | 100 | 20×1=20 | 15×2=30 | 10×5=50 |

Templates prefill values but teacher can adjust before generation.

### 6. Export

**MVP approach**: HTML preview with print stylesheet
- Use `@media print` CSS for clean PDF output
- `window.print()` triggers browser PDF dialog
- Works cross-browser without additional dependencies

**Optional enhancement**: jsPDF for programmatic PDF generation

## Risks / Pitfalls

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Bedrock latency exceeds 2 min | Low | High | Use Haiku (fast), chunk large chapters |
| Poor quality from short chapters | Medium | Medium | Minimum content threshold, fallback message |
| AWS credentials exposure | Low | Critical | Server-side only, env vars |
| Offline user confusion | Medium | Low | Clear "requires internet" messaging |
| Chapter content too large for context | Low | Medium | Truncate/summarize if > 100K tokens |

## Open Questions

1. **Rate limiting**: Should we limit generations per day/user?
2. **Cost monitoring**: Add token usage logging?
3. **History**: Show generation history in UI?
4. **Regenerate**: Allow "regenerate" with same params?

## Confidence Assessment

| Aspect | Confidence | Notes |
|--------|------------|-------|
| Bedrock integration | HIGH | Well-documented, standard pattern |
| Schema design | HIGH | Follows existing patterns |
| UI implementation | HIGH | Uses established component patterns |
| Prompt quality | MEDIUM | May need iteration for IGCSE alignment |
| PDF export | HIGH | Browser print is reliable |
| Performance (<2 min) | HIGH | Haiku is fast, small payloads |

## Constraint Classification

| Constraint | Type | Evidence | Impact if Violated |
|-----------|------|----------|-------------------|
| AWS Bedrock for AI | Hard | Architecture decision | No AI generation |
| Claude Haiku model | Soft | Cost decision | Higher costs with Sonnet |
| IGCSE curriculum | Hard | PROJECT.md | Wrong difficulty/terminology |
| Generation < 2 min | Hard | REQUIREMENTS.md | Poor UX |
| Store in DB | Hard | Checkpoint 1 decision | Data loss |
| Free-form duration | Soft | Checkpoint 1 decision | UX friction |

## Grounding Ledger

| Claim | Source | Date Checked | Confidence |
|-------|--------|--------------|------------|
| Bedrock Converse API pattern | AWS Docs | 2026-03-02 | HIGH |
| Claude Haiku model ID | AWS Docs | 2026-03-02 | HIGH |
| Haiku pricing (~$0.25/1M in) | AWS Pricing | 2026-03-02 | MEDIUM |
| Haiku quality for structured tasks | Anthropic docs + testing | 2026-03-02 | HIGH |
| Next.js Route Handlers work with Bedrock SDK | Verified pattern | 2026-03-02 | HIGH |
