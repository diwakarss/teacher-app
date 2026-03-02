# External Integrations

**Analysis Date:** 2026-03-02

## APIs & External Services

### Claude API (AI Feedback Generation)

**Purpose:** Generate personalized parent feedback messages for student assessments

**Implementation:** `src/services/feedback-service.ts`

**Integration Details:**
- Uses direct `fetch()` calls, NOT the installed `@anthropic-ai/sdk` package
- Endpoint: `https://api.anthropic.com/v1/messages`
- Model: `claude-3-haiku-20240307`
- Max tokens: 256

**Authentication:**
- User-provided API key stored in localStorage
- Key stored via Zustand persist in `teacher-app-feedback` localStorage key
- Header: `x-api-key: {userApiKey}`
- Required header: `anthropic-dangerous-direct-browser-access: true` (browser-side calls)

**Fallback:** Template-based generation when API fails or no key provided

**Code Pattern:**
```typescript
// src/services/feedback-service.ts
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  },
  body: JSON.stringify({
    model: 'claude-3-haiku-20240307',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  }),
});
```

### CDN - sql.js WASM Binary

**Purpose:** Load SQLite WebAssembly binary

**URL:** `https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/sql-wasm.wasm`

**Implementation:** `src/lib/db/database.ts`

```typescript
const SQL = await initSqlJs({
  locateFile: () => 'https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/sql-wasm.wasm',
});
```

### CDN - PDF.js Worker

**Purpose:** Load PDF.js web worker for multi-threaded PDF processing

**URL:** `https://cdn.jsdelivr.net/npm/pdfjs-dist@{version}/build/pdf.worker.min.mjs`

**Implementation:** `src/lib/pdf-extractor.ts`

```typescript
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
```

### CDN - Tesseract.js Language Data

**Purpose:** Load trained OCR language models

**URL:** Loaded automatically by Tesseract.js from default CDN

**Implementation:** `src/lib/ocr-processor.ts`

```typescript
const worker = await createWorker('eng', Tesseract.OEM.LSTM_ONLY, {
  logger: (m) => { /* progress callback */ },
});
```

## Data Storage

### SQLite via sql.js

**Type:** In-memory SQLite database in WebAssembly

**Connection Pattern:** Singleton with lazy initialization

**Client:** Raw SQL via `db.prepare()`, `db.exec()`, `db.run()`

**Schema Location:** `src/lib/db/schema.ts` (Drizzle definitions for types only)

**Tables:**
- `classes` - Class information (id, name, academic_year)
- `subjects` - Subjects per class (id, name, class_id)
- `students` - Student records (id, name, roll_number, class_id, parent info)
- `assessments` - Assessment definitions (id, name, type, max_marks, etc.)
- `marks` - Student marks (id, student_id, assessment_id, marks_obtained)
- `feedback` - Generated feedback messages
- `chapters` - Content chapters with OCR text (id, subject_id, name, content, source_type)

**Query Example:**
```typescript
const db = await getDb();
const stmt = db.prepare('SELECT * FROM students WHERE class_id = ?');
stmt.bind([classId]);
while (stmt.step()) {
  const row = stmt.get();
  // process row
}
stmt.free();
```

### IndexedDB Persistence

**Database Name:** `teacher_assistant_db`
**Object Store:** `database`
**Key:** `sqlite_db`

**Implementation:** `src/lib/db/persist.ts`

**Purpose:** Persist SQLite database binary for offline data retention

**Pattern:**
```typescript
export async function saveDatabase(data: Uint8Array): Promise<void>
export async function loadDatabase(): Promise<Uint8Array | null>
export async function clearDatabase(): Promise<void>
```

### LocalStorage (Zustand Persist)

**Keys:**
- `teacher-app-state`: Active class ID
- `teacher-app-feedback`: Claude API key, AI toggle setting

**Implementation:** Zustand `persist` middleware in stores

## Browser APIs

| API | Purpose | Location |
|-----|---------|----------|
| IndexedDB | SQLite persistence | `src/lib/db/persist.ts` |
| navigator.onLine | Offline detection | `src/components/layout/offline-indicator.tsx` |
| Clipboard API | Copy feedback to clipboard | `src/app/(app)/feedback/page.tsx` |
| File API | Upload PDFs and images | `src/components/content/upload-dialog.tsx` |
| Canvas API | Render PDF pages for OCR | `src/lib/pdf-extractor.ts` |
| FileReader API | Convert images to data URLs | `src/lib/ocr-processor.ts` |

## Content Processing Pipeline

### PDF Processing (Phase 2)

**Implementation:** `src/lib/pdf-extractor.ts`

**Flow:**
1. Load PDF via `pdfjs-dist`
2. Extract embedded text layer per page
3. If no text layer (scanned PDF), render to canvas
4. Pass canvas images to OCR pipeline

**Key Functions:**
```typescript
export async function extractTextFromPDF(file: File, onProgress?): Promise<PDFExtractionResult>
export async function renderPdfPagesToImages(file?: File, onProgress?): Promise<Blob[]>
export function hasTextLayer(result: PDFExtractionResult): boolean
export function clearPdfCache(): void
```

### OCR Processing (Phase 2)

**Implementation:** `src/lib/ocr-processor.ts`

**Technology:** Tesseract.js with LSTM OCR engine

**Flow:**
1. Initialize worker (singleton, reused)
2. Process images sequentially
3. Return combined text with confidence score

**Key Functions:**
```typescript
export async function extractTextFromImage(source: File | Blob | string, onProgress?): Promise<OCRResult>
export async function extractTextFromImages(images: Array, onProgress?): Promise<OCRResult>
export async function terminateWorker(): Promise<void>
export async function warmupOCR(): Promise<void>
```

### Chapter Detection (Phase 2)

**Implementation:** `src/lib/chapter-detector.ts`

**Purpose:** Auto-detect chapter headings from extracted text

**Patterns Detected:**
- `Chapter X: Title`
- `CHAPTER X`
- `Unit X: Title`
- `Lesson X: Title`
- `Module X: Title`
- `Topic X: Title`
- `X. Title` (numbered sections)

**Key Functions:**
```typescript
export function detectChapters(text: string): DetectedChapter[]
export function detectChapterFromFilename(filename: string): { name, chapterNumber } | null
export function suggestChapterName(text: string, filename: string, defaultNumber: number): { name, chapterNumber }
```

## Authentication & Identity

**Auth Provider:** None implemented

**API Key Management:**
- User manually enters Claude API key via dialog
- Key stored client-side in localStorage
- No server-side proxying - direct browser-to-API calls
- Security note: API key visible in browser dev tools

## Monitoring & Observability

**Error Tracking:** None - `console.error()` only

**Logging Approach:**
- `console.error()` for operation failures in stores/services
- `console.warn()` for AI fallback to templates
- No structured logging

## CI/CD & Deployment

**Hosting:** Not configured (likely Vercel given Next.js)

**CI Pipeline:** None detected

## Environment Configuration

**Required env vars:** None - fully client-side

**Secrets Location:**
- Claude API key: localStorage (`teacher-app-feedback`)
- Warning: Key exposed in browser, users provide own key

## Integration Patterns Used

### Database Initialization Pattern
Used in all stores before database operations:

```typescript
// Every store method follows this pattern
async someMethod() {
  await initializeDb();  // Ensures DB and migrations are ready
  const db = await getDb();
  // ... perform operations
  await persistDb();  // Save to IndexedDB
}
```

### Service Layer Pattern
Services provide raw SQL operations, stores provide state management:

```typescript
// Service (src/services/class-service.ts)
export const classService = {
  async getAll(): Promise<Class[]>,
  async getById(id: string): Promise<Class | null>,
  async create(data): Promise<Class>,
  async update(id, data): Promise<Class>,
  async delete(id: string): Promise<void>,
};

// Store (src/stores/class-store.ts)
export const useClassStore = create<ClassState>((set, get) => ({
  classes: [],
  loading: false,
  error: null,
  loadClasses: async () => { /* calls classService */ },
  createClass: async () => { /* calls classService, updates state */ },
}));
```

### Processing Progress Pattern (Phase 2)
Used for long-running operations like PDF/OCR processing:

```typescript
interface ProgressCallback {
  currentPage: number;
  totalPages: number;
  percentage: number;
  phase?: 'extracting' | 'rendering';
}

// Usage
await extractTextFromPDF(file, (progress) => {
  setProgressText(`Processing page ${progress.currentPage} of ${progress.totalPages}...`);
  setProgress(progress.percentage);
});
```

## Not Integrated (Out of Scope)

- School management systems
- Parent notification services (SMS/WhatsApp)
- Cloud storage/backup
- Authentication providers
- Analytics services
- Server-side API proxy for Claude

---

*Integration audit: 2026-03-02*
