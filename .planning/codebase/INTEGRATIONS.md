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

## Not Integrated (Out of Scope)

- School management systems
- Parent notification services (SMS/WhatsApp)
- Cloud storage/backup
- Authentication providers
- Analytics services
- Server-side API proxy for Claude

---

*Integration audit: 2026-03-02*
