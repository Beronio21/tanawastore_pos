import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

export type Database = NeonDatabase<typeof schema>;

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

// `neon-serverless` uses WebSockets; `ws` is required outside the browser/edge.
neonConfig.webSocketConstructor = ws;

let cached: { pool: Pool; db: Database } | null = null;

/**
 * Lazily create the Drizzle client so CI without DATABASE_URL never connects.
 * Uses Neon's pooled `-pooler` endpoint via a WebSocket Pool so interactive
 * `db.transaction()` calls (receipt sync, onboarding) are supported.
 */
export function getDb(): Database | null {
  if (!process.env.DATABASE_URL) return null;
  if (!cached) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    cached = { pool, db: drizzle(pool, { schema }) };
  }
  return cached.db;
}

export { schema };
