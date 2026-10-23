import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { istek, girisYap, sunucuyuBaslat, sunucuyuKapat } from "./yardimci";

before(sunucuyuBaslat);
after(sunucuyuKapat);

test("token olmadan korunan adrese girilemez (401)", async () => {
    const cevap = await istek("/me");

    assert.equal(cevap.durum, 401);
});

test("sahte token kabul edilmez (401)", async () => {
    const cevap = await istek("/me", "uydurma.bir.token");

    assert.equal(cevap.durum, 401);
});

test("çalışan yönetici sayfasına giremez (403)", async () => {
    const token = await girisYap("ayse.yilmaz@demo.com");
    const cevap = await istek("/users", token);

    assert.equal(cevap.durum, 403);
});

test("şoför servis yönetimine giremez (403)", async () => {
    const token = await girisYap("sofor1@demo.com");
    const cevap = await istek("/services", token);

    assert.equal(cevap.durum, 403);
});

test("çalışan sefer başlatamaz (403)", async () => {
    const token = await girisYap("ayse.yilmaz@demo.com");
    const cevap = await istek("/my-trip/start", token, {
        method: "POST",
        govde: { trip_type: "morning" },
    });

    assert.equal(cevap.durum, 403);
});

test("yönetici kendini silemez", async () => {
    const token = await girisYap("admin@demo.com");
    const cevap = await istek("/users/1", token, { method: "DELETE" });

    assert.equal(cevap.durum, 400);
});

test("silinen kullanıcının token'ı artık çalışmaz", async () => {
    const yonetici = await girisYap("admin@demo.com");

    const eklenen = await istek("/users", yonetici, {
        method: "POST",
        govde: {
            full_name: "Test Kullanıcı",
            email: "test.kullanici@demo.com",
            role: "employee",
            password: "gecici123",
        },
    });
    assert.equal(eklenen.durum, 201);

    const token = await girisYap("test.kullanici@demo.com", "gecici123");
    const once = await istek("/me", token);
    assert.equal(once.durum, 200);

    const silme = await istek(`/users/${eklenen.veri.id}`, yonetici, { method: "DELETE" });
    assert.equal(silme.durum, 200);

    const sonra = await istek("/me", token);
    assert.equal(sonra.durum, 401);
});
