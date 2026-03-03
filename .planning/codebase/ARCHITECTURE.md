# Architecture

**Analysis Date:** 2026-03-03

## Pattern Overview

**Overall:** Offline-first PWA with layered architecture

**Key Characteristics:**
- Local-first data with SQLite in browser (sql.js + IndexedDB)
- Client-side state management with Zustand
- Service layer for database operations
- Server-side AI generation via Next.js API routes
- Next.js App Router with route groups
- Content processing pipeline (PDF + OCR)

## Layers

### Presentation Layer
- **Purpose:** UI rendering and user interaction
- **Location:** `frontend/src/app/`, `frontend/src/components/`
- **Contains:** Pages (App Router), React components, UI primitives
- **Depends on:** Stores, hooks
- **Used by:** End users via browser

### State Layer (Zustand Stores)
- **Purpose:** Global client state, async operation management
- **Location:** `frontend/src/stores/`
- **Contains:** 8 stores (app, class, student, assessment, marks, feedback, content, generation)
- **Depends on:** Services, database initialization
- **Used by:** Presentation layer via hooks

### Service Layer
- **Purpose:** Business logic and database operations
- **Location:** `frontend/src/services/`
- **Contains:** 9 services matching data entities
- **Depends on:** Database layer
- **Used by:** Stores

### API Layer
- **Purpose:** Server-side operations (AI generation)
- **Location:** `frontend/src/app/api/`
- **Contains:** `generate/route.ts` for Claude/Bedrock calls
- **Depends on:** AWS SDK, prompt builders
- **Used by:** Generation store

### Processing Layer
- **Purpose:** Content extraction and transformation
- **Location:** `frontend/src/lib/`
- **Contains:** PDF extractor, OCR processor, chapter detector, PDF export
- **Depends on:** pdfjs-dist, tesseract.js
- **Used by:** Upload dialog, generation previews

### Database Layer
- **Purpose:** SQLite operations and persistence
- **Location:** `frontend/src/lib/db/`
- **Contains:** `database.ts` (sql.js), `persist.ts` (IndexedDB), `schema.ts` (Drizzle types)
- **Depends on:** sql.js, IndexedDB
- **Used by:** Services

## Data Flow

### CRUD Operations (Offline-capable)

```
User Action
    |
React Component (page.tsx)
    |
Zustand Store (useXxxStore)
    | calls
Service (xxxService)
    | executes SQL via
sql.js Database (getDb())
    | persists to
IndexedDB (persistDb())
    | returns to
Store (updates state)
    | re-renders
Component (React reactivity)
```

### AI Generation Flow (Online)

```
User configures generation form
    |
GenerationStore.generateXxx()
    | POST to
/api/generate route.ts
    | calls
AWS Bedrock (Claude 3.5 Haiku)
    | returns JSON
Store saves pending result
    | user reviews
savePendingXxx()
    | calls
xxxService.saveGenerated()
    | persists to
SQLite -> IndexedDB
```

### Content Upload Flow

```
User selects file (PDF or image)
    |
UploadDialog component
    | if PDF
extractTextFromPDF() -> pdfjs-dist
    | checks for text layer
    | if no text layer
renderPdfPagesToImages() -> canvas rendering
    |
extractTextFromImages() -> tesseract.js OCR
    | returns
{ text, confidence }
    |
suggestChapterName() -> chapter-detector
    | auto-fills form
User confirms/edits
    |
contentStore.createChapter()
    |
chapterService.create() -> SQLite
    |
persistDb() -> IndexedDB
```

## Key Abstractions

### Database Singleton
- **Purpose:** Single sql.js instance throughout app lifecycle
- **Location:** `frontend/src/lib/db/database.ts`
- **Pattern:** Promise-based lazy initialization

```typescript
let dbInstance: Database | null = null;
let dbPromise: Promise<Database> | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (dbPromise) return dbPromise;
  dbPromise = initDatabase();
  dbInstance = await dbPromise;
  return dbInstance;
}
```

### Entity Types (Drizzle Schema)
- **Purpose:** Type-safe entity definitions
- **Location:** `frontend/src/lib/db/schema.ts`
- **Pattern:** Drizzle schema exports inferred types

```typescript
export const students = sqliteTable('students', { ... });
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
```

### Prompt Builders
- **Purpose:** Construct AI prompts for generation
- **Location:** `frontend/src/lib/prompts/`
- **Pattern:** Pure functions returning formatted prompts

```typescript
export function buildLessonPlanPrompt(params: LessonPlanParams): string
export function buildQuestionPaperPrompt(params: QuestionPaperParams): string
```

## Entry Points

### Root Layout
- **Location:** `frontend/src/app/layout.tsx`
- **Triggers:** Every page load
- **Responsibilities:** HTML structure, fonts, metadata, Toaster component

### App Layout
- **Location:** `frontend/src/app/(app)/layout.tsx`
- **Triggers:** All app routes within `(app)` group
- **Responsibilities:** Wraps with AppShell (header, nav, offline indicator)

### API Route (Generate)
- **Location:** `frontend/src/app/api/generate/route.ts`
- **Triggers:** POST from generation stores
- **Responsibilities:** Claude/Bedrock API calls, response parsing

### Database Initialization
- **Location:** `frontend/src/lib/db/database.ts` - `initializeDb()`
- **Triggers:** First database operation (via stores)
- **Responsibilities:** Load WASM, restore from IndexedDB, run migrations

## Error Handling

**Strategy:** Try-catch in stores with error state

**Patterns:**
- Stores set `error: string | null` state on failures
- Toast notifications for user feedback
- Console logging for debugging
- API routes return `{ success: false, error: string }`

```typescript
// Store pattern
try {
  await someOperation();
  toast.success('Operation completed');
} catch (error) {
  console.error('Failed to X:', error);
  set({ error: (error as Error).message, loading: false });
}
```

## Cross-Cutting Concerns

**Logging:** Console only (`console.error`, `console.warn`)

**Validation:** Basic client-side in forms, SQL constraints in database

**Authentication:** None - fully client-side app

**Offline Support:**
- sql.js + IndexedDB for data persistence
- Service worker via next-pwa (disabled in dev)
- `OfflineIndicator` component shows online/offline status
- AI features fallback to templates when offline
- Content processing works offline (after CDN resources cached)

## Route Structure

```
frontend/src/app/
├── layout.tsx              # Root layout (fonts, toaster)
├── globals.css             # Tailwind imports
├── api/
│   └── generate/route.ts   # AI generation endpoint
└── (app)/                  # App route group
    ├── layout.tsx          # App shell wrapper
    ├── page.tsx            # Dashboard
    ├── classes/
    │   ├── page.tsx        # Class list
    │   └── [id]/page.tsx   # Class detail (subjects)
    ├── students/page.tsx   # Student list
    ├── marks/page.tsx      # Marks entry
    ├── feedback/page.tsx   # Feedback generation
    ├── content/
    │   ├── page.tsx        # Chapter list by subject
    │   └── [id]/page.tsx   # Chapter detail viewer
    └── generate/
        ├── page.tsx        # Generation hub
        ├── lesson-plan/
        │   ├── page.tsx    # New lesson plan
        │   └── [id]/page.tsx
        └── question-paper/
            ├── page.tsx    # New question paper
            └── [id]/page.tsx
```

## Database Schema

```
classes (1) ─────── (*) subjects (1) ─────── (*) chapters
    │                       │                       │
    │                       │                       └──── (*) lesson_plans
    │                       │
    └───── (*) students     └───── (*) assessments
              │                         │
              │                         │
              └─── (*) marks ───────────┘
                       │
                       │
                   (*) feedback

subjects (1) ─────── (*) question_papers
```

---

*Architecture analysis: 2026-03-03*
