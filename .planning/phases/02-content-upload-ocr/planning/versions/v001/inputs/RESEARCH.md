# Phase 2 Research — Content Upload & OCR

## Context

| Aspect | Value |
|--------|-------|
| Project mode | Existing (Phase 1 MVP complete) |
| Work mode | Feature |
| Phase scope | Content upload with PDF/image text extraction |
| Target user | Primary school teacher (wife) |
| Primary workflow | Microsoft Lens scan → PDF upload |

## Existing State

### Current Codebase (Phase 1 Complete)

- **Routes**: Dashboard, Classes, Students, Marks, Feedback
- **Database**: sql.js + IndexedDB with 6 tables (classes, subjects, students, assessments, marks, feedback)
- **State**: Zustand stores for each entity
- **Services**: CRUD operations with raw SQL
- **UI**: shadcn/ui components, responsive mobile-first design

### Relevant Existing Patterns

| Pattern | Location | Reuse in Phase 2 |
|---------|----------|------------------|
| Service layer | `src/services/*.ts` | Add `chapter-service.ts` |
| Zustand store | `src/stores/*.ts` | Add `content-store.ts` |
| DB migrations | `src/lib/db/database.ts` | Add `chapters` table |
| Dialog components | `src/components/*/` | Add upload dialog |

## Existing Debt

No architecture violations detected in Phase 1. Clean baseline.

Minor concerns from mapper:
- Drizzle ORM underutilized (queries use raw SQL) — continue pattern for consistency
- `@anthropic-ai/sdk` installed but unused — can remove if not needed

## Proposed Approach

### Processing Strategy

**Primary (99% of usage):** PDF.js for Microsoft Lens scans
- Lens already performs OCR and embeds text layer
- PDF.js extracts embedded text instantly
- 100% accuracy, zero cost

**Fallback:** Tesseract.js for direct photos
- Lazy-loaded (4MB WASM only when needed)
- ~95% accuracy on clean printed text
- Runs entirely client-side

### Why Not Cloud OCR?

| Option | Cost | Decision |
|--------|------|----------|
| AWS Bedrock Claude Vision | ~$15-25/month | Too expensive for single-user app |
| Google Cloud Vision | ~$0.68/month after free tier | Unnecessary complexity |
| PDF.js + Tesseract.js | $0/month | **Selected** — sufficient for use case |

### Chapter Detection

Regex-based heuristics for common textbook patterns:
- "Chapter X", "Unit X", "Lesson X", "Module X"
- Numbered sections: "1. Topic Name"
- Page break detection in multi-page PDFs

Fallback: Entire PDF as single chapter, user manually edits/splits.

## Constraints

### Constraint Classification

| Constraint | Type | Evidence | Impact if Violated |
|-----------|------|----------|-------------------|
| 50MB file size limit | Hard | JD decision | Large files rejected |
| Client-side processing | Soft | Cost decision | Could add cloud later |
| Text-only storage | Hard | JD decision | No original file recovery |
| Offline capability | Soft | Architecture decision | Upload works offline |

## Risks / Pitfalls

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| PDF without text layer | Low | No text extracted | Fallback to Tesseract OCR on PDF images |
| Tesseract accuracy issues | Medium | Garbled text | Preview extracted text, allow manual edit |
| Chapter detection fails | Medium | Wrong splits | Manual chapter name/boundary editing |
| Large PDF hangs browser | Low | Poor UX | Progress indicator, page-by-page processing |
| IndexedDB quota exceeded | Low | Save fails | Show storage usage, warn at 80% |

## Open Questions

| Question | Status | Notes |
|----------|--------|-------|
| Include basic worksheet generation? | Defer to Phase 3 | Keep Phase 2 focused on content ingestion |
| Topic-level breakdown? | Defer | Start with chapter-level only |
| Content tagging (difficulty)? | Include | Simple dropdown, user-assigned |

## Confidence Assessment

| Aspect | Confidence | Notes |
|--------|------------|-------|
| PDF.js text extraction | HIGH | Standard library, well-documented |
| Tesseract.js accuracy | MEDIUM | Depends on image quality |
| Chapter detection | MEDIUM | Heuristics may miss edge cases |
| Overall feasibility | HIGH | Straightforward extension of Phase 1 patterns |

## Grounding Ledger

| Claim | Source | Date Checked | Confidence |
|------|--------|--------------|------------|
| PDF.js extracts embedded text | [PDF.js docs](https://mozilla.github.io/pdf.js/) | 2026-03-02 | HIGH |
| Tesseract.js ~95% on printed text | [AIMultiple benchmark](https://research.aimultiple.com/ocr-accuracy/) | 2026-03-02 | MEDIUM |
| Microsoft Lens embeds OCR text | Common knowledge | 2026-03-02 | HIGH |
| Tesseract.js WASM ~4MB | [tesseract.js repo](https://github.com/naptha/tesseract.js) | 2026-03-02 | HIGH |

## Success Criteria

1. Teacher can upload Lens-scanned PDF and see extracted text in < 5 seconds
2. Teacher can upload photo and see OCR text in < 10 seconds
3. Chapter auto-detection works for standard textbook formats
4. Content is searchable by chapter name
5. All processing works offline
6. Storage usage visible in UI

---
*Phase 2 Research — Teacher Assistant PWA*
