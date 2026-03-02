# Architecture — Teacher Assistant PWA

## Overview

Offline-first Progressive Web App using Next.js 14 with local SQLite database. All data stored on-device; AI features require network.

## Architecture Pattern

**Local-First with Optional Cloud Enhancement**

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Next.js   │  │   Zustand   │  │    sql.js       │ │
│  │   App       │──│   Store     │──│   (SQLite)      │ │
│  │   Router    │  │             │  │                 │ │
│  └─────────────┘  └─────────────┘  └────────┬────────┘ │
│         │                                    │          │
│         │              ┌─────────────────────┘          │
│         │              ▼                                │
│  ┌──────┴──────┐  ┌─────────────┐                      │
│  │   Service   │  │  IndexedDB  │                      │
│  │   Worker    │  │  (persist)  │                      │
│  └─────────────┘  └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
         │ (online only)
         ▼
┌─────────────────┐
│   Claude API    │
│   (feedback)    │
└─────────────────┘
```

## Directory Structure

```
teacher-app/
├── app/                    # Next.js App Router
│   ├── (app)/             # Main app routes (authenticated context)
│   │   ├── classes/       # Class management
│   │   ├── students/      # Student management
│   │   ├── marks/         # Marks entry
│   │   └── feedback/      # Feedback generation
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing/dashboard
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── forms/             # Form components
│   └── layout/            # Layout components
├── lib/
│   ├── db/                # Database layer
│   │   ├── schema.ts      # Drizzle schema
│   │   ├── client.ts      # sql.js client
│   │   └── migrations/    # Schema migrations
│   ├── store/             # Zustand stores
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Utility functions
├── services/
│   ├── class.ts           # Class CRUD operations
│   ├── student.ts         # Student CRUD operations
│   ├── assessment.ts      # Assessment operations
│   ├── marks.ts           # Marks operations
│   └── feedback.ts        # Feedback generation
├── types/                 # TypeScript types
├── public/
│   └── manifest.json      # PWA manifest
└── next.config.js         # Next.js config with PWA
```

## Data Flow

### Offline Operations (Class/Student/Marks CRUD)

```
User Action → React Component → Zustand Store → Service Layer → sql.js → IndexedDB
                                     ↑                              │
                                     └──────────────────────────────┘
                                           (read back to store)
```

### Online Operations (AI Feedback)

```
User Action → React Component → Service Layer → Claude API → Response
                                     │                          │
                                     └──────────────────────────┘
                                        (fallback to templates if offline)
```

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | sql.js (WASM) | True offline, no server needed |
| State | Zustand | Simple, performant, good DX |
| ORM | Drizzle | Type-safe, SQL-native, lightweight |
| UI | shadcn/ui | Accessible, customizable, Tailwind-native |
| Feedback | Hybrid | Templates offline, Claude online |

## IGCSE Grade Boundaries

Implemented as pure function, no network required:

| Grade | Percentage Range |
|-------|------------------|
| A* | 90-100 |
| A | 80-89 |
| B | 70-79 |
| C | 60-69 |
| D | 50-59 |
| E | 40-49 |
| F | 30-39 |
| G | 20-29 |
| U | 0-19 |

---
*Greenfield architecture design*
