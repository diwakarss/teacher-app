# Phase 1 Plan — Teacher Assistant PWA MVP
## Version: v001 | Status: Draft

---

## Inputs

- Source artifacts: `inputs/`
  - `PRD.md` — Product Requirements Document (user stories CM-1..4, SM-1..5, ME-1..5, FG-1..5, PW-1..4)
  - `ARCHITECTURE.md` — Layered architecture (UI → State → Services → Data → Storage)
  - `RESEARCH.md` — Tech decisions, constraints, risks, confidence assessment
  - `RESEARCH-BRIEF.md` — Scope definition, success criteria, open decisions
  - `RESEARCH-CHECK.md` — PASS verdict, all artifacts present
- Previous canonical plan: none (greenfield)
- Decisions: IGCSE curriculum, single-teacher, no auth, local-first

## Planning Goals

- Define implementation-ready atomic tasks with explicit file paths
- Organize into dependency-ordered waves for parallel execution
- Specify verification strategy, quality gates, and rollback per wave
- Map every P0 user story to implementation tasks

---

## Traceability Matrix

| Requirement | User Stories | Wave | Tasks |
|-------------|-------------|------|-------|
| PWA Scaffold | PW-1, PW-2, PW-3, PW-4 | 1 | T1.1–T1.7 |
| Database Setup | All (persistence) | 1 | T1.8–T1.9 |
| Class Management | CM-1, CM-2, CM-3 | 2 | T2.1–T2.6 |
| Student Management | SM-1, SM-2, SM-3 | 3 | T3.1–T3.5 |
| Marks Entry | ME-1, ME-2, ME-3, ME-4 | 4 | T4.1–T4.6 |
| Feedback Generation | FG-1, FG-2, FG-3 | 5 | T5.1–T5.5 |
| Polish & PWA Audit | All NFRs | 6 | T6.1–T6.6 |

---

## Wave 1: PWA Scaffold + Database Foundation

**Goal**: Bootable Next.js PWA with SQLite database, base layout, and offline shell.
**Duration**: Days 1–2
**Dependencies**: None (greenfield)

### T1.1 — Initialize Next.js 14 Project

**Action**: Scaffold Next.js 14 with App Router, TypeScript, Tailwind CSS, ESLint.

```
Files created:
  frontend/package.json
  frontend/tsconfig.json
  frontend/tailwind.config.ts
  frontend/postcss.config.js
  frontend/next.config.mjs
  frontend/src/app/layout.tsx
  frontend/src/app/page.tsx
  frontend/src/app/globals.css
  frontend/.eslintrc.json
  frontend/.prettierrc
```

**Steps**:
1. `pnpm create next-app frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
2. Add Prettier config
3. Verify `pnpm dev` runs at `localhost:3000`

**Acceptance**: Dev server starts, page renders, TypeScript compiles clean.

---

### T1.2 — Install Core Dependencies

**Action**: Add all Phase 1 runtime and dev dependencies.

```
File modified:
  frontend/package.json
```

**Runtime deps**:
- `sql.js` — SQLite WASM
- `drizzle-orm` — Type-safe ORM
- `zustand` — State management
- `lucide-react` — Icons
- `@anthropic-ai/sdk` — Claude API (online only)
- `uuid` — UUID generation

**Dev deps**:
- `drizzle-kit` — Schema migrations
- `vitest` — Unit testing
- `@testing-library/react` — Component testing
- `@vitejs/plugin-react` — Vitest React support
- `jsdom` — Test DOM environment
- `playwright` — E2E testing
- `@playwright/test` — E2E runner

**Steps**:
1. `cd frontend && pnpm add sql.js drizzle-orm zustand lucide-react @anthropic-ai/sdk uuid`
2. `pnpm add -D drizzle-kit vitest @testing-library/react @vitejs/plugin-react jsdom playwright @playwright/test`
3. Verify `pnpm install` succeeds with no peer dep errors

**Acceptance**: All deps install, `pnpm ls` shows correct versions.

---

### T1.3 — Install and Configure shadcn/ui

**Action**: Initialize shadcn/ui with required components.

```
Files created:
  frontend/components.json
  frontend/src/components/ui/button.tsx
  frontend/src/components/ui/card.tsx
  frontend/src/components/ui/dialog.tsx
  frontend/src/components/ui/input.tsx
  frontend/src/components/ui/label.tsx
  frontend/src/components/ui/select.tsx
  frontend/src/components/ui/table.tsx
  frontend/src/components/ui/tabs.tsx
  frontend/src/components/ui/toast.tsx
  frontend/src/components/ui/badge.tsx
  frontend/src/components/ui/sheet.tsx
  frontend/src/components/ui/separator.tsx
  frontend/src/lib/utils.ts
```

**Steps**:
1. `pnpm dlx shadcn-ui@latest init` (select: New York style, Zinc base color, CSS variables)
2. Add components: `pnpm dlx shadcn-ui@latest add button card dialog input label select table tabs toast badge sheet separator`

**Acceptance**: Components import without errors in a test page.

---

### T1.4 — Configure PWA (Manifest + Service Worker)

**Action**: Set up next-pwa with Workbox for offline-first caching.

```
Files created/modified:
  frontend/next.config.mjs          (modified — add PWA config)
  frontend/public/manifest.json
  frontend/public/icons/icon-192.png
  frontend/public/icons/icon-512.png
  frontend/src/app/layout.tsx        (modified — add manifest link, theme-color meta)
```

**Steps**:
1. `pnpm add next-pwa`
2. Update `next.config.mjs` with PWA wrapper:
   - `dest: "public"`, `register: true`, `skipWaiting: true`
   - Disable in development: `disable: process.env.NODE_ENV === "development"`
3. Create `manifest.json`: name "Teacher Assistant", short_name "TeachAssist", start_url "/", display "standalone", background_color "#ffffff", theme_color "#0f172a", icons 192/512
4. Create placeholder app icons (192x192, 512x512 PNG)
5. Add `<link rel="manifest">` and `<meta name="theme-color">` to root layout

**Acceptance**: `pnpm build && pnpm start` generates service worker. Lighthouse PWA audit detects manifest.

---

### T1.5 — Create Base Layout and Navigation

**Action**: Build mobile-first shell with bottom navigation and header.

```
Files created:
  frontend/src/components/layout/app-shell.tsx
  frontend/src/components/layout/bottom-nav.tsx
  frontend/src/components/layout/header.tsx
  frontend/src/components/layout/offline-indicator.tsx
  frontend/src/app/(app)/layout.tsx
  frontend/src/app/(app)/page.tsx           (dashboard placeholder)
  frontend/src/app/(app)/classes/page.tsx
  frontend/src/app/(app)/students/page.tsx
  frontend/src/app/(app)/marks/page.tsx
  frontend/src/app/(app)/feedback/page.tsx
```

**Details**:
- `app-shell.tsx`: Wraps pages with header + bottom nav + offline indicator
- `bottom-nav.tsx`: 5 tabs (Dashboard, Classes, Students, Marks, Feedback) using Lucide icons, active state highlight, 48px touch targets
- `header.tsx`: App title + class switcher dropdown (placeholder)
- `offline-indicator.tsx`: Shows banner when `navigator.onLine === false`, listens to online/offline events (PW-3)
- Route group `(app)` shares the app shell layout

**Acceptance**: All 5 routes render with navigation. Switching tabs updates URL and active state. Offline indicator toggles in DevTools network throttle.

---

### T1.6 — Set Up sql.js + IndexedDB Persistence

**Action**: Initialize sql.js WASM database with IndexedDB auto-persist.

```
Files created:
  frontend/src/lib/db/database.ts       (singleton DB init, IndexedDB save/load)
  frontend/src/lib/db/persist.ts         (IndexedDB read/write helpers)
  frontend/public/sql-wasm.wasm          (copied from sql.js package)
```

**Details**:
- `database.ts`:
  - Lazy-load sql.js WASM binary
  - On init: check IndexedDB for existing DB file → load if exists, else create new
  - Export `getDb(): Promise<Database>` singleton
  - Auto-save: after every write operation, persist DB file to IndexedDB
- `persist.ts`:
  - `saveDatabase(data: Uint8Array): Promise<void>` — write to IndexedDB key `teacher_app_db`
  - `loadDatabase(): Promise<Uint8Array | null>` — read from IndexedDB
- Copy `sql-wasm.wasm` from `node_modules/sql.js/dist/` to `public/`

**Acceptance**: Create a test table, insert a row, reload page, data persists. Verify in DevTools → Application → IndexedDB.

---

### T1.7 — Define Drizzle ORM Schema + Migration

**Action**: Define all Phase 1 database tables using Drizzle ORM with sql.js dialect.

```
Files created:
  frontend/src/lib/db/schema.ts          (table definitions)
  frontend/src/lib/db/migrations.ts      (SQL migration runner)
  frontend/src/lib/db/drizzle.ts         (Drizzle instance connected to sql.js)
```

**Schema** (from PRD §3.2):

```typescript
// classes table
classes: {
  id: text("id").primaryKey(),           // UUID
  name: text("name").notNull(),
  academicYear: text("academic_year").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
}

// subjects table
subjects: {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  classId: text("class_id").notNull().references(() => classes.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
}

// students table
students: {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  rollNumber: text("roll_number").notNull(),
  classId: text("class_id").notNull().references(() => classes.id),
  parentName: text("parent_name"),
  parentPhone: text("parent_phone"),
  parentEmail: text("parent_email"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
}

// assessments table
assessments: {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),          // 'unit' | 'monthly' | 'term' | 'quiz'
  subjectId: text("subject_id").notNull().references(() => subjects.id),
  classId: text("class_id").notNull().references(() => classes.id),
  maxMarks: integer("max_marks").notNull(),
  date: text("date").notNull(),
  term: integer("term").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
}

// marks table
marks: {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => students.id),
  assessmentId: text("assessment_id").notNull().references(() => assessments.id),
  marksObtained: integer("marks_obtained").notNull(),
  remarks: text("remarks"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
}
```

- `migrations.ts`: Raw SQL `CREATE TABLE IF NOT EXISTS` statements executed on DB init.
- `drizzle.ts`: Create Drizzle instance wrapping sql.js Database.

**Acceptance**: All 5 tables created. Insert + select works for each table via Drizzle. Foreign keys enforce referential integrity.

---

### T1.8 — Create Zustand Stores (Skeleton)

**Action**: Set up Zustand stores for each domain entity.

```
Files created:
  frontend/src/stores/class-store.ts
  frontend/src/stores/student-store.ts
  frontend/src/stores/marks-store.ts
  frontend/src/stores/feedback-store.ts
  frontend/src/stores/app-store.ts        (global: active class, online status)
```

**Details**:
- Each store: `{ items: [], loading: boolean, error: string | null, load(), create(), update(), delete() }`
- `app-store.ts`: `{ activeClassId: string | null, isOnline: boolean, setActiveClass(), setOnline() }`
- All store actions delegate to service layer (created in Wave 2+)
- Skeleton only — actual service integration in their respective waves

**Acceptance**: Stores instantiate without error. Can set/get state in a test component.

---

### T1.9 — Configure Vitest + Testing Library

**Action**: Set up unit test infrastructure.

```
Files created:
  frontend/vitest.config.ts
  frontend/src/test/setup.ts
  frontend/src/test/test-utils.tsx       (render helper with providers)
```

**Steps**:
1. Create `vitest.config.ts` with React plugin, jsdom environment, setup file
2. Create test setup with Testing Library matchers
3. Create render utility wrapping components with necessary providers
4. Add `"test": "vitest"` and `"test:ci": "vitest run"` to `package.json` scripts

**Acceptance**: `pnpm test:ci` runs and passes (clean exit with 0 tests).

---

### Wave 1 Verification

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| Dev server boots | `pnpm dev` | No errors, page renders |
| TypeScript clean | `pnpm tsc --noEmit` | 0 errors |
| Build succeeds | `pnpm build` | Exit code 0 |
| PWA manifest | Lighthouse audit | Manifest detected |
| DB persistence | Manual: insert → reload → query | Data survives reload |
| Tests pass | `pnpm test:ci` | Exit code 0 |

### Wave 1 Rollback

- `git revert` the wave 1 commit(s) — no external state to clean up.
- If sql.js WASM fails to load: fallback to localStorage-based JSON persistence.

---

## Wave 2: Class & Subject Management

**Goal**: Full CRUD for classes and subjects with IGCSE subject templates.
**Duration**: Day 3
**Dependencies**: Wave 1 complete (DB, layout, stores)

### T2.1 — Class Service Layer

**Action**: Implement business logic for class CRUD operations.

```
Files created:
  frontend/src/services/class-service.ts
```

**API**:
- `createClass(name: string, academicYear: string): Promise<Class>`
- `getClasses(): Promise<Class[]>`
- `getClassById(id: string): Promise<Class | null>`
- `updateClass(id: string, data: Partial<Class>): Promise<Class>`
- `deleteClass(id: string): Promise<void>` — cascades to subjects, students, assessments, marks

**Details**:
- UUID generation via `crypto.randomUUID()` (fallback to `uuid` package)
- Timestamps: ISO 8601 strings
- Cascade delete: delete marks → assessments → students → subjects → class
- After every write: persist DB to IndexedDB

**Acceptance**: Unit tests for create, read, update, delete. Cascade delete verified.

---

### T2.2 — Subject Service Layer

**Action**: Implement subject CRUD with IGCSE template subjects.

```
Files created:
  frontend/src/services/subject-service.ts
  frontend/src/lib/constants/igcse-subjects.ts
```

**API**:
- `createSubject(name: string, classId: string): Promise<Subject>`
- `getSubjectsByClassId(classId: string): Promise<Subject[]>`
- `deleteSubject(id: string): Promise<void>`
- `addIgcseSubjects(classId: string, subjectNames: string[]): Promise<Subject[]>`

**IGCSE Subject Templates** (`igcse-subjects.ts`):
```typescript
export const IGCSE_SUBJECTS = [
  "English Language", "English Literature",
  "Mathematics", "Additional Mathematics",
  "Physics", "Chemistry", "Biology",
  "Computer Science", "Economics",
  "Business Studies", "Accounting",
  "History", "Geography",
  "Art & Design", "Music",
  "Physical Education",
  "Environmental Management",
  "Global Perspectives"
] as const;
```

**Acceptance**: Can add subjects individually or bulk from IGCSE templates. Subjects correctly linked to class.

---

### T2.3 — Wire Class Store to Service

**Action**: Connect `class-store.ts` actions to `class-service.ts`.

```
Files modified:
  frontend/src/stores/class-store.ts
```

**Details**:
- `loadClasses()` → calls `getClasses()`, sets `items`
- `createClass()` → calls service, appends to `items`
- `updateClass()` → calls service, updates in `items`
- `deleteClass()` → calls service, removes from `items`
- Error handling: catch service errors, set `error` state
- On create/delete: auto-refresh subject list

**Acceptance**: Store reflects DB state. Errors surface in store.

---

### T2.4 — Class List Page

**Action**: Build the classes listing page with create/edit/delete.

```
Files modified:
  frontend/src/app/(app)/classes/page.tsx

Files created:
  frontend/src/components/classes/class-card.tsx
  frontend/src/components/classes/class-form-dialog.tsx
```

**Details**:
- `page.tsx`: Grid of `ClassCard` components, floating "+" button to add class
- `class-card.tsx`: Shows class name, academic year, student count, subject count. Tap → navigate to class detail. Menu → edit/delete.
- `class-form-dialog.tsx`: Dialog with fields: name (text), academic year (text, e.g. "2025-2026"). Used for both create and edit. IGCSE subject multi-select checkboxes.
- Delete confirmation dialog before cascade delete
- Empty state: illustration + "Create your first class" CTA (CM-1)

**Acceptance**: Can create class with subjects, see it in list, edit name/year, delete with confirmation. Empty state shows when no classes.

---

### T2.5 — Class Detail Page

**Action**: Class detail view showing subjects and student summary.

```
Files created:
  frontend/src/app/(app)/classes/[classId]/page.tsx
  frontend/src/components/classes/subject-list.tsx
  frontend/src/components/classes/add-subject-dialog.tsx
```

**Details**:
- Shows class name, academic year, subject list, student count
- Add subject button → dialog with subject name input or pick from IGCSE list
- Subject cards show name. Tap → future link to marks for that subject.
- Link to students filtered by this class (CM-2, CM-3)

**Acceptance**: Navigate from class list → detail. See subjects. Add/remove subjects.

---

### T2.6 — Class Switcher in Header

**Action**: Dropdown in header to switch active class globally.

```
Files modified:
  frontend/src/components/layout/header.tsx
  frontend/src/stores/app-store.ts
```

**Details**:
- Select dropdown populated from `class-store` items
- On change: update `activeClassId` in `app-store`
- Active class persisted to localStorage for session continuity
- Other pages (students, marks, feedback) filter by active class (CM-3)

**Acceptance**: Switching class updates header. All pages respect active class filter.

---

### Wave 2 Tests

```
Files created:
  frontend/src/services/__tests__/class-service.test.ts
  frontend/src/services/__tests__/subject-service.test.ts
```

| Test | Assertion |
|------|-----------|
| Create class | Returns class with valid UUID, timestamps |
| List classes | Returns all created classes |
| Update class | Name/year updated, updatedAt changed |
| Delete class (cascade) | Class + subjects + students removed |
| Create subject | Linked to correct classId |
| IGCSE bulk add | All selected subjects created |
| Delete subject | Removed from DB |

### Wave 2 Verification

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| Service tests | `pnpm test:ci` | All pass |
| TypeScript | `pnpm tsc --noEmit` | 0 errors |
| UI renders | Manual | Class list/detail pages render |
| CRUD works | Manual | Create, edit, delete class with subjects |

### Wave 2 Rollback

- Revert wave 2 commits. Wave 1 remains functional with empty pages.

---

## Wave 3: Student Management

**Goal**: Student CRUD, search, and profile view.
**Duration**: Day 4
**Dependencies**: Wave 2 (class context required)

### T3.1 — Student Service Layer

**Action**: Implement student CRUD operations.

```
Files created:
  frontend/src/services/student-service.ts
```

**API**:
- `createStudent(data: { name, rollNumber, classId, parentName?, parentPhone?, parentEmail? }): Promise<Student>`
- `getStudentsByClassId(classId: string): Promise<Student[]>`
- `getStudentById(id: string): Promise<Student | null>`
- `updateStudent(id: string, data: Partial<Student>): Promise<Student>`
- `deleteStudent(id: string): Promise<void>` — also deletes associated marks
- `searchStudents(classId: string, query: string): Promise<Student[]>` — search by name or roll number (SM-2)

**Details**:
- Roll number uniqueness enforced per class
- Search: case-insensitive LIKE on name and roll_number columns

**Acceptance**: Unit tests for all CRUD + search. Roll number uniqueness enforced.

---

### T3.2 — Wire Student Store to Service

**Action**: Connect `student-store.ts` to `student-service.ts`.

```
Files modified:
  frontend/src/stores/student-store.ts
```

**Details**:
- Same pattern as class store
- `searchStudents(query)` action for live search
- Filter by `activeClassId` from app-store

**Acceptance**: Store state reflects DB. Search filters correctly.

---

### T3.3 — Students List Page

**Action**: Student roster with search and add functionality.

```
Files modified:
  frontend/src/app/(app)/students/page.tsx

Files created:
  frontend/src/components/students/student-card.tsx
  frontend/src/components/students/student-form-dialog.tsx
  frontend/src/components/students/student-search.tsx
```

**Details**:
- Filtered by active class (from app-store)
- `student-search.tsx`: Search input at top, debounced 300ms, searches name + roll number (SM-2)
- `student-card.tsx`: Name, roll number, parent name. Tap → student detail.
- `student-form-dialog.tsx`: Fields: name*, roll number*, parent name, parent phone, parent email. Validation: name required, roll number required + unique per class.
- Floating "+" to add student (SM-1)
- Empty state: "No students yet. Add your first student."

**Acceptance**: Search filters list in real-time. Can add student. Validation errors shown.

---

### T3.4 — Student Detail Page

**Action**: Full student profile with marks history placeholder.

```
Files created:
  frontend/src/app/(app)/students/[studentId]/page.tsx
  frontend/src/components/students/student-profile.tsx
  frontend/src/components/students/student-marks-summary.tsx
```

**Details**:
- Profile section: name, roll number, parent info, edit button (SM-3)
- Marks summary: table placeholder (populated in Wave 4)
- Edit → opens student-form-dialog in edit mode (SM-4)
- Delete button with confirmation dialog (SM-4)

**Acceptance**: Navigate from list → detail. Edit student info. Delete with confirmation removes student + marks.

---

### T3.5 — Integrate Students into Class Detail

**Action**: Show student count and list link on class detail page.

```
Files modified:
  frontend/src/app/(app)/classes/[classId]/page.tsx
```

**Details**:
- Show student count badge on class detail
- "View Students" link/button → navigates to students page with class filter

**Acceptance**: Class detail shows correct student count. Navigation works.

---

### Wave 3 Tests

```
Files created:
  frontend/src/services/__tests__/student-service.test.ts
```

| Test | Assertion |
|------|-----------|
| Create student | Valid UUID, linked to class |
| List by class | Only returns students for that class |
| Search by name | Case-insensitive match |
| Search by roll | Partial match works |
| Update student | Fields updated, timestamp changed |
| Delete student | Student + marks removed |
| Roll number unique | Error on duplicate within same class |

### Wave 3 Verification

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| Service tests | `pnpm test:ci` | All pass |
| TypeScript | `pnpm tsc --noEmit` | 0 errors |
| Search works | Manual | Search by name and roll number |
| CRUD works | Manual | Add/edit/delete student |

### Wave 3 Rollback

- Revert wave 3 commits. Classes/subjects remain functional.

---

## Wave 4: Marks Entry & Grade Calculation

**Goal**: Assessment creation, marks grid entry, auto-save, IGCSE grade calculation.
**Duration**: Days 5–6
**Dependencies**: Wave 2 (subjects), Wave 3 (students)

### T4.1 — Assessment Service Layer

**Action**: Implement assessment CRUD.

```
Files created:
  frontend/src/services/assessment-service.ts
```

**API**:
- `createAssessment(data: { name, type, subjectId, classId, maxMarks, date, term }): Promise<Assessment>`
- `getAssessmentsByClassId(classId: string): Promise<Assessment[]>`
- `getAssessmentsBySubjectId(subjectId: string): Promise<Assessment[]>`
- `deleteAssessment(id: string): Promise<void>` — cascades to marks

**Details**:
- `type` enum: `'unit' | 'monthly' | 'term' | 'quiz'` (ME-1)
- `term`: 1, 2, or 3
- `maxMarks`: positive integer

**Acceptance**: CRUD tests pass. Cascade delete removes associated marks.

---

### T4.2 — Marks Service Layer + Grade Calculator

**Action**: Implement marks CRUD with IGCSE grade calculation.

```
Files created:
  frontend/src/services/marks-service.ts
  frontend/src/lib/utils/grade-calculator.ts
```

**Grade Calculator** (`grade-calculator.ts`) — from PRD §3.3:

```typescript
export function calculateIgcseGrade(percentage: number): string {
  if (percentage >= 90) return "A*";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 40) return "E";
  if (percentage >= 30) return "F";
  if (percentage >= 20) return "G";
  return "U";
}

export function calculatePercentage(obtained: number, max: number): number {
  return Math.round((obtained / max) * 100);
}
```

**Marks Service API**:
- `setMark(studentId: string, assessmentId: string, marksObtained: number, remarks?: string): Promise<Mark>` — upsert
- `getMarksByAssessment(assessmentId: string): Promise<MarkWithStudent[]>`
- `getMarksByStudent(studentId: string): Promise<MarkWithAssessment[]>`
- `getClassStatistics(assessmentId: string): Promise<ClassStats>`

**ClassStats**:
```typescript
interface ClassStats {
  average: number;
  highest: number;
  lowest: number;
  totalStudents: number;
  gradeDistribution: Record<string, number>;
}
```

**Details**:
- `setMark`: Upsert — if mark exists for (studentId, assessmentId), update it (ME-3)
- Marks validation: 0 ≤ marksObtained ≤ assessment.maxMarks
- Grade calculated on read (derived, not stored) (ME-4)
- Class statistics: average, highest, lowest, grade distribution (ME-5)

**Acceptance**: Grade boundaries match IGCSE spec for all edge cases. Statistics compute correctly.

---

### T4.3 — Wire Marks Store to Service

**Action**: Connect `marks-store.ts` to services.

```
Files modified:
  frontend/src/stores/marks-store.ts
```

**Details**:
- `loadMarks(assessmentId)` — fetch marks for an assessment
- `setMark(studentId, assessmentId, value)` — upsert mark, debounce auto-save
- `loadStatistics(assessmentId)` — compute class stats
- Auto-save on field blur with 500ms debounce (ME-3)

**Acceptance**: Marks persist through auto-save. Debounce prevents excessive writes.

---

### T4.4 — Assessment Creation UI

**Action**: UI for creating new assessments.

```
Files created:
  frontend/src/components/marks/assessment-form-dialog.tsx
  frontend/src/components/marks/assessment-list.tsx
```

**Details**:
- `assessment-form-dialog.tsx`: Fields: name*, type* (select: unit/monthly/term/quiz), subject* (select from active class subjects), max marks* (number), date (date picker), term (1/2/3) (ME-1)
- `assessment-list.tsx`: List of assessments for active class, grouped by subject. Tap → marks entry grid.

**Acceptance**: Can create assessment. Appears in list under correct subject.

---

### T4.5 — Marks Entry Grid

**Action**: Grid view for entering marks for all students in an assessment.

```
Files modified:
  frontend/src/app/(app)/marks/page.tsx

Files created:
  frontend/src/components/marks/marks-grid.tsx
  frontend/src/components/marks/marks-row.tsx
  frontend/src/components/marks/class-stats-card.tsx
```

**Details**:
- `marks/page.tsx`: Assessment selector at top, marks grid below
- `marks-grid.tsx`: Table with columns: Roll No, Student Name, Marks (input), Grade (computed), Remarks (optional) (ME-2)
- `marks-row.tsx`: Single student row. Marks input: number, min=0, max=assessment.maxMarks. On blur: auto-save to DB via store (ME-3). Grade badge next to marks (ME-4).
- Keyboard navigation: Tab → next student's marks field, Enter → save and move down (ME-2)
- `class-stats-card.tsx`: Average, highest, lowest marks above grid (ME-5)

**UI Requirements**:
- 48px minimum touch targets for mobile
- `input type="number"` with `inputmode="numeric"` for mobile keyboard
- Visual feedback on save (brief green flash or checkmark)
- Validation: red border if marks > maxMarks

**Acceptance**: Enter marks for 30 students. Auto-saves on blur. Grades display correctly. Stats update live. Tab/Enter keyboard nav works.

---

### T4.6 — Student Detail Marks Integration

**Action**: Show marks history on student detail page.

```
Files modified:
  frontend/src/components/students/student-marks-summary.tsx
```

**Details**:
- Table: Assessment Name | Subject | Date | Marks | Grade
- Sorted by date descending
- Overall average and grade across all assessments

**Acceptance**: Student detail shows all their marks with correct grades.

---

### Wave 4 Tests

```
Files created:
  frontend/src/services/__tests__/assessment-service.test.ts
  frontend/src/services/__tests__/marks-service.test.ts
  frontend/src/lib/utils/__tests__/grade-calculator.test.ts
```

| Test | Assertion |
|------|-----------|
| Grade A* | 90% → "A*" |
| Grade A | 80%, 89% → "A" |
| Grade B | 70%, 79% → "B" |
| Grade C | 60%, 69% → "C" |
| Grade D | 50%, 59% → "D" |
| Grade E | 40%, 49% → "E" |
| Grade F | 30%, 39% → "F" |
| Grade G | 20%, 29% → "G" |
| Grade U | 0%, 19% → "U" |
| Boundary: 90 exact | "A*" |
| Boundary: 89 exact | "A" |
| Mark validation | Reject marks > maxMarks |
| Mark validation | Reject negative marks |
| Upsert mark | Update existing, not duplicate |
| Class stats | Correct average, min, max |
| Grade distribution | Correct count per grade |

### Wave 4 Verification

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| Grade tests | `pnpm test:ci` | All 15+ grade tests pass |
| TypeScript | `pnpm tsc --noEmit` | 0 errors |
| Marks entry | Manual | Enter marks for 10+ students |
| Auto-save | Manual | Marks persist after blur |
| Keyboard nav | Manual | Tab/Enter navigation works |
| Stats display | Manual | Average, high, low correct |

### Wave 4 Rollback

- Revert wave 4 commits. Classes and students remain intact.

---

## Wave 5: Feedback Generation

**Goal**: Template-based feedback messages with copy-to-clipboard.
**Duration**: Day 7
**Dependencies**: Wave 4 (marks data for feedback context)

### T5.1 — Feedback Templates

**Action**: Define feedback message templates for different performance levels and formats.

```
Files created:
  frontend/src/lib/constants/feedback-templates.ts
```

**Performance Levels**:
- `excellent`: A* or A (≥ 80%)
- `good`: B or C (60–79%)
- `average`: D or E (40–59%)
- `needsImprovement`: F or G (20–39%)
- `struggling`: U (< 20%)

**Templates** (SMS and WhatsApp formats per level):

SMS templates (< 160 chars):
- Excellent: `"Dear Parent, {studentName} scored {marks}/{maxMarks} ({grade}) in {subject}. Excellent work! Keep it up."`
- Struggling: `"Dear Parent, {studentName} scored {marks}/{maxMarks} ({grade}) in {subject}. Extra practice needed. Please discuss."`

WhatsApp templates (longer, with formatting):
- Include: greeting, marks, grade, class average comparison, specific advice, sign-off

Multiple variations per level for variety.

**Acceptance**: Templates render with all placeholders filled. SMS under 160 chars after substitution.

---

### T5.2 — Feedback Service Layer

**Action**: Implement feedback generation logic.

```
Files created:
  frontend/src/services/feedback-service.ts
```

**API**:
- `generateFeedback(studentId: string, assessmentId: string, format: "sms" | "whatsapp"): Promise<string>`
- `generateClassFeedback(assessmentId: string, format: "sms" | "whatsapp"): Promise<FeedbackResult[]>`

**Details**:
- Fetch student, marks, assessment, class stats
- Determine performance level from grade
- Select random template variation for the level + format
- Fill in placeholders: studentName, parentName, marks, maxMarks, percentage, grade, subject, classAverage, assessmentName
- Compare to class average for relative performance context (FG-1, FG-2)

**Acceptance**: Feedback generated correctly for each performance level. All placeholders filled.

---

### T5.3 — Claude API Route (Online Enhancement)

**Action**: Next.js API route for AI-enhanced feedback when online.

```
Files created:
  frontend/src/app/api/feedback/route.ts
  frontend/.env.local.example
```

**Details**:
- `POST /api/feedback` (from PRD §3.4)
- Request body: `{ studentName, marks, maxMarks, grade, percentage, classAverage, subject, assessmentName, format }`
- Uses `@anthropic-ai/sdk` to call Claude API
- System prompt: generate parent feedback in specified format
- API key from `ANTHROPIC_API_KEY` env var (server-side only, never exposed to client)
- `.env.local.example`: `ANTHROPIC_API_KEY=your_key_here`
- Error handling: if API fails or offline, service falls back to template (FG-5)

**Acceptance**: API route returns enhanced feedback when API key is set. Falls back to template when not set or when request fails.

---

### T5.4 — Wire Feedback Store to Service

**Action**: Connect `feedback-store.ts` to feedback service.

```
Files modified:
  frontend/src/stores/feedback-store.ts
```

**Details**:
- `generateFeedback(studentId, assessmentId, format)` — calls service, stores result
- `generateClassFeedback(assessmentId, format)` — bulk generation
- `generatedMessages: Map<string, string>` — cache generated messages
- Loading/error states per generation

**Acceptance**: Store tracks generated messages. Bulk generation works.

---

### T5.5 — Feedback Page UI

**Action**: Build feedback generation and display interface.

```
Files modified:
  frontend/src/app/(app)/feedback/page.tsx

Files created:
  frontend/src/components/feedback/feedback-panel.tsx
  frontend/src/components/feedback/feedback-card.tsx
  frontend/src/components/feedback/format-selector.tsx
```

**Details**:
- `feedback/page.tsx`: Assessment selector → student selector → generate button
- `format-selector.tsx`: Toggle between SMS and WhatsApp format (FG-2)
- `feedback-panel.tsx`: Shows generated message with:
  - Student name, marks, grade header
  - Message body (editable textarea)
  - Copy button → `navigator.clipboard.writeText()` (FG-3)
  - "Generate for All" button for bulk class feedback (FG-4)
- `feedback-card.tsx`: Compact card per student in bulk view: name, grade, message preview, copy button
- Visual indicator: online (AI-enhanced) vs offline (template-based)
- Toast notification on successful copy

**Acceptance**: Generate feedback for individual and bulk. Copy to clipboard works. Format toggle changes output.

---

### Wave 5 Tests

```
Files created:
  frontend/src/services/__tests__/feedback-service.test.ts
  frontend/src/lib/constants/__tests__/feedback-templates.test.ts
```

| Test | Assertion |
|------|-----------|
| SMS length | All SMS templates < 160 chars when filled |
| Placeholder fill | No `{placeholder}` remains in output |
| Performance level | Correct level for each grade |
| Bulk generation | Generates for all students in class |
| Fallback | Returns template when API unavailable |
| WhatsApp format | Includes formatting markers |

### Wave 5 Verification

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| Template tests | `pnpm test:ci` | All pass |
| TypeScript | `pnpm tsc --noEmit` | 0 errors |
| Generate feedback | Manual | SMS and WhatsApp formats work |
| Copy to clipboard | Manual | Paste verifies correct content |
| Bulk generation | Manual | All students get feedback |
| Offline fallback | Manual (disable network) | Template feedback works |

### Wave 5 Rollback

- Revert wave 5 commits. Marks/grades still functional.

---

## Wave 6: Polish, Testing & PWA Audit

**Goal**: End-to-end testing, performance optimization, PWA compliance, accessibility.
**Duration**: Days 8–9
**Dependencies**: Waves 1–5 complete

### T6.1 — Dashboard Page

**Action**: Build the dashboard with quick actions and summary stats.

```
Files modified:
  frontend/src/app/(app)/page.tsx

Files created:
  frontend/src/components/dashboard/stats-card.tsx
  frontend/src/components/dashboard/recent-activity.tsx
  frontend/src/components/dashboard/quick-actions.tsx
```

**Details**:
- Stats cards: Total classes, total students, recent assessments count
- Quick actions: Add Class, Add Student, Enter Marks, Generate Feedback
- Recent activity: Last 5 actions (class created, marks entered, etc.)
- Greeting based on time of day

**Acceptance**: Dashboard shows correct stats. Quick actions navigate to correct pages.

---

### T6.2 — E2E Tests with Playwright

**Action**: Write end-to-end tests covering critical user flows.

```
Files created:
  frontend/playwright.config.ts
  frontend/e2e/class-management.spec.ts
  frontend/e2e/student-management.spec.ts
  frontend/e2e/marks-entry.spec.ts
  frontend/e2e/feedback-generation.spec.ts
  frontend/e2e/offline.spec.ts
```

**Test Scenarios**:

1. **Class Management**: Create class with IGCSE subjects → verify in list → edit → delete with cascade
2. **Student Management**: Add student → search by name → search by roll → edit
3. **Marks Entry**: Create assessment → enter marks for 5 students → verify grades → verify stats
4. **Feedback Generation**: Generate SMS → verify length → generate WhatsApp → copy to clipboard
5. **Offline**: Go offline → create class → verify persists → offline indicator shows

**Acceptance**: All E2E tests pass. Critical flows covered.

---

### T6.3 — Performance Optimization

**Action**: Optimize for < 3 second load and < 100ms marks entry response.

```
Files modified:
  frontend/next.config.mjs
  frontend/src/lib/db/database.ts
```

**Optimizations**:
- Lazy-load sql.js WASM (code split, load after app shell renders)
- Preload sql-wasm.wasm with `<link rel="preload">`
- Configure service worker caching strategies (cache-first for static, network-first for API)
- Debounce marks entry saves (already in T4.3)
- Measure: Lighthouse performance score ≥ 90

**Acceptance**: Lighthouse performance ≥ 90. Initial load < 3s on throttled 3G.

---

### T6.4 — Accessibility Audit

**Action**: Ensure WCAG 2.1 AA compliance.

**Checks**:
- All interactive elements have `aria-label` or visible label
- Focus indicators visible on all focusable elements
- Color contrast ratios meet AA (4.5:1 text, 3:1 large text)
- Keyboard navigation: all features reachable without mouse
- `role` and `aria-live` for dynamic content (marks auto-save, offline indicator)

**Acceptance**: Lighthouse accessibility score ≥ 90. No critical violations.

---

### T6.5 — PWA Audit

**Action**: Pass all PWA installability criteria.

**Criteria** (Lighthouse PWA audit):
- Valid manifest with name, icons, start_url, display
- Service worker registered
- HTTPS (localhost OK for dev)
- Icons: 192x192 and 512x512
- Viewport meta tag
- Theme color

**Acceptance**: Lighthouse PWA audit: all criteria pass.

---

### T6.6 — Final Build Verification

**Action**: Complete build and test cycle.

```bash
pnpm tsc --noEmit          # TypeScript
pnpm test:ci                # Unit tests
pnpm exec playwright test   # E2E tests
pnpm build                  # Production build
```

**Acceptance**:
- TypeScript: 0 errors
- Unit tests: all pass
- E2E tests: all pass
- Build: succeeds, no warnings
- Lighthouse: Performance ≥ 90, Accessibility ≥ 90, PWA: all pass

---

### Wave 6 Rollback

- Revert wave 6 commits. Core functionality (waves 1–5) remains intact.

---

## Verification Plan

### Automated Tests

| Layer | Tool | Coverage Target |
|-------|------|----------------|
| Unit (services) | Vitest | All service methods |
| Unit (utils) | Vitest | Grade calculator 100% boundary coverage |
| Component | Testing Library | Key interactive components |
| E2E | Playwright | 5 critical user flows |

### Security Checks

- No student PII sent to external services (except optional Claude API, server-side only)
- API key stored server-side in env var, never exposed to client
- No XSS vectors in feedback template rendering (React built-in escaping)
- No SQL injection (Drizzle ORM parameterized queries)

### Manual Checks

- [ ] Install as PWA on mobile device
- [ ] Use app in airplane mode (offline)
- [ ] Enter marks for 30 students and time it (< 5 min target)
- [ ] Generate feedback and paste into WhatsApp
- [ ] Verify data persists after app restart

---

## Acceptance Criteria (Phase Exit)

From ROADMAP.md exit criteria:

- [AC-1] Can create class with subjects → Wave 2 (CM-1, CM-2)
- [AC-2] Can add students to class → Wave 3 (SM-1)
- [AC-3] Can enter marks for assessment → Wave 4 (ME-1, ME-2, ME-3)
- [AC-4] Can generate feedback for student → Wave 5 (FG-1, FG-2, FG-3)
- [AC-5] Works offline (read/write local data) → Wave 1 + verified Wave 6 (PW-2, PW-4)
- [AC-6] Installable as PWA → Wave 1 + verified Wave 6 (PW-1)

---

## File Inventory

### New Files (by wave)

**Wave 1** (~15 files + scaffold):
- `frontend/src/lib/db/database.ts`
- `frontend/src/lib/db/persist.ts`
- `frontend/src/lib/db/schema.ts`
- `frontend/src/lib/db/migrations.ts`
- `frontend/src/lib/db/drizzle.ts`
- `frontend/src/stores/class-store.ts`
- `frontend/src/stores/student-store.ts`
- `frontend/src/stores/marks-store.ts`
- `frontend/src/stores/feedback-store.ts`
- `frontend/src/stores/app-store.ts`
- `frontend/src/components/layout/app-shell.tsx`
- `frontend/src/components/layout/bottom-nav.tsx`
- `frontend/src/components/layout/header.tsx`
- `frontend/src/components/layout/offline-indicator.tsx`
- `frontend/public/manifest.json`

**Wave 2** (8 files):
- `frontend/src/services/class-service.ts`
- `frontend/src/services/subject-service.ts`
- `frontend/src/lib/constants/igcse-subjects.ts`
- `frontend/src/components/classes/class-card.tsx`
- `frontend/src/components/classes/class-form-dialog.tsx`
- `frontend/src/app/(app)/classes/[classId]/page.tsx`
- `frontend/src/components/classes/subject-list.tsx`
- `frontend/src/components/classes/add-subject-dialog.tsx`

**Wave 3** (6 files):
- `frontend/src/services/student-service.ts`
- `frontend/src/components/students/student-card.tsx`
- `frontend/src/components/students/student-form-dialog.tsx`
- `frontend/src/components/students/student-search.tsx`
- `frontend/src/app/(app)/students/[studentId]/page.tsx`
- `frontend/src/components/students/student-profile.tsx`

**Wave 4** (7 files):
- `frontend/src/services/assessment-service.ts`
- `frontend/src/services/marks-service.ts`
- `frontend/src/lib/utils/grade-calculator.ts`
- `frontend/src/components/marks/assessment-form-dialog.tsx`
- `frontend/src/components/marks/assessment-list.tsx`
- `frontend/src/components/marks/marks-grid.tsx`
- `frontend/src/components/marks/marks-row.tsx`

**Wave 5** (6 files):
- `frontend/src/lib/constants/feedback-templates.ts`
- `frontend/src/services/feedback-service.ts`
- `frontend/src/app/api/feedback/route.ts`
- `frontend/src/components/feedback/feedback-panel.tsx`
- `frontend/src/components/feedback/feedback-card.tsx`
- `frontend/src/components/feedback/format-selector.tsx`

**Wave 6** (8 files):
- `frontend/src/components/dashboard/stats-card.tsx`
- `frontend/src/components/dashboard/recent-activity.tsx`
- `frontend/src/components/dashboard/quick-actions.tsx`
- `frontend/e2e/class-management.spec.ts`
- `frontend/e2e/student-management.spec.ts`
- `frontend/e2e/marks-entry.spec.ts`
- `frontend/e2e/feedback-generation.spec.ts`
- `frontend/e2e/offline.spec.ts`

**Total**: ~50 new files + Next.js scaffold

---

## Review Resolution

- Track resolved findings from `reviews/round-*/`
- No review rounds completed yet (first draft)

## Status

- Draft owner: NalaN (planner agent)
- Ready for review: **yes**

---
*Generated: 2026-03-02 | Source: PRD v1.0, ARCHITECTURE v1.0, RESEARCH v1.0*
