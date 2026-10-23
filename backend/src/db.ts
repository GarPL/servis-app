import { existsSync } from "node:fs";
import { Pool, types } from "pg";

if (existsSync(".env")) {
    process.loadEnvFile();
}

types.setTypeParser(1082, (deger) => deger);

export const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL})
    : new Pool({
        host: "localhost",
        port: 5432,
        user: "postgres",
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME ?? "servis_app",
    });