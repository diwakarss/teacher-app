# Phase 1 Architecture — Teacher Assistant PWA

## Intent

Offline-first PWA with local SQLite database. All core operations work without network. AI feedback is enhanced when online, falls back to templates offline.

## Architecture Diagram

![Architecture](./ARCHITECTURE.svg)

```mermaid
flowchart TD
    subgraph Browser["Browser (PWA)"]
        subgraph UI["UI Layer"]
            Pages["Next.js Pages<br/>Dashboard, Classes, Students, Marks, Feedback"]
            Components["shadcn/ui Components<br/>Forms, Tables, Cards, Dialogs"]
        end

        subgraph State["State Layer"]
            Zustand["Zustand Stores<br/>useClassStore, useStudentStore, useMarksStore"]
        end

        subgraph Data["Data Layer"]
            Services["Services<br/>classService, studentService, marksService, feedbackService"]
            Drizzle["Drizzle ORM<br/>Type-safe queries"]
            SqlJs["sql.js<br/>SQLite WASM"]
        end

        subgraph Storage["Persistence"]
            IndexedDB["IndexedDB<br/>Database file storage"]
            SW["Service Worker<br/>Workbox caching"]
        end
    end

    subgraph External["External (Online Only)"]
        Claude["Claude API<br/>Enhanced feedback"]
    end

    Pages --> Components
    Pages --> Zustand
    Zustand --> Services
    Services --> Drizzle
    Drizzle --> SqlJs
    SqlJs --> IndexedDB
    Services -.->|"online"| Claude
    SW --> Pages
```

## Layer Responsibilities

| Layer | Responsibility | Key Technologies |
|-------|---------------|------------------|
| UI | Render pages, handle user input | Next.js App Router, shadcn/ui |
| State | Reactive state, cache DB reads | Zustand |
| Services | Business logic, orchestration | TypeScript modules |
| Data | Database operations | Drizzle ORM, sql.js |
| Storage | Persistence, offline | IndexedDB, Service Worker |
| External | AI enhancement | Claude API (optional) |

## Data Flow

### Write Path
```
User Input → Component → Store Action → Service → Drizzle → sql.js → IndexedDB
```

### Read Path
```
IndexedDB → sql.js → Drizzle → Service → Store → Component (reactive)
```

### Online Enhancement
```
Service → Check Online → Claude API → Enhanced Response
                     ↓ (offline)
               Template Fallback
```

## Review Notes

*Space for JD feedback during checkpoint review*

---
*Generated: 2026-03-02*
