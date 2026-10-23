import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { istek, girisYap, sunucuyuBaslat, sunucuyuKapat } from "./yardimci";

before(sunucuyuBaslat);
after(sunucuyuKapat);

const ILERI_TARIH = "2099-06-15";

test("geçmiş bir gün bildirilemez", async () => {
    const token = await girisYap("ayse.yilmaz@demo.com");
    const cevap = await istek("/my-absences", token, {
        method: "POST",
        govde: { dates: ["2020-01-01"], trip_types: ["morning"] },
    });

    assert.equal(cevap.durum, 400);
});

test("takvimde olmayan bir gün reddedilir", async () => {
    const token = await girisYap("ayse.yilmaz@demo.com");
    const cevap = await istek("/my-absences", token, {
        method: "POST",
        govde: { dates: ["2099-02-30"], trip_types: ["morning"] },
    });

    assert.equal(cevap.durum, 400);
});

test("aynı gün iki kez bildirilince tek kayıt olur", async () => {
    const token = await girisYap("ayse.yilmaz@demo.com");
    const govde = { dates: [ILERI_TARIH], trip_types: ["morning", "evening"] };

    const ilk = await istek("/my-absences", token, { method: "POST", govde });
    const ikinci = await istek("/my-absences", token, { method: "POST", govde });
    assert.equal(ilk.durum, 201);
    assert.equal(ikinci.durum, 201);

    const liste = await istek("/my-absences", token);
    const oGun = liste.veri.filter((b: any) => b.date === ILERI_TARIH);
    assert.equal(oGun.length, 2);
});

test("çalışan başkasının bildirimini silemez", async () => {
    const ayse = await girisYap("ayse.yilmaz@demo.com");
    const fatma = await girisYap("fatma.koc@demo.com");

    const liste = await istek("/my-absences", ayse);
    const bildirim = liste.veri.find((b: any) => b.date === ILERI_TARIH);

    const silme = await istek(`/my-absences/${bildirim.id}`, fatma, { method: "DELETE" });
    assert.equal(silme.durum, 404);

    const sonra = await istek("/my-absences", ayse);
    assert.ok(sonra.veri.some((b: any) => b.id === bildirim.id));
});

test("çalışan kendi bildirimini geri alabilir", async () => {
    const token = await girisYap("ayse.yilmaz@demo.com");

    const liste = await istek("/my-absences", token);
    const bildirim = liste.veri.find((b: any) => b.date === ILERI_TARIH);

    const silme = await istek(`/my-absences/${bildirim.id}`, token, { method: "DELETE" });
    assert.equal(silme.durum, 200);

    const sonra = await istek("/my-absences", token);
    assert.ok(!sonra.veri.some((b: any) => b.id === bildirim.id));
});
