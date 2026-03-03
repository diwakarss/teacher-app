# Phase 4 Research: Polish & Sync

## Context

- **Project Mode**: existing
- **Work Mode**: feature
- **Phase Scope**: Document Formatter, Analytics Dashboard, Data Export/Import, Google Drive Sync

## Existing State

### Current Architecture
- Next.js 16 App Router with PWA configuration
- sql.js + IndexedDB for offline-first persistence
- Zustand stores with service layer pattern
- 58 unit tests passing (Vitest + Testing Library)

### Existing Services
| Service | Tables | Operations |
|---------|--------|------------|
| class-service | classes, subjects | CRUD |
| student-service | students | CRUD, search |
| marks-service | assessments, marks | CRUD, grade calculation |
| chapter-service | chapters | CRUD, content storage |
| lesson-plan-service | lesson_plans | CRUD, AI generation |
| question-paper-service | question_papers | CRUD, AI generation |

### Existing UI Routes
- `/` - Home dashboard
- `/classes` - Class management
- `/students` - Student management
- `/marks` - Marks entry
- `/generate` - AI generation hub
- `/content` - Content upload

## Existing Debt

No architecture violations detected. Minor concerns:
- sql.js row mapping has repetitive boilerplate (not blocking)
- Some components could benefit from better loading states (cosmetic)

## Proposed Approach

### Wave 1: Document Formatter (P0 - Critical)

**Goal**: Upload Word docs, apply formatting rules, download formatted output.

**Library Decision**: mammoth.js
- Pros: Well-maintained, good .docx support, works in browser
- Cons: Limited formatting control on output
- Alternative: docx-parser (lower-level, more control but more work)

**Implementation**:
1. Create `/settings` page with Document Formatter tab
2. Upload .docx file, parse with mammoth.js
3. Display content preview with formatting options
4. Apply formatting rules (font, size, spacing, headers)
5. Generate new .docx with docx library for output
6. Save formatting presets to localStorage

**Files to create**:
- `frontend/src/app/(app)/settings/page.tsx`
- `frontend/src/components/settings/document-formatter.tsx`
- `frontend/src/lib/doc-formatter.ts`

### Wave 2: Analytics Dashboard (P1 - High)

**Goal**: Visualize student progress and assessment breakdown.

**Library Decision**: recharts
- Pros: React-native, composable, good documentation
- Cons: Bundle size (~150KB)
- Alternative: chart.js (smaller but less React-idiomatic)

**Implementation**:
1. Create analytics-service.ts for data aggregation
2. Add dashboard widgets to Home page
3. Charts: Student progress (line), Assessment breakdown (bar), Grade distribution (pie)
4. Filter by class, subject, time range

**Files to create**:
- `frontend/src/services/analytics-service.ts`
- `frontend/src/components/analytics/student-progress-chart.tsx`
- `frontend/src/components/analytics/assessment-breakdown-chart.tsx`
- `frontend/src/components/analytics/grade-distribution-chart.tsx`

### Wave 3: Data Export/Import (P2 - Medium)

**Goal**: Export all data to JSON, import from backup.

**Format Decision**: JSON with versioned schema
- Pros: Human-readable, easy to debug, compatible everywhere
- Cons: Larger than binary formats
- Alternative: SQLite dump (smaller but harder to inspect)

**Implementation**:
1. Create export-service.ts
2. Export all tables with relationships
3. Include schema version for migration support
4. Import with validation and conflict resolution
5. Add Export/Import UI in Settings page

**Files to create**:
- `frontend/src/services/export-service.ts`
- `frontend/src/components/settings/data-export.tsx`

### Wave 4: Google Drive Sync (P3 - Nice-to-have)

**Goal**: Backup data to Google Drive, restore from cloud.

**Implementation**:
1. Create drive-service.ts with OAuth2 flow
2. Upload backup JSON to user's Drive
3. List and restore from existing backups
4. Optional: Auto-sync on changes

**Files to create**:
- `frontend/src/services/drive-service.ts`
- `frontend/src/components/settings/cloud-sync.tsx`

**Note**: Requires Google Cloud project setup and OAuth credentials.

## Constraints

| Constraint | Type | Evidence | Impact if Violated |
|-----------|------|----------|-------------------|
| Offline-first | Hard | REQUIREMENTS.md, all existing features | App unusable without network |
| No server dependency | Hard | PWA architecture | Deployment complexity |
| Browser APIs only | Hard | PWA limitations | Feature restrictions |
| Google Drive needs OAuth | Hard | Google API requirements | Users must authenticate |

## Risks/Pitfalls

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| mammoth.js can't handle complex Word formatting | Medium | High | Test with real docs; fallback to basic extraction |
| Large data export hits memory limits | Low | Medium | Stream processing; chunk large datasets |
| Google OAuth complexity | Medium | Medium | Progressive enhancement; app works without |
| recharts bundle bloat | Low | Low | Tree-shake; lazy load analytics |

## Open Questions

1. ~~Cloud provider~~ → Decided: Google Drive
2. ~~Analytics priority~~ → Decided: Student progress + Assessment breakdown
3. ~~Feature priority~~ → Decided: Doc Formatter > Analytics > Export > Drive
4. What formatting presets should be default? (font sizes, spacing rules)
5. Should analytics persist computed results or recalculate on demand?

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Document Formatter | HIGH | mammoth.js is proven; clear requirements |
| Analytics | HIGH | recharts well-documented; data available |
| Data Export | HIGH | JSON export straightforward |
| Google Drive | MEDIUM | OAuth flow complexity; needs GCP setup |

## Grounding Ledger

| Claim | Source | Date Checked | Confidence |
|-------|--------|--------------|------------|
| mammoth.js supports .docx in browser | npm/mammoth docs | 2026-03-03 | HIGH |
| recharts works with Next.js | recharts docs | 2026-03-03 | HIGH |
| Google Drive API v3 supports file upload | Google API docs | 2026-03-03 | HIGH |
| sql.js supports full DB export | sql.js docs | 2026-03-03 | HIGH |
