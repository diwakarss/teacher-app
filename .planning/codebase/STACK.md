# Technology Stack

**Analysis Date:** 2026-03-02

## Languages

**Primary:**
- TypeScript 5.x - All application code (`src/**/*.ts`, `src/**/*.tsx`)
- SQL - Database queries via sql.js

**Secondary:**
- CSS - Tailwind CSS v4 utility classes

## Runtime

**Environment:**
- Node.js (implied by Next.js 16)
- Browser (PWA with IndexedDB persistence)

**Package Manager:**
- pnpm - Primary package manager
- Lockfile: pnpm-lock.yaml (present)

## Frameworks

**Core:**
- Next.js 16.1.6 - App Router with React 19
- React 19.2.3 - UI library
- next-pwa 5.6.0 - Service worker and PWA manifest

**State Management:**
- Zustand 5.0.11 - Client-side state with localStorage persist

**Database:**
- sql.js 1.14.0 - In-browser SQLite (WebAssembly)
- Drizzle ORM 0.45.1 - Schema definitions only (queries use raw SQL)

**UI:**
- Tailwind CSS 4.x - Utility-first styling
- shadcn/ui - Component library via radix-ui 1.4.3
- Lucide React 0.576.0 - Icon library
- sonner 2.0.7 - Toast notifications
- class-variance-authority 0.7.1 - Component variants

**Testing:**
- Vitest 4.0.18 - Unit test runner
- Playwright 1.58.2 - E2E tests (configured in package.json, no config file yet)
- Testing Library React 16.3.2 - Component testing utilities
- jsdom 28.1.0 - DOM environment for tests

**Build/Dev:**
- Webpack - Next.js bundler (via `--webpack` flag in scripts)
- drizzle-kit 0.31.9 - Schema tooling
- ESLint 9.x with eslint-config-next 16.1.6

## Key Dependencies

**Critical (application depends on these):**
- `sql.js` 1.14.0 - SQLite in WebAssembly, core data layer
- `zustand` 5.0.11 - Global state management
- `@anthropic-ai/sdk` 0.78.0 - Installed but using direct fetch instead

**Infrastructure:**
- `clsx` 2.1.1 + `tailwind-merge` 3.5.0 - Class name utilities (`cn()` function)
- `uuid` 13.0.0 - ID generation for all entities
- `next-themes` 0.4.6 - Theme support (installed, unused currently)

## Configuration

**Environment:**
- No `.env` files - Fully client-side application
- API keys stored in localStorage via Zustand persist middleware
- sql.js WASM loaded from CDN: `https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/sql-wasm.wasm`

**Build Configuration:**
- `next.config.ts`: PWA wrapper, WASM headers (`Content-Type: application/wasm`), React strict mode
- `tsconfig.json`: ES2017 target, bundler module resolution, `@/*` path alias to `./src/*`
- `vitest.config.ts`: jsdom environment, v8 coverage, setup in `src/test/setup.ts`
- `eslint.config.mjs`: Next.js core-web-vitals + TypeScript rules

## Platform Requirements

**Development:**
- Node.js with pnpm
- Modern browser with IndexedDB and WebAssembly support

**Production:**
- Static hosting capable platform (Vercel, Netlify, etc.)
- CORS-enabled WASM CDN access (jsdelivr)
- PWA-capable browser for offline support

## Scripts

```bash
pnpm dev              # Start dev server (webpack mode)
pnpm build            # Production build
pnpm start            # Start production server
pnpm test             # Run Vitest in watch mode
pnpm test:ci          # Run tests once
pnpm test:coverage    # Run tests with coverage
pnpm test:e2e         # Run Playwright (no config yet)
pnpm lint             # ESLint check
pnpm typecheck        # TypeScript type check
```

## Version Notes

- Next.js 16 with React 19 is cutting edge (as of analysis date)
- Tailwind CSS 4 (major version)
- Vitest 4 (major version)

---

*Stack analysis: 2026-03-02*
