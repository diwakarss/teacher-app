# Teacher Assistant PWA — Roadmap

## Phase 1: MVP (Current)

**Goal**: Core functionality for daily teacher workflow

### Deliverables

1. **PWA Scaffold**
   - Next.js 14 App Router setup
   - PWA manifest + service worker
   - Offline-first architecture
   - SQLite database setup

2. **Class & Subject Management**
   - Create/edit/delete classes
   - Define subjects per class
   - Academic year/term structure
   - IGCSE subject templates

3. **Student Management**
   - Add/edit/remove students
   - Student profile (name, roll number, parent contact)
   - Search by name/roll number
   - Import from CSV (stretch)

4. **Marks Entry & Tracking**
   - Create assessments (Unit Test, Monthly, Term Exam, Quiz)
   - Enter marks with validation
   - Auto-calculate totals, percentages, IGCSE grades
   - Basic performance indicators

5. **Feedback Generation**
   - Template-based feedback messages
   - Performance level detection
   - SMS and WhatsApp formats
   - Copy to clipboard

### Exit Criteria

- [ ] Can create class with subjects
- [ ] Can add students to class
- [ ] Can enter marks for assessment
- [ ] Can generate feedback for student
- [ ] Works offline (read/write local data)
- [ ] Installable as PWA

---

## Phase 2: Content & Worksheets

**Goal**: Digitize textbook content and generate practice materials

### Deliverables

1. **Content Upload**
   - PDF upload with text extraction
   - Camera capture for textbook photos
   - OCR processing (Tesseract.js)
   - Content organization (Subject > Chapter > Topic)

2. **Worksheet Generation**
   - AI-powered question generation
   - Multiple question types (MCQ, fill-blanks, short/long answer)
   - Difficulty levels
   - PDF export with answer key

### Exit Criteria

- [ ] Can upload PDF and extract text
- [ ] Can photograph textbook page and OCR
- [ ] Can generate worksheet from chapter content
- [ ] Can export worksheet as PDF

---

## Phase 3: Lesson Plans & Papers

**Goal**: Comprehensive educational content generation

### Deliverables

1. **Lesson Plan Generation**
   - AI-generated structured plans
   - IGCSE learning objectives alignment
   - Activity suggestions
   - Differentiation for varied learners

2. **Question Paper Generation**
   - Mark-based paper structure
   - Section distribution (1-mark, 2-mark, 5-mark)
   - Difficulty distribution
   - Print-ready PDF with header

### Exit Criteria

- [ ] Can generate lesson plan for topic
- [ ] Can generate question paper by total marks
- [ ] Generated content stored and searchable

---

## Phase 4: Polish & Sync

**Goal**: Production-ready with advanced features

### Deliverables

1. **Document Formatter**
   - Upload Word docs
   - Apply formatting rules
   - Save presets
   - Download formatted output

2. **Advanced Analytics**
   - Class performance trends
   - Student progress over time
   - Subject comparison charts

3. **Cloud Sync**
   - Optional backup to cloud
   - Multi-device sync
   - Data export

### Exit Criteria

- [ ] Can format Word documents
- [ ] Can view analytics dashboard
- [ ] Can backup/restore data

---
*Roadmap created: 2026-03-02*
