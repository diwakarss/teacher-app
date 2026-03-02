# Phase 1 Research — Teacher Assistant PWA MVP

## Context

| Attribute | Value |
|-----------|-------|
| Project Mode | `greenfield` |
| Work Mode | `feature` |
| Phase | 1 — MVP |
| Scope | Class/Student management, Marks entry, Feedback generation |

## Existing State

**Greenfield project** — no existing code. Starting from scratch with:
- `REQUIREMENTS.md` — Full user requirements
- `CLAUDE.md` — Project instructions
- `.planning/` — Planning artifacts

## Existing Debt

No architecture violations detected. Greenfield project.

## Proposed Approach

### 1. PWA Scaffold (Days 1-2)

- Initialize Next.js 14 with App Router
- Configure PWA (next-pwa, manifest, service worker)
- Set up sql.js with IndexedDB persistence
- Install shadcn/ui components
- Create base layout and navigation

### 2. Database Schema (Day 2)

```sql
-- Core tables
classes (id, name, academic_year, created_at, updated_at)
subjects (id, name, class_id, created_at, updated_at)
students (id, name, roll_number, class_id, parent_name, parent_phone, parent_email, created_at, updated_at)
assessments (id, name, type, subject_id, class_id, max_marks, date, term, created_at, updated_at)
marks (id, student_id, assessment_id, marks_obtained, remarks, created_at, updated_at)
```

### 3. Feature Implementation (Days 3-7)

| Feature | Components | Services |
|---------|------------|----------|
| Class Management | ClassList, ClassForm, ClassCard | classService |
| Subject Management | SubjectList, SubjectForm | subjectService |
| Student Management | StudentList, StudentForm, StudentSearch | studentService |
| Marks Entry | MarksGrid, AssessmentForm | assessmentService, marksService |
| Feedback Generation | FeedbackPanel, FeedbackCard | feedbackService |

### 4. IGCSE Integration (Throughout)

- Grade calculation with correct boundaries (A* to U)
- IGCSE subject templates (English, Mathematics, Sciences, etc.)
- Assessment types aligned with IGCSE structure

## Constraints

### Constraint Classification

| Constraint | Type | Evidence | Impact if Violated |
|------------|------|----------|-------------------|
| Offline-first | Hard | REQUIREMENTS.md §4.3 | App unusable without network |
| IGCSE grading | Hard | DECISIONS.md #5 | Incorrect grades, trust loss |
| PWA installable | Hard | REQUIREMENTS.md §4.1 | Can't install on mobile |
| < 3s load time | Hard | REQUIREMENTS.md §7 | Poor UX, abandonment |
| Single teacher | Soft | DECISIONS.md #1 | Scope creep if violated |
| English only | Soft | REQUIREMENTS.md §4.4 | i18n complexity if violated |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| sql.js bundle size | Medium | Medium | Lazy load after app shell |
| IndexedDB quota | Low | High | Monitor usage, warn user |
| Service worker bugs | Medium | High | Use Workbox, thorough testing |
| Slow marks entry | Medium | Medium | Keyboard nav, auto-save |
| Generic feedback | Medium | Low | Multiple templates, include data |

## Open Questions

1. **CSV import format** — What columns for bulk student import?
2. **Term structure** — How many terms per year? (Assuming 3)
3. **Assessment naming** — Free text or predefined types?

## Grounding Ledger

| Claim | Source | Date Checked | Confidence |
|-------|--------|--------------|------------|
| IGCSE grades A*-G + U | Cambridge Assessment | 2026-03-02 | HIGH |
| sql.js works in browser | sql.js docs | 2026-03-02 | HIGH |
| Next.js 14 supports PWA | next-pwa docs | 2026-03-02 | HIGH |
| Drizzle works with sql.js | Drizzle docs | 2026-03-02 | MEDIUM |
| shadcn/ui works with Next.js 14 | shadcn docs | 2026-03-02 | HIGH |

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Architecture | HIGH | Standard patterns, proven stack |
| Offline storage | HIGH | sql.js + IndexedDB well documented |
| PWA setup | HIGH | next-pwa is mature |
| IGCSE grading | HIGH | Official boundaries available |
| Feedback quality | MEDIUM | Templates may need iteration |
| Performance | MEDIUM | sql.js on mobile needs testing |

**Overall Confidence**: HIGH — Standard tech, clear requirements, known patterns.

---
*Research completed: 2026-03-02*
