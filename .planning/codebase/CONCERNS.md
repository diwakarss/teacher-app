# Codebase Concerns

**Analysis Date:** 2026-03-02

## Tech Debt

### Drizzle ORM Underutilized
- **Issue:** Drizzle ORM installed and schema defined, but all queries use raw SQL
- **Files:** `src/lib/db/drizzle.ts`, `src/services/*.ts`
- **Impact:** Duplicate type definitions, manual SQL string construction, no type-safe queries
- **Fix approach:** Either use Drizzle query builder consistently or remove it and keep only schema for types

### Redundant DB Initialization Calls
- **Issue:** Every store method calls `await initializeDb()` defensively
- **Files:** `src/stores/student-store.ts`, `src/stores/marks-store.ts`, `src/stores/feedback-store.ts`, `src/stores/content-store.ts`
- **Impact:** Unnecessary async overhead (though singleton protects against actual re-init)
- **Fix approach:** Initialize DB once at app startup (in Header already does this), remove defensive calls in stores

### Installed But Unused SDK
- **Issue:** `@anthropic-ai/sdk` is installed but code uses direct `fetch()` instead
- **Files:** `package.json`, `src/services/feedback-service.ts`
- **Impact:** Unnecessary dependency (adds to bundle/install time)
- **Fix approach:** Either use the SDK or remove the dependency

### PDF Cache Not Always Cleared
- **Issue:** PDF cache may persist after upload dialog closes without completing
- **Files:** `src/lib/pdf-extractor.ts`, `src/components/content/upload-dialog.tsx`
- **Impact:** Memory not freed if user cancels mid-processing
- **Fix approach:** Add cleanup in dialog's onClose or useEffect cleanup

## Known Bugs

**None identified in code review.**

## Security Considerations

### Claude API Key Exposed in Browser
- **Risk:** API key stored in localStorage, visible in browser dev tools
- **Files:** `src/stores/feedback-store.ts`, `src/services/feedback-service.ts`
- **Current mitigation:** Users provide their own key, header indicates browser access
- **Recommendations:**
  - Document this is user's own key at their risk
  - Consider server-side proxy route for production use
  - Add warning in API key dialog about key visibility

### Student PII Stored Locally
- **Risk:** Student names, parent contact info in IndexedDB (browser-accessible)
- **Files:** `src/lib/db/persist.ts`, `src/lib/db/schema.ts`
- **Current mitigation:** Local-only storage, no cloud sync
- **Recommendations:**
  - Add data export/backup feature
  - Consider encryption at rest for IndexedDB
  - Add clear data option in settings

## Performance Bottlenecks

### Sequential Bulk Feedback Generation
- **Problem:** Generates feedback one student at a time with 200ms delay
- **Files:** `src/stores/feedback-store.ts` line 107-119
- **Cause:** Rate limiting protection for Claude API
- **Improvement path:** Could batch requests or use parallel with rate limiter

### No Pagination for Large Classes
- **Problem:** All students loaded at once, could be slow for 100+ students
- **Files:** `src/services/student-service.ts`, `src/app/(app)/students/page.tsx`
- **Cause:** Simple implementation for MVP
- **Improvement path:** Add pagination or virtualization for large lists

### OCR Worker Not Pre-warmed
- **Problem:** First OCR operation is slow due to worker initialization
- **Files:** `src/lib/ocr-processor.ts`
- **Cause:** Lazy initialization for initial load performance
- **Improvement path:** Add `warmupOCR()` call on content page load

### Large PDF Processing Blocks UI
- **Problem:** Very large PDFs (50+ pages) may cause perceived UI freeze
- **Files:** `src/lib/pdf-extractor.ts`
- **Cause:** All processing in main thread (though async)
- **Improvement path:** Consider Web Worker for PDF processing

## Fragile Areas

### Database Migration Approach
- **Files:** `src/lib/db/database.ts` lines 43-140
- **Why fragile:** All migrations in one `CREATE TABLE IF NOT EXISTS` block
- **Safe modification:** Add new tables at end, never modify existing CREATE statements
- **Test coverage:** None

### Prepared Statement Memory Management
- **Files:** All files in `src/services/`
- **Why fragile:** Must manually call `stmt.free()` after every prepared statement
- **Safe modification:** Use try/finally pattern to ensure cleanup
- **Risk:** Memory leaks if free() not called

### Chapter Detection Regex
- **Files:** `src/lib/chapter-detector.ts`
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
- **Risk:** App requires CDN access to load SQLite WASM
- **Impact:** First load fails if CDN unreachable
- **Migration plan:** Bundle WASM locally or use alternative CDN with fallback

### next-pwa Maintenance Status
- **Risk:** Package may have stale dependencies
- **Impact:** PWA features could break with Next.js updates
- **Migration plan:** Monitor for Next.js 16 compatibility, consider alternatives like `@ducanh2912/next-pwa`

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
- **Priority:** Should be added soon

### No User Authentication
- **Problem:** Any device user can access all data
- **Blocks:** Multi-user scenarios, shared devices
- **Priority:** Out of scope for local-first design, document as limitation

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
- **What's not tested:** All CRUD operations in 7 service files
- **Files:** `src/services/*.ts`
- **Risk:** Regressions in core data operations go unnoticed
- **Priority:** High - critical business logic

### Grade Calculation Untested
- **What's not tested:** `calculateIGCSEGrade()` function
- **Files:** `src/services/marks-service.ts`
- **Risk:** Grade boundary errors affect student reports
- **Priority:** High - most critical pure function

### Stores Untested
- **What's not tested:** All 7 Zustand stores
- **Files:** `src/stores/*.ts`
- **Risk:** State management bugs, async error handling
- **Priority:** Medium

### Components Untested
- **What's not tested:** All feature components, dialogs
- **Files:** `src/components/**/*.tsx`
- **Risk:** UI regressions, form validation bugs
- **Priority:** Medium

### PDF/OCR Processing Untested
- **What's not tested:** `pdf-extractor.ts`, `ocr-processor.ts`
- **Files:** `src/lib/pdf-extractor.ts`, `src/lib/ocr-processor.ts`
- **Risk:** Processing failures in edge cases
- **Priority:** Low (hard to test, manual QA sufficient)

### E2E Not Implemented
- **What's not tested:** Full user workflows, offline behavior
- **Risk:** Integration issues between layers
- **Priority:** Low for MVP, higher for production

## Recommendations by Priority

### Immediate (Before More Features)
1. Add tests for `calculateIGCSEGrade()` and `calculatePerformanceLevel()`
2. Remove unused `@anthropic-ai/sdk` dependency
3. Add warning in API key dialog about browser storage
4. Ensure PDF cache cleanup on dialog close

### Short-Term (Next Development Cycle)
1. Add data export feature
2. Consolidate DB initialization
3. Add tests for services layer
4. Pre-warm OCR worker on content page

### Long-Term (Future Phases)
1. Evaluate server-side API proxy
2. Consider database migration tooling
3. Add monitoring for storage quota
4. Bundle CDN dependencies locally

---

*Concerns audit: 2026-03-02*
