import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const migrationsDirectory = resolve("database/migrations");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run migrations");
}

const client = new Client({
  connectionString,
  application_name: "resolveai-migrations"
});

await client.connect();

try {
  await client.query("SELECT pg_advisory_lock(hashtext('resolveai_migrations'))");
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const names = (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const name of names) {
    const sql = await readFile(resolve(migrationsDirectory, name), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const applied = await client.query(
      "SELECT checksum FROM schema_migrations WHERE name = $1",
      [name]
    );

    if (applied.rows[0]) {
      if (applied.rows[0].checksum !== checksum) {
        throw new Error(`Applied migration ${name} has changed`);
      }
      console.info(`skip ${name}`);
      continue;
    }

    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)",
        [name, checksum]
      );
      await client.query("COMMIT");
      console.info(`apply ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.query("SELECT pg_advisory_unlock(hashtext('resolveai_migrations'))");
  await client.end();
}
