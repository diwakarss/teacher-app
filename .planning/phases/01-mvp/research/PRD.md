# Product Requirements Document
## Teacher Assistant PWA — Phase 1 MVP

**Version**: 1.0
**Date**: 2026-03-02
**Status**: Draft
**Author**: NalaN (Silver Birch)

---

## 1. Executive Summary

### 1.1 Problem Statement

Primary school teachers spend excessive time on administrative tasks: managing student records, calculating grades, and writing individual feedback messages. These tasks are repetitive, time-consuming, and prone to errors.

### 1.2 Proposed Solution

A Progressive Web App that enables teachers to manage classes, track student performance with automatic IGCSE grade calculation, and generate personalized feedback messages — all working offline on their mobile devices.

### 1.3 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Marks entry speed | 30 students in < 5 min | Time to complete |
| Feedback generation | < 2 sec per student | Response time |
| App load time | < 3 seconds | Lighthouse |
| Offline reliability | 100% for core features | E2E tests |
| PWA installability | Pass all criteria | Lighthouse PWA audit |

---

## 2. User Stories

### 2.1 Class Management

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| CM-1 | As a teacher, I want to create a new class so I can organize my students | P0 | Can create class with name and academic year |
| CM-2 | As a teacher, I want to add subjects to a class so I can track performance per subject | P0 | Can add IGCSE subjects to class |
| CM-3 | As a teacher, I want to switch between classes easily | P0 | Class switcher in navigation |
| CM-4 | As a teacher, I want to edit or delete a class | P1 | Edit/delete with confirmation |

### 2.2 Student Management

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| SM-1 | As a teacher, I want to add students to my class | P0 | Can add student with name, roll number |
| SM-2 | As a teacher, I want to search for a student | P0 | Search by name or roll number |
| SM-3 | As a teacher, I want to view student details | P0 | See profile, parent contact |
| SM-4 | As a teacher, I want to edit or remove a student | P1 | Edit/delete with confirmation |
| SM-5 | As a teacher, I want to import students from CSV | P2 | Bulk import with validation |

### 2.3 Marks Entry

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| ME-1 | As a teacher, I want to create an assessment | P0 | Name, type, subject, max marks |
| ME-2 | As a teacher, I want to enter marks for all students | P0 | Grid view, keyboard navigation |
| ME-3 | As a teacher, I want marks to auto-save | P0 | Save on field blur |
| ME-4 | As a teacher, I want to see IGCSE grades calculated | P0 | Grade shown next to marks |
| ME-5 | As a teacher, I want to see class statistics | P1 | Average, highest, lowest |

### 2.4 Feedback Generation

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| FG-1 | As a teacher, I want to generate feedback for a student | P0 | Based on marks and grade |
| FG-2 | As a teacher, I want multiple feedback formats | P0 | SMS (short), WhatsApp (long) |
| FG-3 | As a teacher, I want to copy feedback to clipboard | P0 | One-click copy |
| FG-4 | As a teacher, I want to generate feedback for entire class | P1 | Bulk generation |
| FG-5 | As a teacher, I want AI-enhanced feedback when online | P1 | Claude API integration |

### 2.5 Offline & PWA

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| PW-1 | As a teacher, I want to install the app on my phone | P0 | PWA install prompt |
| PW-2 | As a teacher, I want to use the app offline | P0 | All CRUD works offline |
| PW-3 | As a teacher, I want to see offline status | P0 | Indicator when offline |
| PW-4 | As a teacher, I want my data to persist | P0 | Data survives app restart |

---

## 3. Technical Specifications

### 3.1 Architecture

```
Browser (PWA)
├── UI Layer: Next.js 14 + shadcn/ui
├── State Layer: Zustand
├── Service Layer: TypeScript modules
├── Data Layer: Drizzle ORM + sql.js
└── Storage: IndexedDB

External (Online Only)
└── Claude API for enhanced feedback
```

### 3.2 Database Schema

```typescript
// classes
{
  id: string (UUID)
  name: string
  academicYear: string
  createdAt: Date
  updatedAt: Date
}

// subjects
{
  id: string (UUID)
  name: string
  classId: string (FK)
  createdAt: Date
  updatedAt: Date
}

// students
{
  id: string (UUID)
  name: string
  rollNumber: string
  classId: string (FK)
  parentName: string?
  parentPhone: string?
  parentEmail: string?
  createdAt: Date
  updatedAt: Date
}

// assessments
{
  id: string (UUID)
  name: string
  type: 'unit' | 'monthly' | 'term' | 'quiz'
  subjectId: string (FK)
  classId: string (FK)
  maxMarks: number
  date: Date
  term: number
  createdAt: Date
  updatedAt: Date
}

// marks
{
  id: string (UUID)
  studentId: string (FK)
  assessmentId: string (FK)
  marksObtained: number
  remarks: string?
  createdAt: Date
  updatedAt: Date
}
```

### 3.3 IGCSE Grade Boundaries

| Grade | Percentage |
|-------|------------|
| A* | 90-100 |
| A | 80-89 |
| B | 70-79 |
| C | 60-69 |
| D | 50-59 |
| E | 40-49 |
| F | 30-39 |
| G | 20-29 |
| U | 0-19 |

### 3.4 API Endpoints (Internal)

All data operations are local. No REST API needed for Phase 1.

Claude API route (online enhancement):
```
POST /api/feedback
Body: { studentId, assessmentId, context }
Response: { message: string }
```

---

## 4. UI/UX Requirements

### 4.1 Navigation

- Bottom navigation bar (mobile-first)
- Tabs: Dashboard, Classes, Students, Marks, Feedback
- Class switcher in header

### 4.2 Key Screens

| Screen | Purpose | Components |
|--------|---------|------------|
| Dashboard | Overview, quick actions | Stats cards, recent activity |
| Classes | Manage classes | Class list, add button |
| Class Detail | View class, subjects | Subject list, student count |
| Students | Student roster | Search, student cards |
| Student Detail | Profile, marks history | Info, marks table |
| Marks Entry | Enter marks | Grid, auto-save |
| Feedback | Generate messages | Student selector, templates |

### 4.3 Mobile Considerations

- Touch-friendly targets (48px minimum)
- Swipe gestures for common actions
- Offline indicator always visible
- Pull-to-refresh where appropriate

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Metric | Requirement |
|--------|-------------|
| Initial load | < 3 seconds |
| Subsequent loads | < 1 second |
| Marks entry response | < 100ms |
| Feedback generation | < 2 seconds |

### 5.2 Offline Support

- All CRUD operations work offline
- Data persists in IndexedDB
- Service worker caches app shell
- Graceful degradation for AI features

### 5.3 Security

- No authentication (single-teacher, local-only)
- Student PII stored locally only
- Claude API key server-side only
- No analytics with student data

### 5.4 Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast ratios

---

## 6. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| sql.js performance on old phones | Medium | High | Test on low-end devices early |
| IndexedDB storage limits | Low | High | Monitor usage, warn at 80% |
| Service worker cache issues | Medium | Medium | Version-based cache busting |
| Feedback template quality | Medium | Medium | Multiple variations, user testing |

---

## 7. Out of Scope

Explicitly excluded from Phase 1:

- Multi-teacher / multi-tenant
- Parent portal
- Cloud sync / backup
- Content upload / OCR
- Worksheet generation
- Lesson plan generation
- Question paper generation
- Document formatter
- Attendance tracking
- Advanced analytics

---

## 8. Dependencies

| Dependency | Type | Risk |
|------------|------|------|
| sql.js | Library | Low — mature, well-maintained |
| Drizzle ORM | Library | Low — actively developed |
| shadcn/ui | Library | Low — stable, customizable |
| next-pwa | Library | Low — standard approach |
| Claude API | External | Medium — requires network |

---

## 9. Timeline

| Week | Deliverable |
|------|-------------|
| 1 | PWA scaffold, database setup, base UI |
| 2 | Class & subject management |
| 3 | Student management |
| 4 | Marks entry & grade calculation |
| 5 | Feedback generation |
| 6 | Polish, testing, PWA audit |

**Total**: 6 weeks to MVP

---

## 10. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | JD | | |
| Tech Lead | NalaN | 2026-03-02 | ✓ |

---
*Generated by NalaN research phase*
