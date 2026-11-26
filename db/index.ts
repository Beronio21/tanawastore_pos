import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Database = NeonHttpDatabase<typeof schema>;

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let cached: Database | null = null;

/** Lazily create the Drizzle client so CI without DATABASE_URL never connects. */
export function getDb(): Database | null {
  if (!process.env.DATABASE_URL) return null;
  if (!cached) {
    const sql = neon(process.env.DATABASE_URL);
    cached = drizzle(sql, { schema });
  }
  return cached;
}

export { schema };
