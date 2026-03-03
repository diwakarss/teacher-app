# Research Brief

## Goal

Add polish features (Document Formatter, Analytics Dashboard, Cloud Backup) to make the Teacher Assistant PWA production-ready.

## In Scope

### 1. Document Formatter
- Upload Word documents (.docx)
- Parse and display document content
- Apply formatting rules (fonts, spacing, headers)
- Save formatting presets
- Download formatted output as .docx

### 2. Advanced Analytics
- Class performance trends over time
- Student progress visualization
- Subject comparison charts
- Assessment performance breakdown

### 3. Cloud Sync / Data Export
- Export all data (classes, students, marks, content, generated items)
- Import data backup
- Optional: Cloud backup integration

## Out of Scope (Non-Goals)

- Real-time multi-user collaboration
- User authentication / multi-tenant
- Complex document editing (just formatting rules)
- External cloud provider integration (Dropbox, Google Drive) in v1
- Server-side storage (local-first stays primary)

## Constraints

| Constraint | Type | Notes |
|-----------|------|-------|
| Offline-first | Hard | All features must work offline except cloud sync |
| No server dependency | Hard | PWA must function without backend |
| Browser APIs only | Hard | No native app capabilities |
| File size limits | Soft | Large docs may hit browser memory limits |

## Success Criteria

- [ ] Can upload .docx and apply formatting preset
- [ ] Can view analytics dashboard with at least 3 chart types
- [ ] Can export all data to JSON file
- [ ] Can import data from JSON backup
- [ ] All features work offline (except cloud upload)
- [ ] 70%+ unit test coverage on new code

## Open Decisions

| Decision | Owner | Status |
|----------|-------|--------|
| Word doc library: mammoth.js vs docx-parser | NalaN | Pending research |
| Chart library: recharts vs chart.js | NalaN | Pending research |
| Export format: JSON vs SQLite dump | NalaN | Pending research |
| Cloud provider for backup | JD | **Decided: Google Drive** |

## JD Decisions (2026-03-03)

1. **Cloud Provider**: Google Drive for backup/sync
2. **Analytics Priority**: Student progress + Assessment breakdown (class trends lower priority)
3. **Feature Priority**: Document Formatter > Analytics > Cloud Sync

## Wave Structure (Priority Order)

| Wave | Feature | Priority |
|------|---------|----------|
| Wave 1 | Document Formatter (.docx upload, formatting, presets) | P0 - Critical |
| Wave 2 | Analytics (student progress, assessment breakdown) | P1 - High |
| Wave 3 | Data Export/Import (JSON backup) | P2 - Medium |
| Wave 4 | Google Drive Sync | P3 - Nice-to-have |
