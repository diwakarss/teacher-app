# Phase 3 Implementation Plan — Generation

## Overview

| Attribute | Value |
|-----------|-------|
| Phase | 03-generation |
| Version | v001 |
| Status | Draft |
| Estimated Waves | 4 |

## Wave Structure

### Wave 1: Database & API Foundation
**Goal:** Add tables, migrations, and Bedrock API route

| Task | File | Description |
|------|------|-------------|
| T1.1 | `src/lib/db/schema.ts` | Add `lesson_plans` and `question_papers` tables |
| T1.2 | `src/lib/db/database.ts` | Add migrations for new tables |
| T1.3 | `package.json` | Add `@aws-sdk/client-bedrock-runtime` dependency |
| T1.4 | `src/app/api/generate/route.ts` | Create Bedrock Converse API route handler |
| T1.5 | `src/lib/prompts/lesson-plan-prompt.ts` | Lesson plan prompt template |
| T1.6 | `src/lib/prompts/question-paper-prompt.ts` | Question paper prompt template |
| T1.7 | `.env.example` | Document AWS environment variables |

**Verification:**
- [ ] TypeScript compiles without errors
- [ ] Migration creates tables successfully
- [ ] API route responds to POST requests (mock test)

### Wave 2: Lesson Plan Generation
**Goal:** Full lesson plan generation flow

| Task | File | Description |
|------|------|-------------|
| T2.1 | `src/services/lesson-plan-service.ts` | CRUD + generate operations |
| T2.2 | `src/stores/generation-store.ts` | Zustand store for generation state |
| T2.3 | `src/app/(app)/generate/lesson-plan/page.tsx` | Generator form page |
| T2.4 | `src/components/generate/lesson-plan-form.tsx` | Chapter select, duration input |
| T2.5 | `src/components/generate/generation-preview.tsx` | Preview with edit mode |
| T2.6 | `src/app/(app)/generate/lesson-plan/[id]/page.tsx` | View/edit saved plan |
| T2.7 | `src/components/layout/bottom-nav.tsx` | Add Generate nav item |

**Verification:**
- [ ] Can select chapter and generate lesson plan
- [ ] Generated plan displays in preview
- [ ] Can edit and save plan
- [ ] Saved plans persist to database

### Wave 3: Question Paper Generation
**Goal:** Full question paper generation flow with templates

| Task | File | Description |
|------|------|-------------|
| T3.1 | `src/services/question-paper-service.ts` | CRUD + generate + templates |
| T3.2 | `src/lib/question-templates.ts` | Preset templates (Unit Test, Monthly, Term) |
| T3.3 | `src/app/(app)/generate/question-paper/page.tsx` | Generator form page |
| T3.4 | `src/components/generate/question-paper-form.tsx` | Multi-chapter select, marks, template |
| T3.5 | `src/components/generate/template-selector.tsx` | Template picker with preview |
| T3.6 | `src/app/(app)/generate/question-paper/[id]/page.tsx` | View/edit saved paper |
| T3.7 | `src/components/generate/answer-key-view.tsx` | Answer key display component |

**Verification:**
- [ ] Can select chapters and set total marks
- [ ] Templates prefill section distribution
- [ ] Can adjust distribution before generation
- [ ] Answer key generated and viewable separately

### Wave 4: Export & Polish
**Goal:** PDF export, error handling, offline messaging

| Task | File | Description |
|------|------|-------------|
| T4.1 | `src/components/generate/pdf-export-button.tsx` | Browser print trigger |
| T4.2 | `src/styles/print.css` | Print-specific styles |
| T4.3 | `src/components/generate/offline-message.tsx` | Offline state component |
| T4.4 | Error handling | Toast messages for API failures |
| T4.5 | Loading states | Skeleton loaders for generation pages |
| T4.6 | `src/lib/prompts/*.test.ts` | Unit tests for prompt generation |
| T4.7 | `src/services/*.test.ts` | Service layer tests |

**Verification:**
- [ ] PDF export produces clean document
- [ ] Offline users see clear message
- [ ] API errors handled gracefully
- [ ] All tests pass

## Dependencies

```json
{
  "@aws-sdk/client-bedrock-runtime": "^3.x"
}
```

## New Files Summary

```
src/
├── app/
│   ├── api/generate/
│   │   └── route.ts
│   └── (app)/generate/
│       ├── lesson-plan/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       └── question-paper/
│           ├── page.tsx
│           └── [id]/page.tsx
├── components/generate/
│   ├── lesson-plan-form.tsx
│   ├── question-paper-form.tsx
│   ├── generation-preview.tsx
│   ├── template-selector.tsx
│   ├── answer-key-view.tsx
│   ├── pdf-export-button.tsx
│   └── offline-message.tsx
├── services/
│   ├── lesson-plan-service.ts
│   └── question-paper-service.ts
├── stores/
│   └── generation-store.ts
├── lib/
│   ├── prompts/
│   │   ├── lesson-plan-prompt.ts
│   │   └── question-paper-prompt.ts
│   └── question-templates.ts
└── styles/
    └── print.css
```

## Modified Files

| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Add lesson_plans, question_papers tables |
| `src/lib/db/database.ts` | Add migrations |
| `src/components/layout/bottom-nav.tsx` | Add Generate nav |
| `package.json` | Add AWS SDK |
| `.env.example` | Add AWS variables |

## Environment Variables

```bash
# AWS Bedrock Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

## Acceptance Criteria

1. [ ] Teacher can generate lesson plan from chapter in < 30 seconds
2. [ ] Teacher can generate question paper with marks distribution in < 2 minutes
3. [ ] Preset templates work with adjustable distribution
4. [ ] Generated content is editable before saving
5. [ ] Content persists to database
6. [ ] PDF export produces print-ready document
7. [ ] Offline users see clear "requires internet" message
8. [ ] TypeScript clean, build succeeds, tests pass

## Quality Gates

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
- [ ] Manual test: generate lesson plan, verify content
- [ ] Manual test: generate question paper, verify sections
- [ ] Manual test: PDF export, verify formatting
- [ ] Manual test: offline behavior

## Rollback Plan

If issues arise:
1. Revert to Phase 2 state (all changes in feature branch)
2. No data migration needed (new tables only)
3. AWS SDK can be removed cleanly
4. No breaking changes to existing functionality

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Bedrock latency | Use Haiku (fast), show loading state |
| AWS auth issues | Clear error messages, env var validation |
| Poor generation | Allow editing, iterate prompts |
| Large chapters | Truncate content to 50K tokens |

---
*Plan v001 — Phase 3 Generation*
