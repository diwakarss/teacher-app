# Tech Stack — Teacher Assistant PWA

## Frontend

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | Next.js | 14.x | App Router, SSG, PWA support |
| Runtime | React | 18.x | UI components |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| Components | shadcn/ui | latest | Pre-built accessible components |
| Icons | Lucide React | latest | Icon library |

## State & Data

| Layer | Technology | Purpose |
|-------|------------|---------|
| State | Zustand | Lightweight global state |
| Database | sql.js | SQLite in WASM (browser) |
| Persistence | IndexedDB | sql.js storage backend |
| Schema | Drizzle ORM | Type-safe SQL queries |

## PWA

| Layer | Technology | Purpose |
|-------|------------|---------|
| Service Worker | Workbox | Offline caching strategies |
| Manifest | next-pwa | PWA manifest generation |
| Icons | PWA Asset Generator | App icons for all platforms |

## AI (Online Features)

| Layer | Technology | Purpose |
|-------|------------|---------|
| LLM | Claude API | Enhanced feedback generation |
| SDK | @anthropic-ai/sdk | API client |

## Build & Dev

| Tool | Purpose |
|------|---------|
| pnpm | Package manager |
| ESLint | Linting |
| Prettier | Formatting |
| Vitest | Unit testing |
| Playwright | E2E testing |

---
*Greenfield project — no existing stack*
