# Coding Conventions

**Analysis Date:** 2026-03-02

## Naming Patterns

**Files:**
- Components: `kebab-case.tsx` (e.g., `class-form-dialog.tsx`, `marks-entry-grid.tsx`)
- Services: `kebab-case.ts` (e.g., `class-service.ts`)
- Stores: `kebab-case.ts` (e.g., `class-store.ts`)
- Pages: `page.tsx` (Next.js App Router convention)
- Layouts: `layout.tsx`
- Tests: `*.test.ts` (co-located with source)

**Functions:**
- camelCase for all functions
- Async operations: `loadX`, `createX`, `updateX`, `deleteX`
- Handlers: `handleX` (e.g., `handleSave`, `handleClassChange`)
- Getters: `getX`, `getXById`
- Calculations: `calculateX` (e.g., `calculateIGCSEGrade`)

**Variables:**
- camelCase for variables and state
- Boolean flags: `isX`, `hasX` (e.g., `isOnline`, `hasChanges`)
- Loading states: `loading`, `generating`, `saving`

**Types:**
- PascalCase for types and interfaces
- Entity types: `Class`, `Student`, `Assessment`, `Mark`, `Feedback`
- State interfaces: `ClassState`, `StudentState`
- Export `type` keyword for type-only exports

**Constants:**
- SCREAMING_SNAKE_CASE
- Examples: `IGCSE_GRADES`, `ASSESSMENT_TYPES`, `FEEDBACK_TONES`

## Code Style

**Formatting:**
- No explicit Prettier config (uses defaults)
- 2-space indentation (from editor)
- Single quotes for imports
- Semicolons required

**Linting:**
- ESLint with `eslint-config-next` (core-web-vitals + TypeScript)
- Config: `eslint.config.mjs`
- Ignores: `.next/`, `out/`, `build/`

## Import Organization

**Order (observed pattern):**
1. React/Next.js imports
2. External libraries (ui components, icons)
3. Internal aliases (`@/stores/`, `@/services/`, `@/components/`)
4. Relative imports
5. Type-only imports (using `type` keyword)

**Example:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useClassStore } from '@/stores/class-store';
import { classService } from '@/services/class-service';
import { toast } from 'sonner';
import type { Class } from '@/lib/db/schema';
```

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Always use `@/` for non-relative imports

## Error Handling

**Patterns:**
- Try-catch in async store methods
- Set `error: string | null` state
- Log with `console.error('Failed to X:', error)`
- Toast notifications for user feedback

```typescript
try {
  await someOperation();
  toast.success('Operation completed');
} catch (error) {
  console.error('Failed to perform operation:', error);
  set({ error: (error as Error).message, loading: false });
  toast.error('Failed to perform operation');
  throw error;
}
```

## Logging

**Framework:** console (no structured logging)

**Patterns:**
- `console.error()` for failures
- `console.warn()` for fallbacks
- No debug logging in production code

## Comments

**When to Comment:**
- SQL query structure in services
- Complex business logic (grade boundaries)
- Type casting explanations

**JSDoc/TSDoc:**
- Not used extensively
- Types provide documentation via Drizzle schema

## Function Design

**Size:** Generally under 50 lines, larger for pages

**Parameters:**
- Destructure props in components
- Use object parameters for 3+ args

**Return Values:**
- Explicit return types on exported functions
- Use `Promise<X>` for async

## Module Design

**Exports:**
- Services export object with methods
- Stores export hook (via `create()`)
- Components export named function

**Service Pattern:**
```typescript
export const xxxService = {
  async getAll(): Promise<X[]> { ... },
  async getById(id: string): Promise<X | null> { ... },
  async create(data: NewX): Promise<X> { ... },
  async update(id: string, data: Partial<X>): Promise<X> { ... },
  async delete(id: string): Promise<void> { ... },
};
```

**Store Pattern:**
```typescript
export const useXxxStore = create<XxxState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  loadItems: async () => { ... },
  createItem: async (data) => { ... },
}));
```

**Component Pattern:**
```typescript
'use client';

interface XxxProps {
  prop1: string;
  prop2: number;
}

export function Xxx({ prop1, prop2 }: XxxProps) {
  // hooks first
  // derived state
  // handlers
  // render
}
```

## Database Conventions

**Column Names:** snake_case in SQL
**TypeScript:** camelCase (Drizzle maps automatically)

**Standard Columns:**
- `id`: UUID as TEXT PRIMARY KEY
- `created_at`: ISO timestamp TEXT
- `updated_at`: ISO timestamp TEXT

**Prepared Statements:**
- Always use parameterized queries
- Always call `stmt.free()` after use
- Persist after mutations: `await persistDb()`

```typescript
const stmt = db.prepare('SELECT * FROM x WHERE id = ?');
stmt.bind([id]);
if (stmt.step()) {
  const row = stmt.get();
  // process
}
stmt.free();
```

## Component Conventions

**Client Components:**
- Add `'use client';` directive at top
- All components using hooks, state, or browser APIs

**UI Components (shadcn/ui):**
- Use `data-slot` attribute for styling targets
- Use `cn()` utility for class merging
- Variants via `class-variance-authority`

**Form Components:**
- Controlled inputs via useState
- Submit handlers as async functions
- Toast for success/error feedback

## Git Conventions

**Commit Format:** `type(scope): message`

**Types:** feat, fix, docs, style, refactor, test, chore

**Examples from history:**
- `feat(wave6): polish with loading skeletons and error handling`
- `feat(wave5): feedback generation with AI and templates`
- `fix(wave2): sql.js prepared statements and class switcher navigation`

---

*Convention analysis: 2026-03-02*
