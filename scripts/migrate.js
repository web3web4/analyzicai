const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Use the connection string from .env.local (or hardcoded for this script)
const connectionString =
  "postgresql://postgres:postgres@127.0.0.1:54332/postgres";

async function migrate() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("Connected to database");

    const migrationFile = path.join(
      __dirname,
      "../supabase/migrations/009_contract_support.sql",
    );
    const sql = fs.readFileSync(migrationFile, "utf8");

    console.log("Applying migration...");
    await client.query(sql);
    console.log("Migration applied successfully");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
