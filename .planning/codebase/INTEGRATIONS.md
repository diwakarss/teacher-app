# Integrations — Teacher Assistant PWA

## External Services

### Claude API (Online Only)

**Purpose**: Enhanced feedback message generation

**Integration Point**: `services/feedback.ts`

**Fallback**: Template-based generation when offline

```typescript
// services/feedback.ts
export async function generateFeedback(
  student: Student,
  assessment: Assessment,
  marks: number
): Promise<string> {
  if (!navigator.onLine) {
    return generateTemplateFeedback(student, assessment, marks);
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: buildFeedbackPrompt(student, assessment, marks)
      }]
    });
    return response.content[0].text;
  } catch (error) {
    // Fallback to template on API error
    return generateTemplateFeedback(student, assessment, marks);
  }
}
```

**API Key Management**:
- Stored in environment variable `ANTHROPIC_API_KEY`
- For PWA: API calls proxied through Next.js API route
- Never expose key to client

### Browser APIs

| API | Purpose | Fallback |
|-----|---------|----------|
| IndexedDB | sql.js persistence | localStorage (limited) |
| Service Worker | Offline caching | Online-only mode |
| Clipboard | Copy feedback | Manual select/copy |
| Share | Share feedback | Copy to clipboard |

## Internal Integrations

### Database Layer (sql.js)

```typescript
// lib/db/client.ts
import initSqlJs from 'sql.js';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: file => `/sql.js/${file}`
  });

  // Load from IndexedDB or create new
  const saved = await loadFromIndexedDB();
  db = saved ? new SQL.Database(saved) : new SQL.Database();

  // Run migrations
  await runMigrations(db);

  return db;
}
```

### State Sync (Zustand → SQLite)

```typescript
// lib/store/useClassStore.ts
export const useClassStore = create<ClassStore>((set, get) => ({
  classes: [],

  loadClasses: async () => {
    const db = await getDb();
    const classes = db.exec('SELECT * FROM classes');
    set({ classes: parseClasses(classes) });
  },

  addClass: async (classData) => {
    const db = await getDb();
    db.run('INSERT INTO classes ...', [/* values */]);
    await persistToIndexedDB(db);
    get().loadClasses();
  },
}));
```

## No External Integrations (Phase 1)

The following are explicitly out of scope:

- School management systems
- Parent notification services (SMS/WhatsApp)
- Cloud storage providers
- Authentication providers
- Analytics services

---
*Integration map for Phase 1 MVP*
