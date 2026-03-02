# Research Brief — Phase 1: MVP

## Goal

Build a functional PWA that enables a primary school teacher to manage classes, track student marks, and generate parent feedback messages — working offline with IGCSE curriculum alignment.

## In Scope

- Next.js 14 PWA scaffold with offline support
- SQLite database (local-first via sql.js)
- Class & subject CRUD (IGCSE subjects)
- Student management with search
- Assessment creation and marks entry
- IGCSE grade calculation (A*-G scale)
- Template-based feedback message generation
- Mobile-first responsive UI

## Out of Scope (Non-Goals)

- Multi-teacher / multi-tenant support
- Parent-facing portal or login
- Cloud sync (Phase 4)
- Content upload / OCR (Phase 2)
- Worksheet / lesson plan / question paper generation (Phase 2-3)
- Document formatter (Phase 4)
- Attendance tracking

## Constraints

| Constraint | Type | Impact |
|------------|------|--------|
| Offline-first | Hard | Must work without network for core CRUD |
| IGCSE grading | Hard | Grade boundaries must match IGCSE standards |
| Mobile installable | Hard | PWA manifest required |
| Single-teacher | Soft | No auth needed, simplifies data model |
| English only | Soft | No i18n infrastructure needed |

## Success Criteria

1. Teacher can create a class with IGCSE subjects in < 1 minute
2. Teacher can add 30 students in < 5 minutes (bulk or individual)
3. Teacher can enter marks for 30 students in < 5 minutes
4. Grades auto-calculate correctly per IGCSE scale
5. Feedback messages generate in < 2 seconds per student
6. App installs on mobile and works offline
7. App loads in < 3 seconds

## Open Decisions

| Decision | Options | Owner |
|----------|---------|-------|
| SQLite implementation | sql.js (WASM) vs better-sqlite3 (Node) | Research |
| State management | React Context vs Zustand vs Jotai | Research |
| UI component library | shadcn/ui vs Radix vs custom | Research |
| Feedback generation | Pure templates vs Claude API hybrid | Research |

---
*Created: 2026-03-02*
