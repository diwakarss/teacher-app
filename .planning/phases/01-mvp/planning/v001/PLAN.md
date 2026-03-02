# Phase 1 Implementation Plan — Teacher Assistant PWA MVP

**Version**: v001
**Created**: 2026-03-02
**Status**: Draft

---

## Overview

Build an offline-first PWA enabling teachers to manage classes, students, marks, and generate feedback. IGCSE curriculum aligned.

## Success Criteria

1. Create class with IGCSE subjects in < 1 minute
2. Add 30 students in < 5 minutes
3. Enter marks for 30 students in < 5 minutes
4. IGCSE grades auto-calculate correctly
5. Feedback generates in < 2 seconds
6. App installs on mobile, works offline
7. Load time < 3 seconds

---

## Task Breakdown

### Wave 1: Foundation (Scaffold + Database)

| ID | Task | Dependencies | Estimate |
|----|------|--------------|----------|
| 1.1 | Initialize Next.js 14 project with TypeScript | - | 30m |
| 1.2 | Configure PWA (next-pwa, manifest, icons) | 1.1 | 1h |
| 1.3 | Set up Tailwind CSS + shadcn/ui | 1.1 | 30m |
| 1.4 | Configure sql.js with IndexedDB persistence | 1.1 | 2h |
| 1.5 | Create Drizzle schema for all tables | 1.4 | 1h |
| 1.6 | Implement database migrations system | 1.5 | 1h |
| 1.7 | Set up Zustand stores skeleton | 1.1 | 30m |
| 1.8 | Create base layout with navigation | 1.3 | 1h |

**Wave 1 Total**: ~8 hours

### Wave 2: Class & Subject Management

| ID | Task | Dependencies | Estimate |
|----|------|--------------|----------|
| 2.1 | Create classService (CRUD operations) | 1.5, 1.7 | 1h |
| 2.2 | Create subjectService (CRUD operations) | 1.5, 1.7 | 1h |
| 2.3 | Build ClassList page | 1.8, 2.1 | 1h |
| 2.4 | Build ClassForm component (create/edit) | 2.3 | 1h |
| 2.5 | Build ClassDetail page with subjects | 2.1, 2.2 | 1.5h |
| 2.6 | Build SubjectForm component | 2.5 | 45m |
| 2.7 | Add IGCSE subject templates | 2.2 | 30m |
| 2.8 | Implement class switcher in header | 2.3 | 45m |

**Wave 2 Total**: ~7.5 hours

### Wave 3: Student Management

| ID | Task | Dependencies | Estimate |
|----|------|--------------|----------|
| 3.1 | Create studentService (CRUD operations) | 1.5, 1.7 | 1h |
| 3.2 | Build StudentList page with search | 3.1, 1.8 | 1.5h |
| 3.3 | Build StudentForm component (create/edit) | 3.2 | 1h |
| 3.4 | Build StudentCard component | 3.2 | 30m |
| 3.5 | Build StudentDetail page | 3.1 | 1h |
| 3.6 | Implement student search (name/roll) | 3.2 | 45m |
| 3.7 | Add delete student with confirmation | 3.2 | 30m |

**Wave 3 Total**: ~6.25 hours

### Wave 4: Marks Entry & Grading

| ID | Task | Dependencies | Estimate |
|----|------|--------------|----------|
| 4.1 | Create assessmentService (CRUD) | 1.5, 1.7 | 1h |
| 4.2 | Create marksService (CRUD) | 1.5, 1.7 | 1h |
| 4.3 | Implement IGCSE grade calculator | - | 30m |
| 4.4 | Build AssessmentList page | 4.1, 1.8 | 1h |
| 4.5 | Build AssessmentForm component | 4.4 | 1h |
| 4.6 | Build MarksGrid component (bulk entry) | 4.2, 3.1 | 2h |
| 4.7 | Implement keyboard navigation in grid | 4.6 | 1h |
| 4.8 | Add auto-save on field blur | 4.6 | 30m |
| 4.9 | Display grades next to marks | 4.3, 4.6 | 30m |
| 4.10 | Build class statistics component | 4.2 | 1h |

**Wave 4 Total**: ~9.5 hours

### Wave 5: Feedback Generation

| ID | Task | Dependencies | Estimate |
|----|------|--------------|----------|
| 5.1 | Create feedback templates | - | 1h |
| 5.2 | Build feedbackService (template-based) | 5.1, 4.2 | 1.5h |
| 5.3 | Build FeedbackPanel page | 5.2, 1.8 | 1.5h |
| 5.4 | Build FeedbackCard component | 5.3 | 45m |
| 5.5 | Implement copy to clipboard | 5.4 | 30m |
| 5.6 | Add SMS/WhatsApp format toggle | 5.3 | 30m |
| 5.7 | Create API route for Claude enhancement | 5.2 | 1h |
| 5.8 | Implement online/offline feedback toggle | 5.7 | 45m |
| 5.9 | Add bulk feedback generation | 5.2 | 1h |

**Wave 5 Total**: ~8.5 hours

### Wave 6: Polish & PWA

| ID | Task | Dependencies | Estimate |
|----|------|--------------|----------|
| 6.1 | Implement offline indicator | 1.2 | 30m |
| 6.2 | Configure service worker caching | 1.2 | 1h |
| 6.3 | Add loading states and skeletons | All UI | 1h |
| 6.4 | Implement error boundaries | All | 30m |
| 6.5 | Add toast notifications | All | 30m |
| 6.6 | Mobile responsive polish | All UI | 2h |
| 6.7 | PWA audit and fixes | 6.2 | 1h |
| 6.8 | Dashboard with quick stats | 2.1, 3.1, 4.2 | 1.5h |

**Wave 6 Total**: ~8 hours

### Wave 7: Testing

| ID | Task | Dependencies | Estimate |
|----|------|--------------|----------|
| 7.1 | Set up Vitest | 1.1 | 30m |
| 7.2 | Unit tests for grade calculator | 4.3 | 30m |
| 7.3 | Unit tests for services | 2.1-5.2 | 2h |
| 7.4 | Component tests for forms | All forms | 2h |
| 7.5 | Set up Playwright | 1.1 | 30m |
| 7.6 | E2E: Create class → add students → enter marks | All | 1.5h |
| 7.7 | E2E: Offline functionality | 6.2 | 1h |
| 7.8 | E2E: PWA install flow | 6.7 | 30m |

**Wave 7 Total**: ~8.5 hours

---

## Dependency Graph

```
Wave 1 (Foundation)
    │
    ├──► Wave 2 (Classes)
    │        │
    │        └──► Wave 3 (Students)
    │                 │
    │                 └──► Wave 4 (Marks)
    │                          │
    │                          └──► Wave 5 (Feedback)
    │
    └──► Wave 6 (Polish) ◄── All Waves
              │
              └──► Wave 7 (Testing)
```

## Total Estimate

| Wave | Hours |
|------|-------|
| 1 - Foundation | 8h |
| 2 - Classes | 7.5h |
| 3 - Students | 6.25h |
| 4 - Marks | 9.5h |
| 5 - Feedback | 8.5h |
| 6 - Polish | 8h |
| 7 - Testing | 8.5h |
| **Total** | **~56 hours** |

With buffer: **~70 hours** (1.25x)

---

## File Structure (Target)

```
teacher-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Dashboard
│   ├── classes/
│   │   ├── page.tsx               # ClassList
│   │   ├── new/page.tsx           # Create class
│   │   └── [id]/
│   │       ├── page.tsx           # ClassDetail
│   │       └── edit/page.tsx      # Edit class
│   ├── students/
│   │   ├── page.tsx               # StudentList
│   │   ├── new/page.tsx           # Create student
│   │   └── [id]/
│   │       ├── page.tsx           # StudentDetail
│   │       └── edit/page.tsx      # Edit student
│   ├── marks/
│   │   ├── page.tsx               # AssessmentList
│   │   ├── new/page.tsx           # Create assessment
│   │   └── [id]/page.tsx          # MarksGrid
│   ├── feedback/
│   │   └── page.tsx               # FeedbackPanel
│   └── api/
│       └── feedback/route.ts      # Claude API proxy
├── components/
│   ├── ui/                        # shadcn/ui
│   ├── layout/
│   │   ├── Navigation.tsx
│   │   ├── Header.tsx
│   │   └── ClassSwitcher.tsx
│   ├── classes/
│   │   ├── ClassCard.tsx
│   │   └── ClassForm.tsx
│   ├── students/
│   │   ├── StudentCard.tsx
│   │   ├── StudentForm.tsx
│   │   └── StudentSearch.tsx
│   ├── marks/
│   │   ├── AssessmentForm.tsx
│   │   ├── MarksGrid.tsx
│   │   └── GradeBadge.tsx
│   └── feedback/
│       ├── FeedbackCard.tsx
│       └── FeedbackPanel.tsx
├── lib/
│   ├── db/
│   │   ├── client.ts              # sql.js setup
│   │   ├── schema.ts              # Drizzle schema
│   │   └── migrations/
│   ├── store/
│   │   ├── useClassStore.ts
│   │   ├── useStudentStore.ts
│   │   ├── useAssessmentStore.ts
│   │   └── useAppStore.ts
│   ├── hooks/
│   │   ├── useOnline.ts
│   │   └── useClasses.ts
│   └── utils/
│       ├── gradeCalculator.ts
│       └── feedbackTemplates.ts
├── services/
│   ├── classService.ts
│   ├── subjectService.ts
│   ├── studentService.ts
│   ├── assessmentService.ts
│   ├── marksService.ts
│   └── feedbackService.ts
├── types/
│   └── index.ts
└── tests/
    ├── unit/
    └── e2e/
```

---

## Risk Mitigations

| Risk | Mitigation in Plan |
|------|-------------------|
| sql.js bundle size | Wave 1: Lazy load after shell |
| Marks entry slow | Wave 4: Keyboard nav, auto-save |
| Offline confusion | Wave 6: Clear indicator |
| Generic feedback | Wave 5: Multiple templates |

---

## Exit Criteria Checklist

- [ ] Can create class with IGCSE subjects
- [ ] Can add students with search
- [ ] Can enter marks with keyboard navigation
- [ ] Grades calculate per IGCSE scale
- [ ] Can generate/copy feedback
- [ ] Works offline for all CRUD
- [ ] Installable as PWA
- [ ] Load time < 3 seconds
- [ ] All E2E tests pass

---

*Plan v001 — Ready for review*
