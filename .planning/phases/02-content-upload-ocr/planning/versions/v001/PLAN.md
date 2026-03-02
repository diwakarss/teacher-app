# Phase 2 Implementation Plan — Content Upload & OCR

## Overview

| Attribute | Value |
|-----------|-------|
| Phase | 02-content-upload-ocr |
| Version | v001 |
| Status | Draft |
| Estimated Waves | 5 |

## Wave Structure

### Wave 1: Database & Service Layer
**Goal:** Add chapters table and CRUD service

| Task | File | Description |
|------|------|-------------|
| T1.1 | `src/lib/db/schema.ts` | Add `chapters` table schema |
| T1.2 | `src/lib/db/database.ts` | Add migration for chapters table |
| T1.3 | `src/services/chapter-service.ts` | Create chapter CRUD operations |
| T1.4 | `src/stores/content-store.ts` | Create Zustand store for chapters |

**Verification:**
- [ ] TypeScript compiles without errors
- [ ] Migration creates table successfully
- [ ] Service tests pass (manual or unit)

### Wave 2: PDF.js Integration
**Goal:** Extract text from uploaded PDFs

| Task | File | Description |
|------|------|-------------|
| T2.1 | `package.json` | Add `pdfjs-dist` dependency |
| T2.2 | `src/lib/pdf-extractor.ts` | PDF.js wrapper for text extraction |
| T2.3 | `src/lib/chapter-detector.ts` | Regex-based chapter boundary detection |
| T2.4 | `next.config.ts` | Configure PDF.js worker (if needed) |

**Verification:**
- [ ] Can extract text from sample Lens-scanned PDF
- [ ] Chapter detection identifies "Chapter X" patterns
- [ ] Build succeeds

### Wave 3: Upload UI
**Goal:** File upload dialog and content list page

| Task | File | Description |
|------|------|-------------|
| T3.1 | `src/app/(app)/content/page.tsx` | Content list page |
| T3.2 | `src/components/content/upload-dialog.tsx` | Upload dialog with PDF tab |
| T3.3 | `src/components/content/chapter-card.tsx` | Chapter list item card |
| T3.4 | `src/components/layout/bottom-nav.tsx` | Add content nav item |

**Verification:**
- [ ] Can navigate to /content page
- [ ] Can open upload dialog
- [ ] Can upload PDF and see extracted text preview
- [ ] Chapter saved to database

### Wave 4: Tesseract.js Integration (Image OCR)
**Goal:** OCR for direct photo uploads

| Task | File | Description |
|------|------|-------------|
| T4.1 | `package.json` | Add `tesseract.js` dependency |
| T4.2 | `src/lib/ocr-processor.ts` | Tesseract.js wrapper (lazy load) |
| T4.3 | `src/components/content/upload-dialog.tsx` | Add camera/image tab |
| T4.4 | `src/components/content/processing-progress.tsx` | OCR progress indicator |

**Verification:**
- [ ] Can upload image and get OCR text
- [ ] Tesseract WASM loads successfully
- [ ] Progress indicator shows during OCR

### Wave 5: Content Management & Polish
**Goal:** View, edit, delete chapters; error handling

| Task | File | Description |
|------|------|-------------|
| T5.1 | `src/app/(app)/content/[id]/page.tsx` | Chapter detail/edit page |
| T5.2 | `src/components/content/content-viewer.tsx` | Text display with edit mode |
| T5.3 | Error handling | Toast messages for failures |
| T5.4 | Loading states | Skeleton loaders for content page |
| T5.5 | Tests | Unit tests for chapter detector |

**Verification:**
- [ ] Can view chapter content
- [ ] Can edit chapter name and content
- [ ] Can delete chapter with confirmation
- [ ] All error states handled gracefully

## Dependencies

```json
{
  "pdfjs-dist": "^4.x",
  "tesseract.js": "^5.x"
}
```

## New Files Summary

```
src/
├── app/(app)/content/
│   ├── page.tsx
│   └── [id]/page.tsx
├── components/content/
│   ├── upload-dialog.tsx
│   ├── chapter-card.tsx
│   ├── content-viewer.tsx
│   └── processing-progress.tsx
├── services/
│   └── chapter-service.ts
├── stores/
│   └── content-store.ts
└── lib/
    ├── pdf-extractor.ts
    ├── ocr-processor.ts
    └── chapter-detector.ts
```

## Modified Files

| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Add chapters table |
| `src/lib/db/database.ts` | Add migration |
| `src/components/layout/bottom-nav.tsx` | Add content nav |
| `package.json` | Add dependencies |
| `next.config.ts` | PDF.js worker config (if needed) |

## Acceptance Criteria

1. [ ] Teacher can upload Lens-scanned PDF and extract text
2. [ ] Teacher can upload photo and get OCR text
3. [ ] Chapters are organized by subject
4. [ ] Chapter auto-detection works for standard formats
5. [ ] All processing works offline
6. [ ] TypeScript clean, build succeeds, tests pass

## Rollback Plan

If issues arise:
1. Revert to Phase 1 state (all changes in feature branch)
2. No data migration needed (new table only)
3. Dependencies can be removed cleanly

## Quality Gates

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
- [ ] Manual test: upload PDF, verify text extraction
- [ ] Manual test: upload image, verify OCR

---
*Plan v001 — Phase 2 Content Upload & OCR*
