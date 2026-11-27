import { defineConfig } from "drizzle-kit";

// drizzle-kit does not auto-load .env.local — load it so `pnpm run db:push` works.
try {
  process.loadEnvFile?.(".env.local");
} catch {
  // DATABASE_URL may be provided by the environment directly.
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
