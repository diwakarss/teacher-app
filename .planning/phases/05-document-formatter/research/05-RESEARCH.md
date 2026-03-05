---
phase: 05-document-formatter
generated: 2026-03-05T18:45:00Z
mode: lean

patterns_suggested:
  - name: "Dual-Width Table Pattern"
    category: "frontend"
    confidence: "HIGH"
    suggested_for: "Table generation with docx library"
  - name: "XML-Level Modification"
    category: "architecture"
    confidence: "MEDIUM"
    suggested_for: "Preserving existing document structure while modifying table properties"
---

# Phase 5: Table Auto-Formatter - Research

**Date:** 2026-03-05
**Confidence:** HIGH

## Summary

Researched table auto-formatting for Word documents. The docx library (v9.6.0, already installed) supports table creation with explicit column widths and vertical alignment. However, it cannot parse existing tables from uploaded documents. A hybrid approach is needed: JSZip for XML-level table property modification (preserves content), or full table reconstruction using docx library (cleaner but lossy).

## Current Implementation State

| Component | Status | Notes |
|-----------|--------|-------|
| doc-formatter.ts | Exists | No table handling, uses mammoth for parsing |
| document-formatter.tsx | Exists | Upload/preview UI, preset management |
| mammoth | Installed | Converts to HTML, loses table structure |
| docx | v9.6.0 | Table creation only, no parsing |
| JSZip | Not installed | Needed for XML-level modification |

## Standard Stack

| Library | Version | Purpose |
|---------|---------|---------|
| docx | 9.6.0 | Table generation with explicit widths |
| jszip | ^3.10 | Read/modify document.xml directly |
| mammoth | 1.11.0 | Preview only (loses table structure) |
| file-saver | 2.0.5 | Download formatted document |

## Key Patterns

| Pattern | When to Use |
|---------|-------------|
| Dual-Width Tables | Always set both table `width` and cell `width` properties |
| WidthType.DXA | Always use DXA (twips), never PERCENTAGE |
| XML Modification | When preserving all existing content/formatting |
| Full Reconstruction | When complete table control is needed |

## Column Width Specification

Target widths based on user requirements:

| Column | Content | Recommended Width (twips) |
|--------|---------|---------------------------|
| Day/Date | "Wednesday" | 1440 (1 inch) |
| Subject | Single word, wrap 2-word | 1800 (~1.25 inch) |
| Content | Remaining space | 6120 (flex to fill) |
| **Total** | US Letter - 1" margins | 9360 twips |

## Pitfalls

| Pitfall | Prevention |
|---------|------------|
| mammoth loses table structure | Use JSZip to read document.xml directly |
| PERCENTAGE width breaks Google Docs | Always use WidthType.DXA |
| columnWidths must sum to table width | Calculate: table width = sum of columnWidths |
| Cell width must match columnWidth | Set both values identically |
| JSZip 3.x encoding issues | Use UTF-8 consistently for special characters |

## Architecture Decision

**Recommended: Hybrid JSZip Approach**

1. Parse uploaded .docx with JSZip
2. Extract `word/document.xml`
3. Modify table XML properties in place:
   - `<w:tcW>` for cell widths
   - `<w:vAlign>` for vertical alignment
   - `<w:trHeight>` for row heights
4. Repackage with JSZip
5. Download modified document

**Why:** Preserves all existing formatting, fonts, borders, content. Only modifies targeted properties.

**Alternative (Full Reconstruction):** Parse tables with regex/DOM, rebuild with docx library. Cleaner code but risks content loss.

## UI Changes Required

| Component | Change |
|-----------|--------|
| document-formatter.tsx | Add "Auto-format tables" checkbox |
| doc-formatter.ts | Add `formatTables()` function |

## Open Questions

1. Should table detection be automatic or require user confirmation?
2. Handle edge case: documents with no tables?
3. Handle edge case: nested tables?

## Sources

| Source | Confidence |
|--------|------------|
| [docx.js Tables Documentation](https://github.com/dolanmiu/docx/blob/master/docs/usage/tables.md) | HIGH |
| [Anthropic docx SKILL.md](https://github.com/anthropics/skills/blob/main/skills/docx/SKILL.md) | HIGH |
| [Microsoft Open XML Tables](https://learn.microsoft.com/en-us/office/open-xml/word/working-with-wordprocessingml-tables) | HIGH |
| [docx.js ITableOptions API](https://docx.js.org/api/types/ITableOptions.html) | HIGH |
| [JSZip Documentation](https://stuk.github.io/jszip/) | HIGH |
