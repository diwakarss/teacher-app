import { drizzle } from 'drizzle-orm/sql-js';
import { getDb } from './database';
import * as schema from './schema';

let drizzleInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export async function getDrizzle() {
  if (drizzleInstance) {
    return drizzleInstance;
  }

  const db = await getDb();
  drizzleInstance = drizzle(db, { schema });
  return drizzleInstance;
}

export { schema };
