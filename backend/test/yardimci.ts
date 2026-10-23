import "./ortam";
import { readFileSync } from "fs";
import { AddressInfo } from "net";
import { pool } from "../src/db";
import { server } from "../src/app";

type Cevap = {
    durum: number;
    veri: any;
};

type IstekSecenekleri = {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    govde?: object;
};

let adres = "";

async function veritabaniniSifirla(): Promise<void> {
    const sonuc = await pool.query("SELECT current_database() AS ad");
    if (sonuc.rows[0].ad !== "servis_app_test") {
        throw new Error(`Testler sadece servis_app_test'te çalışır, bağlanılan: ${sonuc.rows[0].ad}`);
    }

    await pool.query(readFileSync("db/schema.sql", "utf8"));
    await pool.query(readFileSync("db/seed.sql", "utf8"));
}

export async function sunucuyuBaslat(): Promise<void> {
    await veritabaniniSifirla();
    await new Promise<void>((tamam) => server.listen(0, () => tamam()));
    const port = (server.address() as AddressInfo).port;
    adres = `http://localhost:${port}`;
}

export async function sunucuyuKapat(): Promise<void> {
    server.closeAllConnections();
    await new Promise<void>((tamam) => server.close(() => tamam()));
    await pool.end();
}

export async function istek(
    yol: string,
    token: string | null = null,
    secenekler: IstekSecenekleri = {}
): Promise<Cevap> {
    const basliklar: Record<string, string> = {};

    if (token !== null) {
        basliklar.Authorization = `Bearer ${token}`;
    }

    if (secenekler.govde !== undefined) {
        basliklar["Content-Type"] = "application/json";
    }

    const cevap = await fetch(`${adres}${yol}`, {
        method: secenekler.method ?? "GET",
        headers: basliklar,
        body: secenekler.govde === undefined ? undefined : JSON.stringify(secenekler.govde),
    });

    return { durum: cevap.status, veri: await cevap.json() };
}

export async function girisYap(email:string, password = "demo1234"): Promise<string> {
    const cevap = await istek("/login", null, { method: "POST", govde: { email, password } });

    if (cevap.durum !== 200) {
        throw new Error(`${email} giriş yapamadı (${cevap.durum})`);
    }

    return cevap.veri.token;
}