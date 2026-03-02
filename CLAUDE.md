# Teacher Assistant PWA

A Progressive Web App for primary school teachers to manage classes, track student performance, generate educational content, and automate document formatting.

## Project Structure

```
teacher-app/
├── REQUIREMENTS.md    # Full user requirements document
├── CLAUDE.md          # This file
├── frontend/          # React/Next.js PWA
├── backend/           # API server (if needed)
└── docs/              # Additional documentation
```

## Key Features

1. **Class & Student Management** - Multiple classes, subjects, student tracking
2. **Marks & Performance** - Enter marks, auto-calculate grades, trends
3. **Feedback Generation** - AI-powered personalized messages
4. **Content Upload** - PDF, photos with OCR
5. **Worksheet Generation** - From uploaded content
6. **Lesson Plan Generation** - Structured plans with activities
7. **Question Paper Generation** - Specify marks, auto-distribute sections
8. **Document Formatter** - Upload Word docs, apply formatting rules

## Tech Stack (Planned)

- Frontend: Next.js (PWA)
- Backend: Python FastAPI or Node.js
- Database: SQLite (local-first)
- AI: Claude API
- OCR: Tesseract.js

## Getting Started

```bash
# Read requirements first
cat REQUIREMENTS.md

# Start development
hq start teacher-app
```

## Phase 1 Focus (MVP)

- [ ] Basic PWA scaffold
- [ ] Class/Subject CRUD
- [ ] Student management
- [ ] Marks entry
- [ ] Simple feedback generation

## Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Test offline functionality
npm run preview
```
