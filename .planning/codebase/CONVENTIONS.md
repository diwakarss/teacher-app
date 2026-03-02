# Conventions — Teacher Assistant PWA

## Code Style

### TypeScript

- Strict mode enabled
- Explicit return types for exported functions
- Prefer `interface` over `type` for object shapes
- Use `const` assertions for literals

```typescript
// Good
interface Student {
  id: string;
  name: string;
  rollNumber: string;
}

// Avoid
type Student = {
  id: string;
  name: string;
  rollNumber: string;
};
```

### React

- Functional components only
- Use `'use client'` directive for client components
- Prefer server components where possible
- Colocate component styles with components

```typescript
// Good
'use client';

export function ClassCard({ class }: { class: Class }) {
  return <Card>...</Card>;
}
```

### Naming

| Item | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `StudentList` |
| Hooks | camelCase + `use` | `useStudents` |
| Functions | camelCase | `calculateGrade` |
| Constants | SCREAMING_SNAKE | `IGCSE_GRADES` |
| Types/Interfaces | PascalCase | `Assessment` |
| Files (components) | PascalCase | `ClassCard.tsx` |
| Files (utilities) | camelCase | `gradeCalculator.ts` |

### Imports

Order:
1. React/Next.js
2. External libraries
3. Internal aliases (`@/`)
4. Relative imports
5. Types (last)

```typescript
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useClasses } from '@/lib/hooks/useClasses';

import { ClassCard } from './ClassCard';

import type { Class } from '@/types';
```

## Database

### Schema Conventions

- Use `snake_case` for database columns
- Use `camelCase` in TypeScript (Drizzle maps automatically)
- Always include `id`, `createdAt`, `updatedAt`
- Use UUIDs for primary keys

```typescript
export const students = sqliteTable('students', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  rollNumber: text('roll_number').notNull(),
  classId: text('class_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

## Testing

- Unit tests in `tests/unit/`
- E2E tests in `tests/e2e/`
- Test file naming: `*.test.ts` or `*.spec.ts`
- Use descriptive test names

```typescript
describe('gradeCalculator', () => {
  it('returns A* for percentage >= 90', () => {
    expect(calculateGrade(95)).toBe('A*');
  });
});
```

## Git

- Conventional commits: `type(scope): message`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Keep commits atomic

```
feat(students): add student search by name
fix(grades): correct IGCSE boundary for grade B
```

---
*Conventions for new development*
