# External Integrations

**Analysis Date:** 2026-03-03

## APIs & External Services

### AWS Bedrock (Server-side AI Generation)

**Purpose:** Generate lesson plans and question papers

**Implementation:** `frontend/src/app/api/generate/route.ts`

**Integration Details:**
- Uses `@aws-sdk/client-bedrock-runtime` SDK
- Model: Claude 3.5 Haiku (`us.anthropic.claude-3-5-haiku-20241022-v1:0`)
- Max tokens: 4096, Temperature: 0.7
- Inference via `ConverseCommand`

**Authentication:**
- API key: `AWS_BEARER_TOKEN_BEDROCK` (preferred)
- OR IAM: `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`
- Region: `AWS_REGION` (defaults to us-east-1)
- Stored in `frontend/.env.local` (gitignored)

### Claude API (Client-side Feedback)

**Purpose:** Generate personalized parent feedback messages

**Implementation:** `frontend/src/services/feedback-service.ts`

**Integration Details:**
- Uses direct `fetch()` to `https://api.anthropic.com/v1/messages`
- Model: `claude-3-haiku-20240307`
- Max tokens: 256
- Header: `anthropic-dangerous-direct-browser-access: true`

**Authentication:**
- User-provided API key stored in localStorage
- Key stored via Zustand persist in `teacher-app-feedback` localStorage key

**Fallback:** Template-based generation when API fails or no key

### CDN Resources

**sql.js WASM Binary:**
- URL: `https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/sql-wasm.wasm`
- Location: `frontend/src/lib/db/database.ts`

**PDF.js Worker:**
- URL: `https://cdn.jsdelivr.net/npm/pdfjs-dist@{version}/build/pdf.worker.min.mjs`
- Location: `frontend/src/lib/pdf-extractor.ts`

**Tesseract.js Language Data:**
- Loaded automatically by Tesseract.js from default CDN
- Location: `frontend/src/lib/ocr-processor.ts`

## Data Storage

### SQLite via sql.js

**Type:** In-memory SQLite database in WebAssembly

**Connection Pattern:** Singleton with lazy initialization

**Client:** Raw SQL via `db.prepare()`, `db.exec()`, `db.run()`

**Schema Location:** `frontend/src/lib/db/schema.ts`

**Tables:**
- `classes` - Class information
- `subjects` - Subjects per class
- `students` - Student records with parent info
- `assessments` - Assessment definitions
- `marks` - Student marks
- `feedback` - Generated feedback messages
- `chapters` - Content with extracted text
- `lesson_plans` - Generated lesson plans
- `question_papers` - Generated question papers

### IndexedDB Persistence

**Database Name:** `teacher_assistant_db`
**Object Store:** `database`
**Key:** `sqlite_db`

**Implementation:** `frontend/src/lib/db/persist.ts`

**Purpose:** Persist SQLite database binary for offline data retention

### LocalStorage (Zustand Persist)

**Keys:**
- `teacher-app-state`: Active class ID
- `teacher-app-feedback`: Claude API key, AI toggle setting

## Browser APIs

| API | Purpose | Location |
|-----|---------|----------|
| IndexedDB | SQLite persistence | `frontend/src/lib/db/persist.ts` |
| navigator.onLine | Offline detection | `frontend/src/hooks/use-online-status.ts` |
| Clipboard API | Copy feedback | `frontend/src/app/(app)/feedback/page.tsx` |
| File API | Upload PDFs/images | `frontend/src/components/content/upload-dialog.tsx` |
| Canvas API | Render PDF pages | `frontend/src/lib/pdf-extractor.ts` |
| FileReader API | Image to data URL | `frontend/src/lib/ocr-processor.ts` |
| Print API | PDF export | `frontend/src/lib/pdf-export.ts` |

## Content Processing Pipeline

### PDF Processing

**Implementation:** `frontend/src/lib/pdf-extractor.ts`

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

### OCR Processing

**Implementation:** `frontend/src/lib/ocr-processor.ts`

**Technology:** Tesseract.js with LSTM OCR engine

**Key Functions:**
```typescript
export async function extractTextFromImage(source: File | Blob | string, onProgress?): Promise<OCRResult>
export async function extractTextFromImages(images: Array, onProgress?): Promise<OCRResult>
export async function terminateWorker(): Promise<void>
export async function warmupOCR(): Promise<void>
```

### Chapter Detection

**Implementation:** `frontend/src/lib/chapter-detector.ts`

**Patterns Detected:**
- `Chapter X: Title`
- `CHAPTER X`
- `Unit X: Title`
- `Lesson X: Title`
- `Module X: Title`
- `Topic X: Title`
- `X. Title` (numbered sections)

### PDF Export

**Implementation:** `frontend/src/lib/pdf-export.ts`

**Approach:** Browser print dialog with styled HTML

**Key Functions:**
```typescript
export function printContent(html: string, options: PrintOptions): void
export function formatLessonPlanForPrint(plan: LessonPlanOutput): string
export function formatQuestionPaperForPrint(paper: QuestionPaperOutput): string
export function exportLessonPlanPdf(plan: LessonPlanOutput): void
export function exportQuestionPaperPdf(paper: QuestionPaperOutput): void
```

## Authentication & Identity

**Auth Provider:** None implemented

**API Key Management:**
- AWS credentials: Server-side env vars
- Claude API key: User manually enters, stored in localStorage
- Security note: Client key visible in browser dev tools

## Monitoring & Observability

**Error Tracking:** None - `console.error()` only

**Logging:** Console in development, no production logging

**Analytics:** None

## CI/CD & Deployment

**Hosting:** Not configured (standard Next.js deployment)

**CI Pipeline:** None detected, test commands available

## Phase 4 Integration Requirements

### Document Formatter (Word .docx)
- **Status:** Not implemented
- **Need:** `mammoth.js` for reading .docx, `docx` library for writing
- **Purpose:** Upload Word docs, apply formatting rules

### Analytics (Charts)
- **Status:** Not implemented
- **Need:** `recharts` or `chart.js` with React wrapper
- **Purpose:** Student performance visualization

### Cloud Sync (Google Drive)
- **Status:** Not implemented
- **Need:** Google Drive API SDK, OAuth library
- **Purpose:** Backup and sync across devices

### Data Export/Import
- **Status:** Partial (print-to-PDF only)
- **Need:** JSON export, CSV export, backup/restore utilities
- **Purpose:** Data portability, backup

---

*Integration audit: 2026-03-03*
