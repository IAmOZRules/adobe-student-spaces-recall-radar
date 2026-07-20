// Run once against a fresh Neon database: node scripts/migrate.mjs
// Requires DATABASE_URL to be set (loaded from .env.local if present).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDotEnvFile(filename) {
  const envPath = path.join(__dirname, "..", filename);
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

// Mirrors Next.js's own load order: .env first, then .env.local overrides.
loadDotEnvFile(".env");
loadDotEnvFile(".env.local");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (checked process.env, .env, and .env.local).");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");

const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  console.log(`Running: ${statement.slice(0, 60)}...`);
  await sql(statement);
}

console.log("Migration complete.");
