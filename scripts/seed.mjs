import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const seedsDirectory = resolve("database/seeds");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const client = new Client({
  connectionString,
  application_name: "resolveai-seeds"
});

await client.connect();

try {
  const names = (await readdir(seedsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const name of names) {
    const sql = await readFile(resolve(seedsDirectory, name), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("COMMIT");
      console.info(`seed ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.end();
}
