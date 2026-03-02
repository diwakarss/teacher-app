# Project Structure — Teacher Assistant PWA

## Greenfield Structure

This is a new project. The structure below is the target architecture.

```
teacher-app/
├── .planning/              # Project planning artifacts
│   ├── PROJECT.md
│   ├── ROADMAP.md
│   ├── STATE.md
│   ├── DECISIONS.md
│   ├── config.json
│   ├── codebase/          # Architecture docs
│   └── phases/            # Phase artifacts
│       └── 01-mvp/
├── REQUIREMENTS.md         # User requirements
├── CLAUDE.md              # AI assistant instructions
├── README.md              # Project readme
├── package.json           # Dependencies
├── pnpm-lock.yaml         # Lock file
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
├── drizzle.config.ts      # Drizzle ORM configuration
├── vitest.config.ts       # Vitest configuration
├── playwright.config.ts   # Playwright configuration
├── app/                   # Next.js App Router
├── components/            # React components
├── lib/                   # Core library code
├── services/              # Business logic
├── types/                 # TypeScript types
├── public/                # Static assets
└── tests/                 # Test files
    ├── unit/
    └── e2e/
```

## Key Directories

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `app/` | Next.js routes | `page.tsx`, `layout.tsx` |
| `components/ui/` | shadcn/ui components | Button, Card, Dialog, etc. |
| `lib/db/` | Database layer | `schema.ts`, `client.ts` |
| `lib/store/` | Zustand stores | `useClassStore.ts`, etc. |
| `services/` | Business logic | `class.ts`, `student.ts` |
| `types/` | TypeScript types | `class.ts`, `student.ts` |

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| React components | PascalCase | `ClassCard.tsx` |
| Hooks | camelCase with `use` prefix | `useClasses.ts` |
| Services | camelCase | `classService.ts` |
| Types | PascalCase | `Class.ts` |
| Utilities | camelCase | `gradeCalculator.ts` |
| Routes | lowercase with dashes | `classes/[id]/page.tsx` |

---
*Target structure for greenfield project*
