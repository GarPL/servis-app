import { Pool, types } from "pg";

process.loadEnvFile();

types.setTypeParser(1082, (deger) => deger);

export const pool = new Pool({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? "servis_app",
});