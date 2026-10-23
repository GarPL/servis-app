-- Türkçe karakterler doğru okunsun
SET client_encoding = 'UTF8';

-- Şifre hash'lemek için eklenti
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Yönetici (id 1) ve şoförler (id 2, 3, 4)
INSERT INTO users (full_name, email, phone, password_hash, role) VALUES
  ('Demo Yönetici', 'admin@demo.com', NULL, 'gecici', 'admin'),
  ('Hüseyin Aktaş', 'sofor1@demo.com', '0532 000 00 01', 'gecici', 'driver'),
  ('Ramazan Yurt', 'sofor2@demo.com', '0532 000 00 02', 'gecici', 'driver'),
  ('İsmail Ekinci', 'sofor3@demo.com', '0532 000 00 03', 'gecici', 'driver');

-- Servisler (id 1, 2, 3)
INSERT INTO services (name, plate, make_model, capacity, morning_departure, evening_departure, driver_id) VALUES
  ('Kadıköy Servisi', '34 KDK 101', 'Ford Transit', 16, '07:15', '18:00', 2),
  ('Ümraniye Servisi', '34 UMR 202', 'Mercedes Sprinter', 19, '07:00', '18:00', 3),
  ('Beşiktaş Servisi', '34 BJK 303', 'Fiat Ducato', 14, '07:30', '18:15', 4);

-- Duraklar
INSERT INTO stops (service_id, name, order_no, address) VALUES
  -- Kadıköy Servisi: id 1-5
  (1, 'Bostancı', 1, 'Bağdat Cd. No:420, Bostancı'),
  (1, 'Suadiye', 2, 'Bağdat Cd. No:350, Suadiye'),
  (1, 'Erenköy', 3, 'Ethem Efendi Cd. No:20, Erenköy'),
  (1, 'Göztepe', 4, 'Tütüncü Mehmet Efendi Cd. No:15, Göztepe'),
  (1, 'Acıbadem', 5, 'Acıbadem Cd. No:100, Acıbadem'),
  -- Ümraniye Servisi: id 6-9
  (2, 'Çekmeköy', 1, 'Alemdağ Cd. No:200, Çekmeköy'),
  (2, 'Dudullu', 2, 'Esenşehir Cd. No:5, Dudullu'),
  (2, 'Ümraniye Çarşı', 3, 'Alemdağ Cd. No:50, Ümraniye'),
  (2, 'Altunizade', 4, 'Kısıklı Cd. No:10, Altunizade'),
  -- Beşiktaş Servisi: id 10-13
  (3, 'Levent', 1, 'Büyükdere Cd. No:180, Levent'),
  (3, 'Gayrettepe', 2, 'Yıldız Posta Cd. No:30, Gayrettepe'),
  (3, 'Zincirlikuyu', 3, 'Büyükdere Cd. No:100, Zincirlikuyu'),
  (3, 'Balmumcu', 4, 'Barbaros Blv. No:150, Balmumcu');

-- Çalışanlar (id 5-28)
INSERT INTO users (full_name, email, password_hash, role, stop_id) VALUES
  -- Kadıköy Servisi
  ('Ayşe Yılmaz', 'ayse.yilmaz@demo.com', 'gecici', 'employee', 1),
  ('Mehmet Kaya', 'mehmet.kaya@demo.com', 'gecici', 'employee', 1),
  ('Zeynep Demir', 'zeynep.demir@demo.com', 'gecici', 'employee', 2),
  ('Ali Çelik', 'ali.celik@demo.com', 'gecici', 'employee', 2),
  ('Elif Şahin', 'elif.sahin@demo.com', 'gecici', 'employee', 3),
  ('Burak Öztürk', 'burak.ozturk@demo.com', 'gecici', 'employee', 4),
  ('Selin Arslan', 'selin.arslan@demo.com', 'gecici', 'employee', 5),
  ('Emre Doğan', 'emre.dogan@demo.com', 'gecici', 'employee', 5),
  -- Ümraniye Servisi
  ('Fatma Koç', 'fatma.koc@demo.com', 'gecici', 'employee', 6),
  ('Murat Aydın', 'murat.aydin@demo.com', 'gecici', 'employee', 6),
  ('Deniz Kurt', 'deniz.kurt@demo.com', 'gecici', 'employee', 7),
  ('Canan Özdemir', 'canan.ozdemir@demo.com', 'gecici', 'employee', 7),
  ('Oğuz Polat', 'oguz.polat@demo.com', 'gecici', 'employee', 8),
  ('Gizem Erdoğan', 'gizem.erdogan@demo.com', 'gecici', 'employee', 8),
  ('Kerem Aksoy', 'kerem.aksoy@demo.com', 'gecici', 'employee', 9),
  ('Seda Yıldız', 'seda.yildiz@demo.com', 'gecici', 'employee', 9),
  -- Beşiktaş Servisi
  ('Hakan Güneş', 'hakan.gunes@demo.com', 'gecici', 'employee', 10),
  ('Merve Tekin', 'merve.tekin@demo.com', 'gecici', 'employee', 10),
  ('Serkan Aslan', 'serkan.aslan@demo.com', 'gecici', 'employee', 11),
  ('Ebru Kılıç', 'ebru.kilic@demo.com', 'gecici', 'employee', 11),
  ('Tolga Çetin', 'tolga.cetin@demo.com', 'gecici', 'employee', 12),
  ('Derya Kara', 'derya.kara@demo.com', 'gecici', 'employee', 12),
  ('Onur Bulut', 'onur.bulut@demo.com', 'gecici', 'employee', 13),
  ('İrem Şimşek', 'irem.simsek@demo.com', 'gecici', 'employee', 13);

-- Herkesin şifresi demo1234 olsun (bilerek WHERE yok: tüm kullanıcılar)
UPDATE users SET
  password_hash = crypt('demo1234', gen_salt('bf')),
  must_change_password = false;

-- Örnek "gelmiyorum" kayıtları
INSERT INTO absences (user_id, date, trip_type) VALUES
  (5, CURRENT_DATE + 1, 'morning'),   -- Ayşe Yılmaz, yarın sabah
  (15, CURRENT_DATE + 1, 'morning'),  -- Deniz Kurt, yarın sabah
  (15, CURRENT_DATE + 1, 'evening'),  -- Deniz Kurt, yarın akşam
  (22, CURRENT_DATE + 2, 'evening');  -- Merve Tekin, öbür gün akşam

-- Örnek duyurular (yazan: yönetici, id 1)
INSERT INTO announcements (service_id, author_id, message) VALUES
  (1, 1, 'Yarından itibaren sabah kalkış saati 07:15 olarak güncellenmiştir.'),
  (2, 1, 'Cuma günü yol çalışması nedeniyle Altunizade durağı bir sonraki sokağa alınmıştır.');
