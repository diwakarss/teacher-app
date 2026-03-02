# Testing Strategy — Teacher Assistant PWA

## Overview

Multi-layer testing strategy with focus on offline functionality and data integrity.

## Test Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit | Vitest | Functions, hooks, components |
| Integration | Vitest + Testing Library | Component interactions |
| E2E | Playwright | User workflows, offline testing |

## Test Categories

### Unit Tests

Focus areas:
- Grade calculation (IGCSE boundaries)
- Feedback template generation
- Data validation
- Utility functions

```typescript
// lib/utils/__tests__/gradeCalculator.test.ts
describe('calculateIGCSEGrade', () => {
  test.each([
    [100, 'A*'],
    [90, 'A*'],
    [89, 'A'],
    [80, 'A'],
    [70, 'B'],
    [60, 'C'],
    [50, 'D'],
    [40, 'E'],
    [30, 'F'],
    [20, 'G'],
    [19, 'U'],
    [0, 'U'],
  ])('returns %s for %d%%', (percentage, grade) => {
    expect(calculateIGCSEGrade(percentage)).toBe(grade);
  });
});
```

### Component Tests

Focus areas:
- Form validation
- User interactions
- State updates
- Error handling

```typescript
// components/__tests__/StudentForm.test.tsx
describe('StudentForm', () => {
  it('validates required fields', async () => {
    render(<StudentForm onSubmit={mockSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
  });
});
```

### E2E Tests

Focus areas:
- Complete user workflows
- Offline functionality
- PWA installation
- Data persistence

```typescript
// tests/e2e/marks-entry.spec.ts
test('enter marks for class offline', async ({ page }) => {
  // Go offline
  await page.context().setOffline(true);

  // Navigate to marks entry
  await page.goto('/marks');

  // Enter marks
  await page.fill('[data-testid="student-1-marks"]', '85');
  await page.click('button:has-text("Save")');

  // Verify saved
  await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
});
```

## Coverage Targets

| Category | Target | Rationale |
|----------|--------|-----------|
| Grade calculation | 100% | Critical business logic |
| Data services | 90% | Core functionality |
| Components | 80% | UI logic |
| E2E workflows | 5 critical paths | User journeys |

## Critical Test Paths

1. **Create class → Add students → Enter marks → View grades**
2. **Generate feedback for student → Copy to clipboard**
3. **Work offline → Reconnect → Verify data persisted**
4. **Install PWA → Launch from home screen**
5. **Bulk student import → Verify all added**

## Test Data

Use factories for consistent test data:

```typescript
// tests/factories/student.ts
export const createStudent = (overrides?: Partial<Student>): Student => ({
  id: crypto.randomUUID(),
  name: 'Test Student',
  rollNumber: '001',
  classId: 'class-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
```

---
*Testing strategy for Phase 1 MVP*
