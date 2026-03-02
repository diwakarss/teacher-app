# Research Brief

## Goal

Enable teachers to generate lesson plans and question papers from uploaded chapter content using AI, with structured output ready for print/export.

## In Scope

- Lesson plan generation with structured sections (intro, content, activities, assessment)
- Question paper generation with configurable marks distribution and sections
- AI-powered content generation using Claude API
- Integration with Phase 2 chapter content
- Export to print-ready formats
- Answer key generation for question papers
- Template-based fallbacks for offline use

## Out of Scope (Non-Goals)

- Worksheet generation (deferred to later or separate feature)
- PDF/Word document export (Phase 4 document formatter)
- Multi-language support
- Integration with curriculum databases
- Real-time collaboration on generated content

## Constraints

| Constraint | Type | Evidence |
|-----------|------|----------|
| Claude API required for AI generation | Hard | PROJECT.md spec |
| Must work with existing chapter schema | Hard | Phase 2 implemented schema |
| IGCSE curriculum alignment | Hard | PROJECT.md decision |
| Offline must show graceful degradation | Soft | PWA requirement |
| Generation under 2 minutes | Hard | REQUIREMENTS.md success metric |

## Success Criteria

- [ ] Teacher can generate a lesson plan for any uploaded chapter in < 30 seconds
- [ ] Teacher can generate a question paper with specified marks (40/50/100) in < 2 minutes
- [ ] Generated content is editable before save/export
- [ ] Question papers auto-calculate section distribution from total marks
- [ ] Answer keys generated separately from question papers
- [ ] Works gracefully offline (shows "requires internet" message)

## Decisions (Resolved)

| Decision | Resolution | Date |
|----------|------------|------|
| Store generated content? | **Store in DB** — persist lesson plans and question papers | 2026-03-02 |
| Lesson plan duration | **Free-form input** — teacher enters custom duration | 2026-03-02 |
| Question type distribution | **Preset templates with adjustment** — templates prefill but editable before generation | 2026-03-02 |
| Export format | **Preview + PDF export** — in-app preview and downloadable PDF | 2026-03-02 |
