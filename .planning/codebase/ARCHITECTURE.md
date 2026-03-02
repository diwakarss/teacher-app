# Architecture

**Analysis Date:** 2026-03-02

## Pattern Overview

**Overall:** Offline-first PWA with layered architecture

**Key Characteristics:**
- Local-first data with SQLite in browser (sql.js + IndexedDB)
- Client-side state management with Zustand
- Service layer for database operations
- Optional AI enhancement via Claude API
- Next.js App Router with route groups
- Content processing pipeline (PDF + OCR)

## Layers

### Presentation Layer
- **Purpose:** UI rendering and user interaction
- **Location:** `src/app/`, `src/components/`
- **Contains:** Pages (App Router), React components, UI primitives
- **Depends on:** Stores, services (indirectly)
- **Used by:** End users via browser

### State Layer (Zustand Stores)
- **Purpose:** Global client state, async operation management
- **Location:** `src/stores/`
- **Contains:** 7 stores (app, class, student, assessment, marks, feedback, content)
- **Depends on:** Services, database initialization
- **Used by:** Presentation layer via hooks

### Service Layer
- **Purpose:** Business logic and database operations
- **Location:** `src/services/`
- **Contains:** 7 services matching data entities
- **Depends on:** Database layer
- **Used by:** Stores

### Processing Layer (Phase 2)
- **Purpose:** Content extraction and transformation
- **Location:** `src/lib/`
- **Contains:** PDF extractor, OCR processor, chapter detector
- **Depends on:** pdfjs-dist, tesseract.js
- **Used by:** Upload dialog component

### Database Layer
- **Purpose:** SQLite operations and persistence
- **Location:** `src/lib/db/`
- **Contains:** `database.ts` (sql.js), `persist.ts` (IndexedDB), `schema.ts` (Drizzle types), `drizzle.ts` (unused ORM wrapper)
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

### Content Upload Flow (Phase 2)

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

### AI Feedback Generation (Online)

```
User clicks "Generate Feedback"
    |
feedbackStore.generateBulkFeedback()
    | checks useAI flag
feedbackService.generateFeedbackWithAI() OR generateFeedbackFromTemplate()
    | if AI
fetch() -> Claude API
    | if fails
fallback to template
    |
feedbackService.create() -> SQLite -> IndexedDB
    |
Store updates -> Component re-renders
```

### State Management Pattern

```typescript
// Pattern: Store wraps service, manages loading/error states
const useXxxStore = create<XxxState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  loadItems: async () => {
    set({ loading: true, error: null });
    try {
      await initializeDb();
      const items = await xxxService.getAll();
      set({ items, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

## Key Abstractions

### Database Singleton
- **Purpose:** Single sql.js instance throughout app lifecycle
- **Location:** `src/lib/db/database.ts`
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
- **Location:** `src/lib/db/schema.ts`
- **Pattern:** Drizzle schema exports inferred types

```typescript
export const students = sqliteTable('students', { ... });
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
```

### OCR Worker Singleton (Phase 2)
- **Purpose:** Reusable Tesseract worker
- **Location:** `src/lib/ocr-processor.ts`
- **Pattern:** Lazy initialization with warmup option

```typescript
let worker: Worker | null = null;

async function getWorker(onProgress?): Promise<Worker> {
  if (worker) return worker;
  worker = await createWorker('eng', Tesseract.OEM.LSTM_ONLY, { logger });
  return worker;
}
```

### PDF Cache (Phase 2)
- **Purpose:** Avoid re-loading PDF for OCR fallback
- **Location:** `src/lib/pdf-extractor.ts`
- **Pattern:** Module-level cache with cleanup

```typescript
let cachedPdf: PDFDocumentProxy | null = null;

export function clearPdfCache(): void {
  if (cachedPdf) {
    cachedPdf.destroy();
    cachedPdf = null;
  }
}
```

### Grade Calculation
- **Purpose:** IGCSE grade boundaries
- **Location:** `src/services/marks-service.ts`
- **Pattern:** Pure function, no network required

## Entry Points

### Root Layout
- **Location:** `src/app/layout.tsx`
- **Triggers:** Every page load
- **Responsibilities:** HTML structure, fonts, Toaster component

### App Layout
- **Location:** `src/app/(app)/layout.tsx`
- **Triggers:** All app routes within `(app)` group
- **Responsibilities:** Wraps with AppShell (header, nav, offline indicator)

### Database Initialization
- **Location:** `src/lib/db/database.ts` - `initializeDb()`
- **Triggers:** First database operation (via stores)
- **Responsibilities:** Load WASM, restore from IndexedDB, run migrations

## Error Handling

**Strategy:** Try-catch in stores with error state

**Patterns:**
- Stores set `error: string | null` state on failures
- Components can display `ErrorDisplay` component
- `ErrorBoundary` class component for uncaught errors
- Console logging for debugging

```typescript
// Store pattern
try {
  await someOperation();
} catch (error) {
  console.error('Failed to X:', error);
  set({ error: (error as Error).message, loading: false });
}
```

**OCR Error Handling (Phase 2):**
- Low confidence warning shown if OCR confidence < 70%
- User can edit extracted text before saving
- Toast notifications for processing failures

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
src/app/
├── layout.tsx              # Root layout (fonts, toaster)
├── globals.css             # Tailwind imports
└── (app)/                  # App route group
    ├── layout.tsx          # App shell wrapper
    ├── page.tsx            # Dashboard
    ├── classes/
    │   ├── page.tsx        # Class list
    │   └── [id]/page.tsx   # Class detail (subjects)
    ├── students/page.tsx   # Student list
    ├── marks/page.tsx      # Marks entry
    ├── feedback/page.tsx   # Feedback generation
    └── content/            # Phase 2
        ├── page.tsx        # Chapter list by subject
        └── [id]/page.tsx   # Chapter detail viewer
```

## Database Schema

```
classes (1) ─────── (*) subjects (1) ─────── (*) chapters
    │                       │
    │                       │
    └───── (*) students     └───── (*) assessments
              │                         │
              │                         │
              └─── (*) marks ───────────┘
                       │
                       │
                   (*) feedback
```

## IGCSE Grade Boundaries

Implemented in `src/services/marks-service.ts`:

| Grade | Percentage Range |
|-------|------------------|
| A* | 90-100 |
| A | 80-89 |
| B | 70-79 |
| C | 60-69 |
| D | 50-59 |
| E | 40-49 |
| F | 30-39 |
| G | 20-29 |
| U | 0-19 |

---

*Architecture analysis: 2026-03-02*
