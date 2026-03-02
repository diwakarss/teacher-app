# Codebase Structure

**Analysis Date:** 2026-03-02

## Directory Layout

```
frontend/
├── public/                     # Static assets
│   ├── manifest.json           # PWA manifest
│   └── icons/                  # PWA icons
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Tailwind CSS imports
│   │   └── (app)/              # App route group
│   │       ├── layout.tsx      # App shell layout
│   │       ├── page.tsx        # Dashboard
│   │       ├── classes/        # Class management
│   │       ├── students/       # Student management
│   │       ├── marks/          # Marks entry
│   │       └── feedback/       # Feedback generation
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── layout/             # App layout components
│   │   ├── classes/            # Class-related components
│   │   ├── students/           # Student-related components
│   │   ├── marks/              # Marks-related components
│   │   └── feedback/           # Feedback-related components
│   ├── services/               # Business logic / DB operations
│   ├── stores/                 # Zustand state stores
│   ├── lib/                    # Utilities and database
│   │   ├── db/                 # Database layer
│   │   └── utils.ts            # Utility functions (cn)
│   ├── test/                   # Test setup and utilities
│   └── types/                  # TypeScript type declarations
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── vitest.config.ts            # Vitest configuration
├── eslint.config.mjs           # ESLint configuration
├── postcss.config.mjs          # PostCSS configuration
└── package.json                # Dependencies and scripts
```

## Directory Purposes

### `src/app/` - Next.js App Router
- **Purpose:** Page routes and layouts
- **Contains:** `page.tsx`, `layout.tsx` files
- **Key files:**
  - `layout.tsx` - Root HTML, fonts, Toaster
  - `(app)/layout.tsx` - App shell (header, nav)
  - `(app)/page.tsx` - Dashboard
  - `(app)/*/page.tsx` - Feature pages

### `src/components/` - React Components
- **Purpose:** Reusable UI components
- **Contains:** Feature components and UI primitives
- **Subdirectories:**
  - `ui/` - shadcn/ui components (Button, Card, Dialog, etc.)
  - `layout/` - App shell components (Header, BottomNav, etc.)
  - `classes/` - ClassFormDialog, SubjectFormDialog
  - `students/` - StudentCard, StudentFormDialog
  - `marks/` - MarksEntryGrid, AssessmentFormDialog
  - `feedback/` - FeedbackCard, ApiKeyDialog

### `src/services/` - Service Layer
- **Purpose:** Database CRUD operations
- **Contains:** One service per entity
- **Key files:**
  - `class-service.ts` - Class CRUD
  - `subject-service.ts` - Subject CRUD
  - `student-service.ts` - Student CRUD + search
  - `assessment-service.ts` - Assessment CRUD
  - `marks-service.ts` - Marks CRUD + grade calculation
  - `feedback-service.ts` - Feedback CRUD + AI generation

### `src/stores/` - Zustand Stores
- **Purpose:** Global state management
- **Contains:** One store per entity + app store
- **Key files:**
  - `app-store.ts` - Active class, online status
  - `class-store.ts` - Classes state
  - `student-store.ts` - Students state
  - `assessment-store.ts` - Assessments state
  - `marks-store.ts` - Marks state + stats calculation
  - `feedback-store.ts` - Feedbacks state + generation logic

### `src/lib/db/` - Database Layer
- **Purpose:** SQLite and persistence
- **Key files:**
  - `database.ts` - sql.js initialization, migrations, persistence
  - `persist.ts` - IndexedDB save/load
  - `schema.ts` - Drizzle schema + type exports
  - `drizzle.ts` - Drizzle instance (largely unused)

### `src/test/` - Test Infrastructure
- **Purpose:** Test setup and utilities
- **Key files:**
  - `setup.ts` - Vitest setup (cleanup, mocks)
  - `test-utils.tsx` - Custom render with providers

### `src/types/` - Type Declarations
- **Purpose:** TypeScript ambient declarations
- **Key files:**
  - `next-pwa.d.ts` - next-pwa module types
  - `sql.js.d.ts` - sql.js module types

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` - Root layout
- `src/app/(app)/layout.tsx` - App shell wrapper
- `src/lib/db/database.ts` - Database initialization

**Configuration:**
- `next.config.ts` - Next.js + PWA config
- `tsconfig.json` - TypeScript config
- `vitest.config.ts` - Test config

**Core Logic:**
- `src/services/*.ts` - All business logic
- `src/stores/*.ts` - State management
- `src/lib/db/database.ts` - Database singleton

**Testing:**
- `src/test/setup.ts` - Test setup
- `src/lib/utils.test.ts` - Example unit test

## Naming Conventions

**Files:**
- Components: `kebab-case.tsx` (e.g., `class-form-dialog.tsx`)
- Services: `kebab-case.ts` (e.g., `class-service.ts`)
- Stores: `kebab-case.ts` (e.g., `class-store.ts`)
- Pages: `page.tsx` (Next.js convention)
- Tests: `*.test.ts` or `*.test.tsx`

**Exports:**
- Components: PascalCase (e.g., `ClassFormDialog`)
- Services: camelCase objects (e.g., `classService`)
- Stores: camelCase hooks (e.g., `useClassStore`)
- Types: PascalCase (e.g., `Class`, `Student`)

## Where to Add New Code

**New Feature Page:**
1. Create `src/app/(app)/{feature}/page.tsx`
2. Add store in `src/stores/{feature}-store.ts`
3. Add service in `src/services/{feature}-service.ts`
4. Add schema to `src/lib/db/schema.ts` + migration in `database.ts`

**New Component:**
- Feature-specific: `src/components/{feature}/{component-name}.tsx`
- Reusable UI: `src/components/ui/{component-name}.tsx`

**New Database Table:**
1. Add Drizzle schema in `src/lib/db/schema.ts`
2. Add CREATE TABLE in `runMigrations()` in `src/lib/db/database.ts`
3. Create service in `src/services/`
4. Create store in `src/stores/`

**Utilities:**
- General helpers: `src/lib/utils.ts`
- Domain-specific: In relevant service file

**Tests:**
- Unit tests: Co-located as `*.test.ts` next to source
- E2E tests: `tests/e2e/` (not yet created)

## Special Directories

**`public/`:**
- Purpose: Static assets served at root
- Generated: PWA service worker files (by next-pwa)
- Committed: `manifest.json`, `icons/`

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (on build/dev)
- Committed: No (in .gitignore)

**`node_modules/`:**
- Purpose: Dependencies
- Generated: Yes (on pnpm install)
- Committed: No

---

*Structure analysis: 2026-03-02*
