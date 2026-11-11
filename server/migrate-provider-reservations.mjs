import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createPostgresPool } from "./postgres-store.js";

const migration = "002-provider-reservations";
const sql = await readFile(new URL("./migrations/002-provider-reservations.sql", import.meta.url), "utf8");
const checksum = createHash("sha256").update(sql).digest("hex");
const pool = createPostgresPool(process.env);
if (!pool) throw new Error("DATABASE_URL is required");
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(hashtext('faithai:migrations'))");
  const existing = await client.query("SELECT checksum FROM faithai_migrations WHERE migration_id = $1", [migration]);
  if (existing.rows[0] && existing.rows[0].checksum !== checksum) throw new Error("Applied migration checksum changed");
  if (!existing.rows[0]) {
    await client.query(sql);
    await client.query("INSERT INTO faithai_migrations (migration_id, checksum) VALUES ($1, $2)", [migration, checksum]);
  }
  await client.query("COMMIT");
  console.log(JSON.stringify({ migration, checksum, status: existing.rows[0] ? "already-applied" : "applied" }));
} catch (error) { await client.query("ROLLBACK"); throw error; }
finally { client.release(); await pool.end(); }
