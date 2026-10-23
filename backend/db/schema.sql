-- Dosya tekrar çalıştırılabilsin diye önce eski tabloları sil
DROP TABLE IF EXISTS trips, announcements, absences, stops, services, users CASCADE;

-- Kullanıcılar: yönetici, şoför, çalışan
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver', 'employee')),
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Servisler
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  plate TEXT NOT NULL UNIQUE,
  make_model TEXT,
  capacity INT NOT NULL CHECK (capacity > 0),
  morning_departure TIME NOT NULL,
  evening_departure TIME NOT NULL,
  driver_id INT UNIQUE REFERENCES users(id) ON DELETE SET NULL
);

-- Duraklar
CREATE TABLE stops (
  id SERIAL PRIMARY KEY,
  service_id INT REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_no INT NOT NULL,
  address TEXT NOT NULL
);

-- Döngü yüzünden çalışanın durağını şimdi ekliyoruz
ALTER TABLE users ADD COLUMN stop_id INT REFERENCES stops(id) ON DELETE SET NULL;

-- "Gelmiyorum" bildirimleri
CREATE TABLE absences (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  trip_type TEXT NOT NULL CHECK (trip_type IN ('morning', 'evening')),
  UNIQUE (user_id, date, trip_type)
);

-- Duyurular
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  service_id INT REFERENCES services(id) ON DELETE CASCADE,
  author_id INT REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seferler
CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  service_id INT REFERENCES services(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  trip_type TEXT NOT NULL CHECK (trip_type IN ('morning', 'evening')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX tek_aktif_sefer ON trips (service_id) WHERE ended_at IS NULL;

