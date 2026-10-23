import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { istek, girisYap, sunucuyuBaslat, sunucuyuKapat } from "./yardimci";
import { emitWarning } from "node:process";

before(sunucuyuBaslat);
after(sunucuyuKapat);

test("doğru şifreyle giriş yapılır", async () => {
    const cevap = await istek("/login", null, {
        method: "POST",
        govde: { email: "admin@demo.com", password: "demo1234" },
    });

    assert.equal(cevap.durum, 200);
    assert.equal(typeof cevap.veri.token, "string");
    assert.equal(cevap.veri.user.role, "admin");
    assert.equal(cevap.veri.user.password_hash, undefined);
});

test("yanlış şifre ve olmayan e-posta aynı hatayı verir", async () => {
    const yanlisSifre = await istek("/login", null, {
        method: "POST",
        govde: { email: "admin@demo.com", password: "yanlis" },
    });
    const olmayanKullanici = await istek("/login", null, {
        method: "POST",
        govde: { email: "yok@demo.om", password: "demo1234" },
    });

    assert.equal(yanlisSifre.durum, 401);
    assert.equal(olmayanKullanici.durum, 401);
    assert.equal(yanlisSifre.veri.error, olmayanKullanici.veri.error); 
});

test("e-posta ya da şifre eksikse 400 döner", async () => {
    const cevap = await istek("/login", null, {
        method: "POST",
        govde: { email: "admin@demo.com" },
    });

    assert.equal(cevap.durum, 400);
});

test("SQL injection denemesi giriş yapamaz", async () => {
    const cevap = await istek("/login", null, {
        method: "POST",
        govde: { email: "' OR '1'='1", password: "' OR '1='1" },
    });

    assert.equal(cevap.durum, 401);
});

test("token ile /me kullanıcının kendi bilgisini döndürür", async () => {
    const token = await girisYap("ayse.yilmaz@demo.com");
    const cevap = await istek("/me", token);

    assert.equal(cevap.durum, 200);
    assert.equal(cevap.veri.email, "ayse.yilmaz@demo.com");
    assert.equal(cevap.veri.role, "employee");
})