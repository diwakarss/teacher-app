# Architecture Violations

## Status

**Greenfield project** — no existing code to scan.

## Baseline

No violations detected. This is a new project starting from scratch.

## Pre-Build Considerations

Architecture patterns to enforce from the start:

1. **Layer Separation**: Keep UI, business logic, and data access in separate directories
2. **No Circular Dependencies**: Services should not import from components
3. **Single Source of Truth**: Database is the source; Zustand mirrors for reactivity
4. **Type Safety**: All database operations go through typed Drizzle schema

---
*Scanned: 2026-03-02*
