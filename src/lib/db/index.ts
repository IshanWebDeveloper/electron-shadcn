import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { app } from "electron";
import { syncToRemote } from "./remote/index";
import * as schema from "./schemas/schemas";
import { seedDatabase } from "./seed";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return _db;
}

export async function initDb() {
  const dbPath = app.isPackaged
    ? path.join(app.getPath("userData"), "kito-pos.db")
    : path.join(process.cwd(), "kito-pos-dev.db");

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  _db = drizzle(sqlite, { schema });

  const migrationsFolder = app.isPackaged
    ? path.join(process.resourcesPath, "migrations", "local")
    : path.join(process.cwd(), "src/lib/db/migrations/local");

  try {
    migrate(_db, { migrationsFolder });
    console.log(`[DB] Initialized and Migrated Local SQLite at ${dbPath}`);

    await seedDatabase();

    // Attempt remote sync if possible
    syncToRemote().catch((err) => {
      console.warn("[SYNC] Remote sync failed or remote DB down:", err);
    });
  } catch (error) {
    console.error("[DB] Migration failed for Local SQLite:", error);
  }
}
