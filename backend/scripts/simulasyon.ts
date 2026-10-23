import { io, Socket } from "socket.io-client";

const API = "http://localhost:3000";
const SIFRE = "demo1234";
const ADIM_SURESI = 2000;
const ARA_ADIM = 8;
const DURAK_BEKLEME = 2;

type Nokta = { lat: number; lng: number };

const GUZERGAHLAR: Record<string, Nokta[]> = {
  "sofor1@demo.com": [
    { lat: 40.9575, lng: 29.0955 }, // Bostancı
    { lat: 40.9625, lng: 29.081 },  // Suadiye
    { lat: 40.9715, lng: 29.076 },  // Erenköy
    { lat: 40.979, lng: 29.061 },   // Göztepe
    { lat: 41.001, lng: 29.044 },   // Acıbadem
  ],
  "sofor2@demo.com": [
    { lat: 41.033, lng: 29.178 },   // Çekmeköy
    { lat: 41.017, lng: 29.156 },   // Dudullu
    { lat: 41.026, lng: 29.115 },   // Ümraniye Çarşı
    { lat: 41.022, lng: 29.045 },   // Altunizade
  ],
  "sofor3@demo.com": [
    { lat: 41.082, lng: 29.011 },   // Levent
    { lat: 41.068, lng: 29.008 },   // Gayrettepe
    { lat: 41.067, lng: 29.014 },   // Zincirlikuyu
    { lat: 41.056, lng: 29.01 },    // Balmumcu
  ],
};

const sefer = process.argv[2] === "aksam" ? "evening" : "morning";
const baglananlar: { token: string; soket: Socket }[] = [];

function bekle(ms: number) {
  return new Promise((coz) => setTimeout(coz, ms));
}

async function postIstegi(adres: string, token: string, govde?: object) {
  return fetch(`${API}${adres}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: govde === undefined ? undefined : JSON.stringify(govde),
  });
}

async function girisYap(email: string): Promise<string> {
  const response = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: SIFRE }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`${email}: ${data.error}`);
  }

  return data.token;
}

function yoluHesapla(duraklar: Nokta[]): Nokta[] {
  const yol: Nokta[] = [];

  for (let i = 0; i < duraklar.length; i++) {
    for (let b = 0; b < DURAK_BEKLEME; b++) {
      yol.push(duraklar[i]);
    }

    if (i === duraklar.length - 1) {
      break;
    }

    const simdiki = duraklar[i];
    const sonraki = duraklar[i + 1];

    for (let adim = 1; adim < ARA_ADIM; adim++) {
      const oran = adim / ARA_ADIM;
      yol.push({
        lat: simdiki.lat + (sonraki.lat - simdiki.lat) * oran,
        lng: simdiki.lng + (sonraki.lng - simdiki.lng) * oran,
      });
    }
  }

  return yol;
}

async function soforuSur(email: string, duraklar: Nokta[]) {
  const token = await girisYap(email);

  await postIstegi("/my-trip/end", token);

  const baslat = await postIstegi("/my-trip/start", token, { trip_type: sefer });
  if (!baslat.ok) {
    throw new Error(`${email}: sefer başlatılamadı`);
  }

  const soket = io(API, { auth: { token } });
  baglananlar.push({ token, soket });

  await new Promise<void>((coz, reddet) => {
    soket.once("connect", () => coz());
    soket.once("connect_error", reddet);
  });

  const sirali = sefer === "evening" ? [...duraklar].reverse() : duraklar;
  const yol = yoluHesapla(sirali);

  for (let i = 0; i < yol.length; i++) {
    soket.emit("konum", yol[i]);
    console.log(`${email}  ${i + 1}/${yol.length}`);
    await bekle(ADIM_SURESI);
  }

  await postIstegi("/my-trip/end", token);
  soket.close();
  console.log(`${email}: sefer bitti`);
}

async function durdur() {
  console.log("\nDurduruluyor, açık seferler bitiriliyor...");
  for (const { token, soket } of baglananlar) {
    await postIstegi("/my-trip/end", token);
    soket.close();
  }
  process.exit(0);
}

process.on("SIGINT", durdur);

async function main() {
  console.log(`Simülasyon başladı (${sefer === "morning" ? "sabah" : "akşam"} seferi). Durdurmak için Ctrl+C.`);

  await Promise.all(
    Object.entries(GUZERGAHLAR).map(([email, duraklar]) => soforuSur(email, duraklar))
  );

  console.log("Bütün seferler tamamlandı.");
}

main().catch((err) => {
  console.error("Hata:", err.message);
  process.exit(1);
});
