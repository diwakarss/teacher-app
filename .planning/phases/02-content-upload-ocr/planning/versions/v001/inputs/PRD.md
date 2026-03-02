# PRD: Content Upload & OCR — Phase 2

## Executive Summary

Enable teachers to upload textbook content (PDFs scanned with Microsoft Lens, direct photos) with automatic text extraction and chapter detection. Extracted text stored locally for use in worksheet generation (Phase 3).

**Key outcome:** Teacher can digitize a textbook chapter in under 30 seconds with zero cost.

## Problem Statement

Teachers need to convert physical textbook content into digital form for generating worksheets, lesson plans, and question papers. Current manual transcription is time-consuming and error-prone.

## User Stories

### US-1: Upload PDF from Microsoft Lens
**As a** teacher
**I want to** upload a PDF scanned with Microsoft Lens
**So that** I can extract and organize chapter content for worksheet generation

**Acceptance Criteria:**
- [ ] Can select PDF file from device (up to 50MB)
- [ ] Text extracted automatically from PDF text layer
- [ ] Extracted text displayed for preview within 5 seconds
- [ ] Chapter boundaries auto-detected for standard formats
- [ ] Can manually edit chapter name and boundaries
- [ ] Content saved to selected subject

### US-2: Take Photo of Textbook Page
**As a** teacher
**I want to** photograph a textbook page directly
**So that** I can digitize content when a scanner isn't available

**Acceptance Criteria:**
- [ ] Can capture photo using device camera
- [ ] Can select existing photo from gallery
- [ ] OCR extracts text from image
- [ ] Extracted text displayed for preview within 10 seconds
- [ ] Can manually correct OCR errors before saving

### US-3: View and Search Chapter Content
**As a** teacher
**I want to** browse and search my uploaded chapters
**So that** I can find content for worksheet creation

**Acceptance Criteria:**
- [ ] Chapters listed by subject
- [ ] Can search chapters by name
- [ ] Can view full chapter content
- [ ] Can edit chapter content after upload
- [ ] Can delete chapters

### US-4: Organize Content by Subject
**As a** teacher
**I want to** assign chapters to subjects
**So that** content is organized for my classes

**Acceptance Criteria:**
- [ ] Subject selector during upload
- [ ] Chapter count shown per subject
- [ ] Can move chapter between subjects

## Functional Requirements

### FR-1: File Upload
- Accept PDF files up to 50MB
- Accept image files (JPEG, PNG) up to 10MB
- Validate file type before processing
- Show upload progress indicator

### FR-2: PDF Text Extraction
- Use PDF.js to extract text layer
- Handle multi-page PDFs
- Preserve paragraph structure where possible
- Detect and report if PDF has no text layer

### FR-3: Image OCR
- Use Tesseract.js for English text recognition
- Lazy-load Tesseract WASM (only when needed)
- Show processing progress
- Support image preprocessing (if beneficial)

### FR-4: Chapter Detection
- Auto-detect chapters using regex patterns:
  - "Chapter X", "Unit X", "Lesson X", "Module X"
  - Numbered sections (e.g., "1. Introduction")
- Fallback: entire content as single chapter
- Allow manual split/merge of chapters

### FR-5: Content Storage
- Store extracted text only (no original files)
- Associate chapters with subjects
- Support chapter metadata: name, number, difficulty tag
- Track page count and source type

### FR-6: Content Management
- List chapters filtered by subject
- Edit chapter name and content
- Delete chapters with confirmation
- Show storage usage estimate

## Non-Functional Requirements

### NFR-1: Performance
- PDF text extraction: < 5 seconds for typical textbook chapter
- Image OCR: < 10 seconds per page
- Chapter list load: < 1 second

### NFR-2: Offline Support
- All processing runs client-side
- Works without internet connection
- Tesseract WASM cached after first use

### NFR-3: Storage
- Estimated 10KB per page of text
- 20-page chapter ≈ 200KB
- Monitor IndexedDB usage, warn at 80%

## Technical Specifications

### New Database Table

```sql
CREATE TABLE chapters (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  page_count INTEGER DEFAULT 1,
  source_type TEXT NOT NULL CHECK (source_type IN ('pdf', 'image')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### New Dependencies

```json
{
  "pdfjs-dist": "^4.x",
  "tesseract.js": "^5.x"
}
```

### New Routes

| Route | Purpose |
|-------|---------|
| `/content` | Content list page (chapters by subject) |
| `/content/[id]` | Chapter detail/edit page |

## UI/UX Requirements

### Content List Page
- Subject filter tabs or dropdown
- Chapter cards showing: name, page count, source type icon, date
- "Upload" FAB button
- Empty state with upload prompt

### Upload Dialog
- Two tabs: "PDF" and "Camera"
- File picker / camera capture
- Progress indicator during processing
- Preview of extracted text
- Chapter name input (auto-filled from detection)
- Subject selector
- Save / Cancel buttons

### Chapter Detail Page
- Chapter name (editable)
- Full content display (scrollable)
- Edit mode toggle
- Delete button with confirmation

## Out of Scope (Phase 3+)

- Worksheet generation from content
- Question paper generation
- Lesson plan generation
- Multi-language OCR
- Cloud backup of content
- Topic-level breakdown within chapters
- AI-powered content analysis

## Success Metrics

| Metric | Target |
|--------|--------|
| PDF upload success rate | > 95% |
| OCR accuracy on clean photos | > 90% |
| Time to upload chapter (Lens PDF) | < 30 seconds |
| User can find content for worksheet | 100% (prerequisite for Phase 3) |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| PDF has no text layer | Detect and offer image-based OCR |
| OCR produces garbled text | Preview + edit before save |
| Chapter detection fails | Manual chapter naming always available |
| Storage quota exceeded | Show usage, suggest cleanup |

## Dependencies

- Phase 1 MVP complete (classes, subjects, students) ✓
- PDF.js library compatibility with Next.js 16
- Tesseract.js WASM loading in service worker context

## Timeline Estimate

| Wave | Scope |
|------|-------|
| Wave 1 | Database schema, basic service layer |
| Wave 2 | PDF.js integration, upload UI |
| Wave 3 | Tesseract.js integration, camera capture |
| Wave 4 | Chapter detection, content management |
| Wave 5 | Polish, error handling, testing |

---
*PRD: Phase 2 Content Upload & OCR — Teacher Assistant PWA*
