# Codebase Concerns

**Analysis Date:** 2026-03-03

## Tech Debt

### Drizzle ORM Underutilized
- **Issue:** Drizzle ORM installed and schema defined, but all queries use raw SQL
- **Files:** `frontend/src/lib/db/drizzle.ts`, `frontend/src/services/*.ts`
- **Impact:** Duplicate type definitions, manual SQL string construction, no type-safe queries
- **Fix approach:** Either use Drizzle query builder consistently or remove it and keep only schema for types

### Redundant DB Initialization Calls
- **Issue:** Every store method calls `await initializeDb()` defensively
- **Files:** `frontend/src/stores/*.ts`
- **Impact:** Code duplication, unnecessary async overhead
- **Fix approach:** Initialize DB once at app startup, remove defensive calls in stores

### PDF Cache Not Always Cleared
- **Issue:** PDF cache may persist after upload dialog closes without completing
- **Files:** `frontend/src/lib/pdf-extractor.ts`, `frontend/src/components/content/upload-dialog.tsx`
- **Impact:** Memory not freed if user cancels mid-processing
- **Fix approach:** Add cleanup in dialog's onClose or useEffect cleanup

## Known Bugs

**None identified in code review.**

## Security Considerations

### Claude API Key Exposed in Browser
- **Risk:** API key stored in localStorage, visible in browser dev tools
- **Files:** `frontend/src/stores/feedback-store.ts`, `frontend/src/services/feedback-service.ts`
- **Current mitigation:** Users provide their own key, header indicates browser access
- **Recommendations:**
  - Document this is user's own key at their risk
  - Consider server-side proxy route (like generation)
  - Add warning in API key dialog about key visibility

### Student PII Stored Locally
- **Risk:** Student names, parent contact info in IndexedDB (browser-accessible)
- **Files:** `frontend/src/lib/db/persist.ts`, `frontend/src/lib/db/schema.ts`
- **Current mitigation:** Local-only storage, no cloud sync
- **Recommendations:**
  - Add data export/backup feature
  - Consider encryption at rest for IndexedDB
  - Add clear data option in settings

## Performance Bottlenecks

### Sequential Bulk Feedback Generation
- **Problem:** Generates feedback one student at a time with delay
- **Files:** `frontend/src/stores/feedback-store.ts`
- **Cause:** Rate limiting protection for Claude API
- **Improvement path:** Could batch requests or use parallel with rate limiter

### No Pagination for Large Classes
- **Problem:** All students loaded at once, could be slow for 100+ students
- **Files:** `frontend/src/services/student-service.ts`, `frontend/src/app/(app)/students/page.tsx`
- **Cause:** Simple implementation for MVP
- **Improvement path:** Add pagination or virtualization for large lists

### OCR Worker Not Pre-warmed
- **Problem:** First OCR operation is slow due to worker initialization
- **Files:** `frontend/src/lib/ocr-processor.ts`
- **Cause:** Lazy initialization for initial load performance
- **Improvement path:** Add `warmupOCR()` call on content page load

### Large PDF Processing Blocks UI
- **Problem:** Very large PDFs (50+ pages) may cause perceived UI freeze
- **Files:** `frontend/src/lib/pdf-extractor.ts`
- **Cause:** All processing in main thread (though async)
- **Improvement path:** Consider Web Worker for PDF processing

### Full DB Persistence on Every Write
- **Problem:** Entire database exported to IndexedDB on every write
- **Files:** `frontend/src/lib/db/database.ts`, `persist.ts`
- **Cause:** sql.js exports full database binary
- **Improvement path:** Debounce persistence, or use OPFS for incremental writes

## Fragile Areas

### Database Migration Approach
- **Files:** `frontend/src/lib/db/database.ts` lines 43-175
- **Why fragile:** All migrations in one `CREATE TABLE IF NOT EXISTS` block, no versioning
- **Safe modification:** Add new tables at end, never modify existing CREATE statements
- **Test coverage:** None

### Prepared Statement Memory Management
- **Files:** All files in `frontend/src/services/`
- **Why fragile:** Must manually call `stmt.free()` after every prepared statement
- **Safe modification:** Use try/finally pattern to ensure cleanup
- **Risk:** Memory leaks if free() not called

### Chapter Detection Regex
- **Files:** `frontend/src/lib/chapter-detector.ts`
- **Why fragile:** Regex patterns may not match all textbook formats
- **Safe modification:** Add new patterns to CHAPTER_PATTERNS array
- **Test coverage:** Good (20+ tests)

## Scaling Limits

### IndexedDB Storage
- **Current capacity:** Browser-dependent (typically 50MB-unlimited with permission)
- **Limit:** When storage fills, saves will fail silently or throw
- **Scaling path:** Add storage quota monitoring, offer data export

### In-Memory SQLite
- **Current capacity:** All data loaded into memory
- **Limit:** Browser memory limits (varies by device)
- **Scaling path:** Consider chunked loading for historical data, archive old assessments

### Chapter Content Size
- **Current capacity:** All chapter text stored in SQLite TEXT column
- **Limit:** Very large chapters (100+ pages) could slow queries
- **Scaling path:** Consider content chunking or summary storage

## Dependencies at Risk

### sql.js WASM CDN Dependency
- **Risk:** App requires CDN access to load SQLite WASM on first load
- **Impact:** First load fails if CDN unreachable
- **Migration plan:** Bundle WASM locally or use alternative CDN with fallback

### next-pwa Maintenance Status
- **Risk:** Package may have stale dependencies
- **Impact:** PWA features could break with Next.js updates
- **Migration plan:** Monitor for compatibility, consider `serwist` (active fork)

### PDF.js CDN Dependency
- **Risk:** Worker loaded from CDN on first PDF upload
- **Impact:** PDF processing fails if CDN unreachable
- **Migration plan:** Bundle worker locally or add offline fallback

### Tesseract.js Language Data CDN
- **Risk:** Language data loaded from CDN on first OCR
- **Impact:** OCR fails if CDN unreachable
- **Migration plan:** Pre-cache in service worker or bundle locally

## Missing Critical Features

### No Data Backup/Export
- **Problem:** If browser data cleared, all data is lost
- **Blocks:** Long-term use, device migration
- **Priority:** High for Phase 4

### No Error Recovery for DB Corruption
- **Problem:** If IndexedDB corrupted, no recovery path
- **Blocks:** Reliable long-term data storage
- **Priority:** Add validation and fallback to empty DB

### No Offline Indicator for CDN Resources
- **Problem:** Users don't know if PDF/OCR will work offline
- **Blocks:** Reliable offline content upload
- **Priority:** Add CDN resource status indicator

## Test Coverage Gaps

### Services Layer Untested
- **What's not tested:** All CRUD operations in 9 service files
- **Files:** `frontend/src/services/*.ts`
- **Risk:** Regressions in core data operations go unnoticed
- **Priority:** High - critical business logic

### Grade Calculation Untested
- **What's not tested:** `calculateIGCSEGrade()` function
- **Files:** `frontend/src/services/marks-service.ts`
- **Risk:** Grade boundary errors affect student reports
- **Priority:** High - most critical pure function

### Stores Untested
- **What's not tested:** All 8 Zustand stores
- **Files:** `frontend/src/stores/*.ts`
- **Risk:** State management bugs, async error handling
- **Priority:** Medium

### Components Untested
- **What's not tested:** All feature components, dialogs
- **Files:** `frontend/src/components/**/*.tsx`
- **Risk:** UI regressions, form validation bugs
- **Priority:** Medium

### API Route Untested
- **What's not tested:** Generation API route
- **Files:** `frontend/src/app/api/generate/route.ts`
- **Risk:** AI integration failures undetected
- **Priority:** Medium

## Phase 4 Blockers

### Document Formatter
- **Blocker:** No Word document library installed
- **Need:** `mammoth.js` for reading, `docx` for writing

### Analytics/Charts
- **Blocker:** No chart library installed
- **Need:** `recharts` or `chart.js` with React wrapper

### Cloud Sync
- **Blocker:** No OAuth or Google Drive SDK
- **Need:** Google Drive API, authentication flow

### Data Export
- **Partial:** Only print-to-PDF exists
- **Need:** JSON/CSV export, database backup utilities

---

*Concerns audit: 2026-03-03*
