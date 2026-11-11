#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sql = await readFile(path.join(root, "server", "schema.sql"), "utf8");
const checksum = createHash("sha256").update(sql).digest("hex");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: String(process.env.FAITHAI_DB_SSL || "false").toLowerCase() === "true" ? { rejectUnauthorized: true } : false });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query("CREATE TABLE IF NOT EXISTS faithai_migrations (migration_id text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
  const existing = await client.query("SELECT checksum FROM faithai_migrations WHERE migration_id = $1", ["001-vps-schema"]);
  if (existing.rows[0]?.checksum && existing.rows[0].checksum !== checksum) throw new Error("Migration 001-vps-schema changed after it was applied; add a new migration instead");
  if (existing.rows[0]?.checksum === checksum) {
    await client.query("COMMIT");
    console.log(JSON.stringify({ event: "faithai.migration.already_applied", migration: "001-vps-schema", checksum }));
    process.exitCode = 0;
  } else {
    await client.query(sql);
    await client.query("INSERT INTO faithai_migrations (migration_id, checksum) VALUES ($1, $2)", ["001-vps-schema", checksum]);
    await client.query("COMMIT");
    console.log(JSON.stringify({ event: "faithai.migration.applied", migration: "001-vps-schema", checksum }));
  }
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
