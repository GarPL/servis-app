import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { istek, girisYap, sunucuyuBaslat, sunucuyuKapat } from "./yardimci";

before(sunucuyuBaslat);
after(sunucuyuKapat);

test("açık sefer yokken bitirilemez (404)", async () => {
    const token = await girisYap("sofor1@demo.com");
    const cevap = await istek("/my-trip/end", token, { method: "POST" });

    assert.equal(cevap.durum, 404);
});

test("geçersiz sefer türü reddedilir", async () => {
    const token = await girisYap("sofor1@demo.com");
    const cevap = await istek("/my-trip/start", token, {
        method: "POST",
        govde: { trip_type: "gece" },
    });

    assert.equal(cevap.durum, 400);
});

test("sefer başlatılır, ikinci kez başlatılamaz, bitirilir", async () => {
    const token = await girisYap("sofor1@demo.com");

    const baslat = await istek("/my-trip/start", token, {
        method: "POST",
        govde: { trip_type: "morning" },
    });
    assert.equal(baslat.durum, 201);
    assert.equal(baslat.veri.trip.trip_type, "morning");

    const ikinci = await istek("/my-trip/start", token, {
        method: "POST",
        govde: { trip_type: "evening" },
    });
    assert.equal(ikinci.durum, 409);

    const acik = await istek("/my-trip", token);
    assert.equal(acik.veri.trip.id, baslat.veri.trip.id);

    const bitir = await istek("/my-trip/end", token, { method: "POST" });
    assert.equal(bitir.durum, 200);

    const sonra = await istek("/my-trip", token);
    assert.equal(sonra.veri.trip, null);
});

test("aynı anda gelen üç başlatma isteğinden sadece biri kabul edilir", async () => {
    const token = await girisYap("sofor2@demo.com");
    const istekGovdesi = { method: "POST" as const, govde: { trip_type: "morning" } };

    const cevaplar = await Promise.all([
        istek("/my-trip/start", token, istekGovdesi),
        istek("/my-trip/start", token, istekGovdesi),
        istek("/my-trip/start", token, istekGovdesi),
    ]);

    const durumlar = cevaplar.map((c) => c.durum).sort();
    assert.deepEqual(durumlar, [201, 409, 409]);

    await istek("/my-trip/end", token, { method: "POST" });
});