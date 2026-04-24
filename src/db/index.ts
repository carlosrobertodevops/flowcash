import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://flowcash:flowcash@localhost:5432/flowcash";

const globalForDb = globalThis as unknown as {
  pool?: Pool;
};

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });
