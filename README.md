# Servis

Şirket servislerini yönetmek için bir mobil uygulama. Servis saatleri, duraklar ve değişiklikler genelde bir mesajlaşma grubundan duyuruluyor ve mesajların arasında kayboluyor. Bu uygulama bu bilgiler için tek bir kaynak olmayı amaçlıyor.

Öğrenme amaçlı kişisel bir proje. Bütün veriler demo veridir.

## Özellikler

Üç rol var. Her kullanıcı rolüne göre farklı sekmeler görür.

**Çalışan**
- Kendi servisinin plakasını, durağını, kalkış saatlerini ve şoförünü görür.
- Takvimden bir ya da birden fazla gün seçip sabah, akşam ya da iki sefer için "gelmiyorum" bildirir, bildirimini geri alabilir.
- Servisinin konumunu sefer sırasında haritada canlı izler.

**Şoför**
- Günün yolcu listesini durak durak görür. Akşam seferinde duraklar ters sırada gelir, gelmeyecek yolcular işaretlidir.
- Seferi başlatır. Sefer açıkken telefonun konumu 5 saniyede bir paylaşılır, sefer bitince paylaşım durur.

**Yönetici**
- Servisleri, durakları (sıralamasıyla birlikte) ve kullanıcıları yönetir.
- Bütün servislerin günlük katılım sayılarını ve gelmeyecek kişileri görür.
- Belirli bir servise ya da herkese duyuru yayınlar.
- Yoldaki bütün servisleri haritada canlı izler.

Ortak özellikler: e-posta ve şifreyle giriş, yöneticinin verdiği geçici şifrenin ilk girişte zorunlu olarak değiştirilmesi, son 30 günün duyuruları.

## Teknolojiler

| Katman | Kullanılanlar |
|---|---|
| Mobil | React Native, Expo SDK 57, Expo Router, TypeScript |
| Sunucu | Node.js, Express 5, TypeScript |
| Veritabanı | PostgreSQL (ORM yok, SQL elle yazıldı) |
| Canlı konum | Socket.IO |
| Harita | Leaflet + OpenStreetMap (telefonda WebView içinde) |
| Kimlik doğrulama | JWT, bcrypt |
| Test | `node:test` |

## Teknik notlar

- **Yetki sunucuda kontrol edilir.** Kullanıcının rolü ve servisi istekle gelen bilgiden değil, token'dan ve veritabanından bulunur. Bir şoför başka bir servisin yolcu listesini, bir çalışan başka bir servisin konumunu göremez. Silinen bir kullanıcının token'ı da hemen geçersiz olur.
- **Bir serviste aynı anda tek sefer açık olabilir.** Bu kural kısmi bir unique indeksle (`WHERE ended_at IS NULL`) veritabanında garanti edilir. Aynı anda gönderilen başlatma isteklerinden yalnızca biri kabul edilir.
- **Konum geçmişi saklanmaz.** Sunucu her servisin yalnızca son konumunu bellekte tutar. Konumlar Socket.IO odalarıyla yalnızca ilgili servisin çalışanlarına ve yöneticilere gider.
- **Güvenlik:** parametreli SQL sorguları, giriş denemesi sınırı (15 dakikada 10 başarısız deneme), sınırlı CORS, hatalarda iç ayrıntı göstermeyen JSON cevaplar. Telefonda token `expo-secure-store` ile şifreli saklanır.
- **Tarihler:** "Bugün"ün hangi gün olduğuna saat dilimi kaymaları olmasın diye PostgreSQL karar verir. `DATE` sütunları JavaScript tarihine çevrilmeden yazı olarak taşınır.

## Proje yapısı

```
backend/
  db/          schema.sql (tablolar), seed.sql (demo veri)
  src/         Express uygulaması, route'lar, Socket.IO
  scripts/     simulasyon.ts (3 şoförün sefer simülasyonu)
  test/        otomatik testler
mobile/
  src/app/         Expo Router ekran rotaları
  src/screens/     ekranlar
  src/components/  harita, sefer kartı, sefer/gün seçici
plan.md        planlama: kapsam, kararlar, ekran akışı ve veri modeli diyagramları
```

## Kurulum

Gerekenler: Node.js 24, PostgreSQL 18.

**Veritabanı**

```
psql -U postgres -c "CREATE DATABASE servis_app;"
cd backend
psql -U postgres -d servis_app -f db/schema.sql
psql -U postgres -d servis_app -f db/seed.sql
```

**Sunucu**

`backend/.env` dosyasını oluşturun:

```
DB_PASSWORD=<postgres şifresi>
JWT_SECRET=<rastgele uzun bir değer>
CORS_ORIGINS=http://localhost:8081
```

```
cd backend
npm install
npm run dev
```

Sunucu `http://localhost:3000` adresinde çalışır.

**Mobil uygulama**

```
cd mobile
npm install
npx expo start
```

Tarayıcıda açmak için `w` tuşuna basın. Telefonda açmak için Expo Go ile QR kodu okutun. Telefon ve bilgisayar aynı ağda olmalı.

**Canlı konumu denemek**

Sunucu çalışırken başka bir terminalde:

```
cd backend
npm run simulasyon
```

Üç şoför seferi başlatır ve duraklar arasında ilerler. Yönetici hesabıyla "Canlı" sekmesinden izleyebilirsiniz. Akşam seferi için `npm run simulasyon -- aksam` komutunu kullanın.

## Demo hesaplar

Bütün hesapların şifresi `demo1234`.

| Rol | E-posta |
|---|---|
| Yönetici | admin@demo.com |
| Şoför | sofor1@demo.com, sofor2@demo.com, sofor3@demo.com |
| Çalışan | ayse.yilmaz@demo.com, fatma.koc@demo.com (ve 22 çalışan daha) |

## Testler

```
psql -U postgres -c "CREATE DATABASE servis_app_test;"
cd backend
npm test
```

21 test giriş, yetki, "gelmiyorum" bildirimi ve sefer başlatma/bitirme kurallarını kontrol eder. Testler ayrı bir veritabanı kullanır ve her dosyanın başında bu veritabanını sıfırlar.
