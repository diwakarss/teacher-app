# Codebase Structure

**Analysis Date:** 2026-03-03

## Directory Layout

```
teacher-app/
├── .planning/                  # Planning documents
│   └── codebase/               # These analysis docs
├── frontend/                   # Next.js application
│   ├── public/                 # Static assets, PWA manifest
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   │   ├── api/            # Server-side API routes
│   │   │   └── (app)/          # Client-side app routes
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities and core logic
│   │   │   ├── db/             # Database layer
│   │   │   └── prompts/        # AI prompt builders
│   │   ├── services/           # Data access layer
│   │   ├── stores/             # Zustand state stores
│   │   ├── test/               # Test setup and utilities
│   │   └── types/              # TypeScript declarations
│   ├── next.config.ts          # Next.js configuration
│   ├── vitest.config.ts        # Test configuration
│   ├── .prettierrc             # Code formatting
│   └── package.json            # Dependencies
├── CLAUDE.md                   # Project instructions
└── REQUIREMENTS.md             # Feature requirements
```

## Directory Purposes

### `frontend/src/app/` - Next.js App Router
- **Purpose:** Page routes, layouts, and API handlers
- **Contains:** `page.tsx`, `layout.tsx`, `route.ts` files
- **Key files:**
  - `layout.tsx` - Root HTML, fonts, Toaster
  - `api/generate/route.ts` - AI generation endpoint
  - `(app)/layout.tsx` - App shell (header, nav)
  - `(app)/page.tsx` - Dashboard
  - `(app)/*/page.tsx` - Feature pages

### `frontend/src/components/` - React Components
- **Purpose:** Reusable UI components
- **Subdirectories:**
  - `ui/` - shadcn/ui primitives (Button, Card, Dialog, etc.)
  - `layout/` - App shell components (Header, BottomNav, OfflineIndicator)
  - `classes/` - ClassFormDialog, SubjectFormDialog
  - `students/` - StudentCard, StudentFormDialog
  - `marks/` - MarksEntryGrid, AssessmentFormDialog
  - `feedback/` - FeedbackCard, ApiKeyDialog
  - `content/` - UploadDialog, ChapterCard, ContentViewer, ProcessingProgress
  - `generation/` - LessonPlanForm, QuestionPaperForm, previews

### `frontend/src/services/` - Service Layer
- **Purpose:** Database CRUD operations
- **Pattern:** One service per entity
- **Key files:**
  - `class-service.ts`, `subject-service.ts`
  - `student-service.ts`, `assessment-service.ts`
  - `marks-service.ts` - Includes IGCSE grade calculation
  - `feedback-service.ts` - Includes AI generation
  - `chapter-service.ts`
  - `lesson-plan-service.ts`, `question-paper-service.ts`

### `frontend/src/stores/` - Zustand Stores
- **Purpose:** Global state management
- **Pattern:** One store per domain
- **Key files:**
  - `app-store.ts` - Active class, online status
  - `class-store.ts` - Classes with subjects
  - `student-store.ts` - Students per class
  - `assessment-store.ts`, `marks-store.ts`
  - `feedback-store.ts` - Feedback + API key storage
  - `content-store.ts` - Chapters + processing progress
  - `generation-store.ts` - Lesson plans + question papers

### `frontend/src/lib/db/` - Database Layer
- **Purpose:** SQLite and persistence
- **Key files:**
  - `database.ts` - sql.js init, migrations, persistence
  - `persist.ts` - IndexedDB save/load
  - `schema.ts` - Drizzle schema + type exports
  - `drizzle.ts` - Drizzle instance (largely unused)

### `frontend/src/lib/` - Processing Utilities
- **Purpose:** Content extraction, prompts, exports
- **Key files:**
  - `utils.ts` - `cn()` class name merger
  - `pdf-extractor.ts` - PDF text extraction, page rendering
  - `ocr-processor.ts` - Tesseract.js OCR wrapper
  - `chapter-detector.ts` - Chapter heading detection
  - `pdf-export.ts` - Print-to-PDF utilities

### `frontend/src/lib/prompts/` - AI Prompt Builders
- **Purpose:** Construct prompts for Claude/Bedrock
- **Key files:**
  - `lesson-plan-prompt.ts` - Lesson plan prompt builder
  - `question-paper-prompt.ts` - Question paper prompt builder

### `frontend/src/hooks/` - Custom Hooks
- **Purpose:** Reusable React hooks
- **Key files:**
  - `use-online-status.ts` - Track online/offline status

### `frontend/src/test/` - Test Infrastructure
- **Purpose:** Test setup and utilities
- **Key files:**
  - `setup.ts` - Vitest setup (cleanup, mocks)
  - `test-utils.tsx` - Custom render with providers

## Key File Locations

**Entry Points:**
- `frontend/src/app/layout.tsx` - Root layout
- `frontend/src/app/(app)/layout.tsx` - App shell wrapper
- `frontend/src/lib/db/database.ts` - Database initialization
- `frontend/src/app/api/generate/route.ts` - AI generation API

**Configuration:**
- `frontend/next.config.ts` - Next.js + PWA config
- `frontend/tsconfig.json` - TypeScript config
- `frontend/vitest.config.ts` - Test config
- `frontend/.prettierrc` - Code formatting
- `frontend/.env.local` - Server credentials (gitignored)

**Core Logic:**
- `frontend/src/services/*.ts` - All business logic
- `frontend/src/stores/*.ts` - State management
- `frontend/src/lib/db/database.ts` - Database singleton

**Content Processing:**
- `frontend/src/lib/pdf-extractor.ts` - PDF handling
- `frontend/src/lib/ocr-processor.ts` - OCR handling
- `frontend/src/lib/chapter-detector.ts` - Text analysis
- `frontend/src/lib/pdf-export.ts` - Export to print

**Testing:**
- `frontend/src/test/setup.ts` - Test setup
- `frontend/src/lib/*.test.ts` - Unit tests

## Naming Conventions

**Files:**
- Components: `kebab-case.tsx` (e.g., `class-form-dialog.tsx`)
- Services: `{entity}-service.ts` (e.g., `class-service.ts`)
- Stores: `{entity}-store.ts` (e.g., `class-store.ts`)
- Pages: `page.tsx` (Next.js convention)
- Tests: `*.test.ts` or `*.test.tsx` (co-located)

**Exports:**
- Components: PascalCase (e.g., `ClassFormDialog`)
- Services: camelCase objects (e.g., `classService`)
- Stores: camelCase hooks (e.g., `useClassStore`)
- Types: PascalCase (e.g., `Class`, `Student`)

## Where to Add New Code

**New Feature Page:**
1. Create `frontend/src/app/(app)/{feature}/page.tsx`
2. Add store in `frontend/src/stores/{feature}-store.ts`
3. Add service in `frontend/src/services/{feature}-service.ts`
4. Add schema to `frontend/src/lib/db/schema.ts`
5. Add migration to `runMigrations()` in `database.ts`

**New Component:**
- Feature-specific: `frontend/src/components/{feature}/{component-name}.tsx`
- Reusable UI: `frontend/src/components/ui/{component-name}.tsx`

**New Database Table:**
1. Add Drizzle schema in `frontend/src/lib/db/schema.ts`
2. Add CREATE TABLE in `runMigrations()` in `database.ts`
3. Create service in `frontend/src/services/`
4. Create store in `frontend/src/stores/`

**New API Route:**
- Location: `frontend/src/app/api/{route}/route.ts`
- Export POST/GET/etc handler functions

**New Processing Utility:**
- Add to `frontend/src/lib/{utility-name}.ts`
- Add tests as `frontend/src/lib/{utility-name}.test.ts`

**Utilities:**
- General helpers: `frontend/src/lib/utils.ts`
- Domain-specific: Create new file in `frontend/src/lib/`

## Special Directories

**`frontend/public/`:**
- Purpose: Static assets served at root
- Contains: PWA manifest, icons, service worker
- Generated: `sw.js` by next-pwa (in prod)
- Committed: Yes (except generated files)

**`frontend/.next/`:**
- Purpose: Next.js build output
- Generated: Yes (on build/dev)
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-03-03*
