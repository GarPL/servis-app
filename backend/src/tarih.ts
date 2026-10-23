import { pool } from "./db";

export const TARIH_KALIBI = /^\d{4}-\d{2}-\d{2}$/;

export type Sefer = "morning" | "evening";

export function seferiOku(deger: unknown): Sefer {
    return deger === "evening" ? "evening" : "morning";
}

export async function gunuOku(deger: unknown): Promise<string | null> {
    if (deger === undefined) {
        const sonuc = await pool.query("SELECT CURRENT_DATE AS gun");
        return sonuc.rows[0].gun;
    }

    if (typeof deger !== "string" || !TARIH_KALIBI.test(deger)) {
        return null;
    }

    try {
        const sonuc = await pool.query("SELECT $1::date AS gun", [deger]);
        return sonuc.rows[0].gun;
    } catch (err: any) {
        if (err.code === "22008" || err.code === "22007") {
            return null;
        }
        throw err;
    }
}