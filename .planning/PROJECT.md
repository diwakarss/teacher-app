# Teacher Assistant PWA

## Overview

A Progressive Web App for primary school teachers to manage classes, track student performance, generate educational content, and automate document formatting. IGCSE curriculum aligned.

## Type

`coding`

## Scope

Single-teacher, local-first PWA with offline support. No multi-tenant, no parent portal, no school system integration.

## Key Constraints

- **Curriculum**: IGCSE (grade boundaries, terminology, assessment types)
- **Platform**: PWA installable on mobile, works offline
- **Storage**: SQLite local-first, optional cloud backup
- **AI**: Claude API for content generation (requires online)
- **OCR**: Tesseract.js for English text extraction

## Success Criteria

- Enter marks for 30 students in < 5 minutes
- Feedback generation < 30 seconds per class
- Question paper generation < 2 minutes
- 90%+ generated content requires minimal editing
- App loads in < 3 seconds
- Works reliably offline

## Phases

| Phase | Focus | Features |
|-------|-------|----------|
| 1 | MVP | Class/Subject management, Student management, Marks entry, Feedback generation |
| 2 | Content | Content upload (PDF, photos), OCR, Worksheet generation |
| 3 | Generation | Lesson plan generation, Question paper generation |
| 4 | Polish | Document formatter, Advanced analytics, Cloud sync |

## Tech Stack

- **Frontend**: Next.js 14+ (App Router, PWA)
- **Database**: SQLite via sql.js or better-sqlite3
- **AI**: Claude API (Anthropic)
- **OCR**: Tesseract.js
- **Document**: docx.js for Word processing
- **UI**: Tailwind CSS + shadcn/ui

## References

- `REQUIREMENTS.md` — Full user requirements
- `.planning/DECISIONS.md` — Design decisions
- `.planning/ROADMAP.md` — Phase breakdown

---
*Initialized: 2026-03-02*
