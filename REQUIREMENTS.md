# Teacher Assistant PWA - User Requirements Document

**Project:** Teacher Assistant PWA  
**Version:** 1.0  
**Date:** 2026-03-01  
**Author:** JD  

---

## 1. Executive Summary

A Progressive Web App (PWA) designed for primary school teachers to manage classes, track student performance, generate educational content (worksheets, lesson plans, question papers), and automate document formatting. The app should work offline and be installable on mobile devices.

---

## 2. User Persona

**Primary User:** Primary school teacher  
- Manages multiple classes (e.g., Class 1, 2, 3, 4, 5)
- Teaches multiple subjects per class
- Needs to track 20-50+ students per class
- Limited time for administrative tasks
- May have varying tech literacy
- Needs English language support

---

## 3. Core Features

### 3.1 Class & Subject Management

**Requirements:**
- Create and manage multiple classes (e.g., "Class 3A", "Class 4B")
- Define subjects per class (e.g., English, Maths, Science, Social Studies, EVS)
- Set academic year/term structure
- Support for multiple academic terms (Term 1, Term 2, Term 3)

**User Stories:**
- As a teacher, I want to create a new class so I can organize my students
- As a teacher, I want to assign subjects to each class I teach
- As a teacher, I want to switch between classes easily

---

### 3.2 Student Management & Tracking

**Requirements:**
- Add/edit/remove students in each class
- Student profile: Name, Roll Number, Parent Contact, Photo (optional)
- Track attendance (optional - phase 2)
- View student history across terms

**Data Model:**
```
Student {
  id, name, rollNumber, classId, 
  parentName, parentPhone, parentEmail,
  photo, notes, createdAt
}
```

**User Stories:**
- As a teacher, I want to add students to my class roster
- As a teacher, I want to quickly find a student by name or roll number
- As a teacher, I want to see a student's complete academic history

---

### 3.3 Marks Entry & Performance Tracking

**Requirements:**
- Enter marks for each student per subject per assessment
- Support multiple assessment types:
  - Unit Tests
  - Monthly Tests
  - Term Exams
  - Class Tests / Quizzes
- Define maximum marks for each assessment
- Calculate totals, percentages, grades automatically
- Visual performance indicators (charts, trends)
- Compare student performance across assessments
- Class-wide analytics (average, highest, lowest, distribution)

**Data Model:**
```
Assessment {
  id, name, type, subjectId, classId,
  maxMarks, date, termId
}

Mark {
  id, studentId, assessmentId, 
  marksObtained, remarks
}
```

**User Stories:**
- As a teacher, I want to enter marks for a class test quickly
- As a teacher, I want to see which students are struggling
- As a teacher, I want to see class-wide performance trends

---

### 3.4 Auto-Generated Feedback Messages

**Requirements:**
- Generate personalized feedback messages for each student
- Based on:
  - Current marks/grade
  - Performance trend (improving/declining/stable)
  - Comparison to class average
  - Subject-specific strengths/weaknesses
- Output formats:
  - SMS-friendly (short, under 160 chars)
  - WhatsApp message (can be longer, formatted)
  - Parent letter format
- Language: English
- Editable before sending
- Bulk generation for entire class

**Example Outputs:**

*Good Performance:*
> "Dear Parent, Ram scored 92% in Mathematics this term. Excellent progress! Please continue to encourage him."

*Needs Improvement:*
> "Dear Parent, Priya scored 45% in Science this term, below class average of 62%. She needs extra practice in the Life Sciences unit. Please ensure daily revision."

**User Stories:**
- As a teacher, I want to generate feedback for all students after entering marks
- As a teacher, I want to customize the feedback tone (encouraging/serious)
- As a teacher, I want to copy feedback to WhatsApp easily

---

### 3.5 Content Upload & Management

**Requirements:**
- Upload chapter content via:
  - PDF upload
  - Camera capture (photos of textbook pages)
  - Manual text entry
- OCR processing for photos to extract text
- Organize content by:
  - Subject → Chapter → Topic
- Tag content with:
  - Grade level
  - Difficulty
  - Learning objectives
- Store for use in worksheet/question paper generation

**Data Model:**
```
Chapter {
  id, subjectId, name, chapterNumber,
  content (extracted text), 
  sourceFiles (PDFs, images),
  topics[], learningObjectives[]
}
```

**User Stories:**
- As a teacher, I want to photograph textbook pages to digitize content
- As a teacher, I want to upload the school's PDF materials
- As a teacher, I want to organize content by chapter for easy retrieval

---

### 3.6 Worksheet Generation

**Requirements:**
- Generate worksheets based on:
  - Selected chapter(s)
  - Difficulty level (Easy/Medium/Hard/Mixed)
  - Question types:
    - Fill in the blanks
    - Match the following
    - True/False
    - Short answer
    - Long answer
    - MCQ
  - Number of questions
  - Target marks (optional)
- AI-powered question generation from chapter content
- Editable before finalizing
- Export as:
  - PDF (print-ready)
  - Word document
- Include answer key (separate page)

**User Stories:**
- As a teacher, I want to generate a worksheet for Chapter 5 with 10 questions
- As a teacher, I want to mix question types in a worksheet
- As a teacher, I want to print worksheets with answer keys

---

### 3.7 Lesson Plan Generation

**Requirements:**
- Generate lesson plans based on:
  - Chapter/Topic
  - Duration (30 min / 45 min / 1 hour)
  - Learning objectives
- Include:
  - Introduction/Hook (5 min)
  - Main content delivery
  - Activities/Exercises
  - Assessment/Recap
  - Materials needed
  - Differentiation suggestions (for advanced/struggling students)
- Align with standard pedagogical frameworks
- Export as PDF/Word

**User Stories:**
- As a teacher, I want to generate a 45-minute lesson plan for "Fractions"
- As a teacher, I want lesson plans that include hands-on activities
- As a teacher, I want to save and reuse lesson plans

---

### 3.8 Question Paper Generation

**Requirements:**
- Generate question papers based on:
  - **Total marks** (e.g., 40 marks, 50 marks, 100 marks)
  - Selected chapters/topics
  - Question type distribution:
    - Section A: 1-mark questions (MCQ/Fill blanks)
    - Section B: 2-mark questions (Short answer)
    - Section C: 5-mark questions (Long answer)
  - Difficulty distribution (Easy 30% / Medium 50% / Hard 20%)
  - Time duration
- Auto-calculate:
  - Number of questions per section based on total marks
  - Page layout and formatting
- Include:
  - Header (School name, Exam name, Date, Duration, Max Marks)
  - Instructions
  - Question numbering
  - Marks allocation per question
- Generate answer key separately
- Export as PDF (print-ready)

**Example Input:**
> "Generate a 40-mark question paper for Class 4 Maths, covering Chapters 1-5"

**Example Output Structure:**
```
Section A: 10 x 1 = 10 marks (MCQ/Fill blanks)
Section B: 5 x 2 = 10 marks (Short answer)
Section C: 4 x 5 = 20 marks (Long answer)
Total: 40 marks | Duration: 1.5 hours
```

**User Stories:**
- As a teacher, I want to create a 40-mark test for unit assessment
- As a teacher, I want to specify which chapters to include
- As a teacher, I want the paper formatted and ready to print

---

### 3.9 Document Formatter Tool

**Requirements:**
- Upload Word document (.docx) containing tables
- Define custom formatting rules:
  - Font family (e.g., "Times New Roman", "Arial", "Calibri")
  - Font sizes per element type:
    - Headings: 14pt bold
    - Body text: 12pt
    - Table headers: 11pt bold
    - Table cells: 10pt
  - Alignment rules:
    - Numbers: Right-aligned
    - Text: Left-aligned
    - Headers: Center-aligned
  - Table styling:
    - Border styles
    - Cell padding
    - Row height
  - Page margins
  - Header/Footer formatting
- Save formatting rule presets (e.g., "School Report Format", "Exam Paper Format")
- Preview formatted document
- Download formatted .docx

**User Stories:**
- As a teacher, I want to upload my marks table and auto-format it
- As a teacher, I want to save my formatting rules for reuse
- As a teacher, I want consistent formatting across all my documents

---

## 4. Technical Requirements

### 4.1 Platform
- **PWA** (Progressive Web App)
- Installable on mobile (Android/iOS)
- Works offline (service worker caching)
- Responsive design (mobile-first)

### 4.2 Tech Stack (Suggested)
- **Frontend:** React/Next.js or SvelteKit
- **Backend:** Node.js or Python (FastAPI)
- **Database:** SQLite (local) + Sync to cloud (optional)
- **AI/LLM:** Claude API for content generation
- **OCR:** Tesseract.js or Google Vision API
- **Document Processing:** python-docx or docx.js

### 4.3 Offline Support
- Core features must work offline:
  - Class/Student management
  - Marks entry
  - View existing content
- Sync when online:
  - AI-generated content
  - Document uploads
  - Backup to cloud

### 4.4 Language Support
- UI: English
- Content generation: English
- OCR: English text recognition

---

## 5. Data Privacy & Security

- Student data stored locally by default
- Optional cloud backup (encrypted)
- No student data shared with third parties
- Parent contact info protected
- GDPR-like consent for any cloud features

---

## 6. Phase Plan

### Phase 1 (MVP)
- [ ] Class & Subject management
- [ ] Student management
- [ ] Marks entry & basic tracking
- [ ] Feedback message generation (template-based)

### Phase 2
- [ ] Content upload (PDF, photos)
- [ ] OCR for English text
- [ ] Worksheet generation

### Phase 3
- [ ] Lesson plan generation
- [ ] Question paper generation

### Phase 4
- [ ] Document formatter tool
- [ ] Advanced analytics
- [ ] Cloud sync & backup

---

## 7. Success Metrics

- Teacher can enter marks for 30 students in < 5 minutes
- Feedback generation takes < 30 seconds per class
- Question paper generation takes < 2 minutes
- 90%+ of generated content requires minimal editing
- App loads in < 3 seconds
- Works reliably offline

---

## 8. Open Questions

1. Should the app support multiple teachers (school-wide deployment)?
2. Is parent-facing view needed (to share reports)?
3. Should worksheets/papers be stored and searchable?
4. Integration with school management systems?
5. Specific curriculum standards to follow (CBSE, State Board)?

---

## 9. Appendix

### A. Sample Data Structures

```typescript
// Class
interface Class {
  id: string;
  name: string;          // "Class 3A"
  academicYear: string;  // "2026-2027"
  subjects: Subject[];
  students: Student[];
}

// Assessment
interface Assessment {
  id: string;
  name: string;          // "Unit Test 1"
  type: 'unit' | 'monthly' | 'term' | 'quiz';
  subjectId: string;
  classId: string;
  maxMarks: number;
  date: Date;
  marks: Mark[];
}

// Feedback Template
interface FeedbackTemplate {
  performanceLevel: 'excellent' | 'good' | 'average' | 'needsWork' | 'struggling';
  tone: 'encouraging' | 'neutral' | 'serious';
  template: string;
}
```

### B. Formatting Rules Schema

```typescript
interface FormattingRule {
  name: string;
  rules: {
    fonts: {
      primary: string;
      secondary: string;
    };
    sizes: {
      heading1: number;
      heading2: number;
      body: number;
      tableHeader: number;
      tableCell: number;
    };
    alignment: {
      numbers: 'left' | 'center' | 'right';
      text: 'left' | 'center' | 'right';
      headers: 'left' | 'center' | 'right';
    };
    tables: {
      borderWidth: number;
      cellPadding: number;
      headerBackground: string;
    };
  };
}
```

---

*Document generated for use with HQ project management system.*
