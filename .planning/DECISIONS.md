# Design Decisions

## Open Questions — Resolved

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Multi-teacher support? | **No** | Single-teacher app, simpler auth/data model |
| 2 | Parent-facing view? | **No** | Teacher-only, feedback shared via copy/paste |
| 3 | Store/search generated papers? | **Yes** | Reuse worksheets/papers, build question bank |
| 4 | School system integration? | **No** | Standalone app, no external dependencies |
| 5 | Curriculum standards? | **IGCSE** | International curriculum alignment |

## Implications

- **No multi-tenant**: Single SQLite DB, no user auth needed (device = user)
- **IGCSE alignment**: Grade boundaries, subject terminology, assessment types follow IGCSE patterns
- **Content storage**: Need searchable repository for generated worksheets/papers/lesson plans

---
*Captured: 2026-03-02*
