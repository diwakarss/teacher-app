# Research Brief

## Goal
Enable teachers to upload chapter content (PDF, photos) with OCR text extraction for use in worksheet generation.

## In Scope
- PDF upload and text extraction
- Camera capture for textbook photos
- OCR processing for English text (Tesseract.js)
- Content organization by Subject → Chapter → Topic
- Content storage with extracted text in sql.js
- Basic worksheet generation from chapter content
- Content tagging (grade level, difficulty, learning objectives)

## Out of Scope (Non-Goals)
- Multi-language OCR (Hindi, Tamil, etc.)
- Cloud sync for content files
- Advanced AI-powered content analysis
- Lesson plan generation (Phase 3)
- Question paper generation (Phase 3)
- Document formatter tool (Phase 4)
- Image-to-image worksheet generation
- Handwriting recognition

## Constraints
- **Offline-first**: OCR must work offline using Tesseract.js WASM
- **Storage limits**: IndexedDB has ~50MB soft limit on mobile; need chunking for large PDFs
- **Performance**: OCR can be slow; must not block UI
- **PWA**: All features must work within browser capabilities
- **File size**: Need to handle textbook PDFs (10-50MB typical)
- **Mobile-first**: Camera capture primary on phones, file upload primary on desktop

## Success Criteria
- Teacher can photograph textbook page and see extracted text within 5 seconds
- Teacher can upload PDF and see extracted text within 10 seconds per page
- Content is searchable by chapter name and topic
- Extracted text is usable for worksheet generation (next phase feature)
- Works fully offline after initial load
- Storage usage displayed and manageable

## Open Decisions
| Decision | Owner | Status |
|----------|-------|--------|
| PDF.js vs pdf-parse for extraction | Engineer | **Decided: PDF.js** |
| Store original files or just extracted text? | JD | **Decided: Extracted text only** |
| Maximum file size limit | JD | **Decided: 50MB** |
| Compression strategy for images | Engineer | N/A (no image storage) |
| Chapter auto-detection vs manual entry | JD | **Decided: Auto-detect** |
| OCR approach | JD | **Decided: PDF.js + Tesseract.js** |
| Cloud OCR (Bedrock/Vision) | JD | **Decided: Not needed** |
| Offline requirement | JD | **Decided: Soft (online OK for upload)** |

## JD Decisions (2026-03-02)
1. **Storage**: Store only extracted text, discard original files after processing
2. **File limit**: 50MB maximum upload size
3. **Chapters**: Auto-detect chapter boundaries from PDF structure
4. **OCR Strategy**: PDF.js for text-layer PDFs (Microsoft Lens scans), Tesseract.js for direct photos
5. **Cost**: $0/month — fully client-side processing
6. **Primary workflow**: Microsoft Lens scan → PDF upload → PDF.js extraction

---
*Phase 2 Research Brief — Teacher Assistant PWA*
