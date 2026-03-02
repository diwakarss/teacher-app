# Testing Patterns

**Analysis Date:** 2026-03-02

## Test Framework

**Runner:**
- Vitest 4.0.18
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in (`expect`)
- `@testing-library/jest-dom` matchers (toBeInTheDocument, etc.)

**Run Commands:**
```bash
pnpm test              # Run in watch mode
pnpm test:ci           # Run once (CI mode)
pnpm test:coverage     # Run with v8 coverage
pnpm test:e2e          # Playwright
```

## Test File Organization

**Location:** Co-located with source files

**Naming:** `*.test.ts` or `*.test.tsx`

**Structure:**
```
src/
├── lib/
│   ├── utils.ts
│   ├── utils.test.ts              # Co-located test
│   ├── chapter-detector.ts
│   └── chapter-detector.test.ts   # Co-located test (Phase 2)
├── services/
│   └── marks-service.ts           # No tests yet
└── test/
    ├── setup.ts                   # Vitest setup
    └── test-utils.tsx             # Custom render
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('merges tailwind classes correctly', () => {
    expect(cn('px-4 py-2', 'px-6')).toBe('py-2 px-6');
  });
});
```

**Patterns:**
- `describe()` for grouping related tests
- `it()` or `test()` for individual cases
- Setup: In `src/test/setup.ts`
- Teardown: `afterEach(() => cleanup())` in setup

## Test Setup

**Location:** `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    // ... full mock
  }),
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});
```

## Mocking

**Framework:** Vitest built-in (`vi.mock`, `vi.fn`)

**Current Mocks (in setup.ts):**
- `window.matchMedia` - For responsive components
- `navigator.onLine` - For offline detection

**Patterns:**
```typescript
// Mock a module
vi.mock('@/lib/db/database', () => ({
  getDb: vi.fn(),
  initializeDb: vi.fn(),
  persistDb: vi.fn(),
}));

// Mock a function
const mockSubmit = vi.fn();
```

**What to Mock:**
- Browser APIs (matchMedia, IndexedDB, clipboard)
- Database operations (sql.js)
- External API calls (Claude)
- Heavy dependencies (pdfjs-dist, tesseract.js)

**What NOT to Mock:**
- Pure functions (calculateIGCSEGrade, cn, detectChapters)
- React components (use Testing Library render)

## Custom Render

**Location:** `src/test/test-utils.tsx`

```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

**Usage:**
```typescript
import { render, screen } from '@/test/test-utils';
```

## Fixtures and Factories

**Test Data:** Not yet implemented

**Recommended Pattern:**
```typescript
// test/factories/student.ts
export const createStudent = (overrides?: Partial<Student>): Student => ({
  id: crypto.randomUUID(),
  name: 'Test Student',
  rollNumber: '001',
  classId: 'class-1',
  parentName: null,
  parentPhone: null,
  parentEmail: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});
```

## Coverage

**Requirements:** None enforced currently

**Configuration:**
```typescript
// vitest.config.ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['src/**/*.{ts,tsx}'],
  exclude: ['src/test/**', 'src/**/*.d.ts', 'src/types/**'],
}
```

**View Coverage:**
```bash
pnpm test:coverage
# Opens HTML report in coverage/index.html
```

## Test Types

**Unit Tests:**
- Scope: Pure functions, utilities
- Location: Co-located `*.test.ts`
- Current: `src/lib/utils.test.ts`, `src/lib/chapter-detector.test.ts`

**Integration Tests:**
- Scope: Components with state
- Framework: Testing Library React
- Current: None implemented

**E2E Tests:**
- Framework: Playwright 1.58.2
- Config: Not created yet
- Location: Would be `tests/e2e/`

## Common Patterns

**Testing Pure Functions:**
```typescript
describe('calculateIGCSEGrade', () => {
  it('returns A* for 90%+', () => {
    expect(calculateIGCSEGrade(90, 100)).toBe('A*');
    expect(calculateIGCSEGrade(100, 100)).toBe('A*');
  });

  it('returns U for below 20%', () => {
    expect(calculateIGCSEGrade(19, 100)).toBe('U');
    expect(calculateIGCSEGrade(0, 100)).toBe('U');
  });
});
```

**Testing Components:**
```typescript
import { render, screen } from '@/test/test-utils';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
});
```

**Testing Chapter Detection (Phase 2):**
```typescript
describe('detectChapters', () => {
  it('detects "Chapter X: Title" format', () => {
    const text = `Chapter 1: Introduction
This is the introduction content.

Chapter 2: Getting Started
This is chapter 2 content.`;

    const chapters = detectChapters(text);

    expect(chapters).toHaveLength(2);
    expect(chapters[0].name).toBe('Introduction');
    expect(chapters[0].chapterNumber).toBe(1);
  });

  it('returns empty array for text without chapters', () => {
    const text = `This is just regular text.
No chapter markers here.`;

    const chapters = detectChapters(text);

    expect(chapters).toHaveLength(0);
  });
});
```

## Test Gaps (Current State)

**Tested:**
- `cn()` utility function (3 tests)
- `detectChapters()` function (8 tests) - Phase 2
- `detectChapterFromFilename()` function (6 tests) - Phase 2
- `suggestChapterName()` function (6 tests) - Phase 2

**Not Tested:**
- Services (class, student, assessment, marks, feedback, chapter)
- Stores (all 7 stores)
- Components (all feature components)
- Database operations
- AI integration
- PDF extraction
- OCR processing

## Recommended Testing Priorities

1. **High Priority:**
   - `calculateIGCSEGrade()` - Critical business logic
   - `calculatePerformanceLevel()` - Feedback classification
   - Services CRUD operations (mock db)

2. **Medium Priority:**
   - Store loading/error states
   - Form validation in dialogs
   - Marks entry grid

3. **Lower Priority:**
   - UI components (shadcn/ui mostly pre-tested)
   - E2E workflows
   - PDF/OCR processing (hard to test, low ROI)

---

*Testing analysis: 2026-03-02*
