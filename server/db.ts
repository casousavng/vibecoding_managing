import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";
import fs from "fs";

const configPath = path.join(process.cwd(), "server", "db_config.json");
let dbConfig = { sqlitePath: "server/sqlite.db" };

if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (config.sqlitePath) {
      dbConfig.sqlitePath = config.sqlitePath;
    }
  } catch (e) {
    console.error("Failed to read db_config.json, using default path");
  }
}

// Ensure the path is absolute or relative to cwd
const dbPath = path.isAbsolute(dbConfig.sqlitePath)
  ? dbConfig.sqlitePath
  : path.join(process.cwd(), dbConfig.sqlitePath);

// Fallback to local if server folder is current (legacy check, might not be needed but keeping for safety)
const finalDbPath = process.cwd().endsWith("server") ? "sqlite.db" : dbPath;

const sqlite = new Database(finalDbPath);

export const db = drizzle(sqlite, {
  schema,
  casing: "snake_case"
});
