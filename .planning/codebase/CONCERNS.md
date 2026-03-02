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
- **Files:** `src/stores/student-store.ts`, `src/stores/marks-store.ts`, `src/stores/feedback-store.ts`
- **Impact:** Unnecessary async overhead (though singleton protects against actual re-init)
- **Fix approach:** Initialize DB once at app startup (in Header already does this), remove defensive calls in stores

### Installed But Unused SDK
- **Issue:** `@anthropic-ai/sdk` is installed but code uses direct `fetch()` instead
- **Files:** `package.json`, `src/services/feedback-service.ts`
- **Impact:** Unnecessary dependency (adds to bundle/install time)
- **Fix approach:** Either use the SDK or remove the dependency

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

## Fragile Areas

### Database Migration Approach
- **Files:** `src/lib/db/database.ts` lines 43-125
- **Why fragile:** All migrations in one `CREATE TABLE IF NOT EXISTS` block
- **Safe modification:** Add new tables at end, never modify existing CREATE statements
- **Test coverage:** None

### Prepared Statement Memory Management
- **Files:** All files in `src/services/`
- **Why fragile:** Must manually call `stmt.free()` after every prepared statement
- **Safe modification:** Use try/finally pattern to ensure cleanup
- **Risk:** Memory leaks if free() not called

## Scaling Limits

### IndexedDB Storage
- **Current capacity:** Browser-dependent (typically 50MB-unlimited with permission)
- **Limit:** When storage fills, saves will fail silently or throw
- **Scaling path:** Add storage quota monitoring, offer data export

### In-Memory SQLite
- **Current capacity:** All data loaded into memory
- **Limit:** Browser memory limits (varies by device)
- **Scaling path:** Consider chunked loading for historical data, archive old assessments

## Dependencies at Risk

### sql.js WASM CDN Dependency
- **Risk:** App requires CDN access to load SQLite WASM
- **Impact:** First load fails if CDN unreachable
- **Migration plan:** Bundle WASM locally or use alternative CDN with fallback

### next-pwa Maintenance Status
- **Risk:** Package may have stale dependencies
- **Impact:** PWA features could break with Next.js updates
- **Migration plan:** Monitor for Next.js 16 compatibility, consider alternatives like `@ducanh2912/next-pwa`

## Missing Critical Features

### No Data Backup/Export
- **Problem:** If browser data cleared, all data is lost
- **Blocks:** Long-term use, device migration
- **Priority:** Should be Phase 2

### No User Authentication
- **Problem:** Any device user can access all data
- **Blocks:** Multi-user scenarios, shared devices
- **Priority:** Out of scope for local-first design, document as limitation

### No Error Recovery for DB Corruption
- **Problem:** If IndexedDB corrupted, no recovery path
- **Blocks:** Reliable long-term data storage
- **Priority:** Add validation and fallback to empty DB

## Test Coverage Gaps

### Services Layer Untested
- **What's not tested:** All CRUD operations in 6 service files
- **Files:** `src/services/*.ts`
- **Risk:** Regressions in core data operations go unnoticed
- **Priority:** High - critical business logic

### Grade Calculation Untested
- **What's not tested:** `calculateIGCSEGrade()` function
- **Files:** `src/services/marks-service.ts`
- **Risk:** Grade boundary errors affect student reports
- **Priority:** High - most critical pure function

### Stores Untested
- **What's not tested:** All 6 Zustand stores
- **Files:** `src/stores/*.ts`
- **Risk:** State management bugs, async error handling
- **Priority:** Medium

### Components Untested
- **What's not tested:** All feature components, dialogs
- **Files:** `src/components/**/*.tsx`
- **Risk:** UI regressions, form validation bugs
- **Priority:** Medium

### E2E Not Implemented
- **What's not tested:** Full user workflows, offline behavior
- **Risk:** Integration issues between layers
- **Priority:** Low for MVP, higher for production

## Recommendations by Priority

### Immediate (Before More Features)
1. Add tests for `calculateIGCSEGrade()` and `calculatePerformanceLevel()`
2. Remove unused `@anthropic-ai/sdk` dependency
3. Add warning in API key dialog about browser storage

### Short-Term (Next Development Cycle)
1. Add data export feature
2. Consolidate DB initialization
3. Add tests for services layer

### Long-Term (Future Phases)
1. Evaluate server-side API proxy
2. Consider database migration tooling
3. Add monitoring for storage quota

---

*Concerns audit: 2026-03-02*
