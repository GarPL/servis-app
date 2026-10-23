import { Server } from "socket.io";
import { pool } from "./db";
import { TokenBilgisi, tokeniCoz } from "./auth";
import { kullanicininServisId } from "./servis";

type Konum = {
  service_id: number;
  lat: number;
  lng: number;
  at: string;
};

let io: Server | null = null;
const sonKonumlar = new Map<number, Konum>();

function servisOdasi(servisId: number): string {
  return `servis-${servisId}`;
}

export function canliKonumuKur(sunucu: Server) {
  io = sunucu;

  sunucu.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (typeof token !== "string") {
      next(new Error("Giriş yapmanız gerekiyor"));
      return;
    }

    try {
      const kullanici = await tokeniCoz(token);

      if (kullanici === null) {
        next(new Error("Oturum geçersiz"));
        return;
      }

      socket.data.kullanici = kullanici;
      next();
    } catch (err) {
      console.error("Socket girişi doğrulanamadı:", err);
      next(new Error("Sunucu hatası"));
    }
  });

  sunucu.on("connection", async (socket) => {
    const kullanici = socket.data.kullanici as TokenBilgisi;

    try {
      if (kullanici.role === "admin") {
        socket.join("yoneticiler");
        socket.emit("konumlar", [...sonKonumlar.values()]);
        return;
      }

      const servisId = await kullanicininServisId(kullanici);

      if (servisId === null) {
        socket.disconnect();
        return;
      }

      if (kullanici.role === "employee") {
        socket.join(servisOdasi(servisId));
        const konum = sonKonumlar.get(servisId);
        socket.emit("konumlar", konum ? [konum] : []);
        return;
      }

      socket.on("konum", async (veri) => {
        try {
          const lat = veri?.lat;
          const lng = veri?.lng;

          if (typeof lat !== "number" || typeof lng !== "number" || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            return;
          }

          const sefer = await pool.query(
            "SELECT 1 FROM trips WHERE service_id = $1 AND ended_at IS NULL",
            [servisId]
          );

          if (sefer.rows.length === 0) {
            return;
          }

          const yeniKonum: Konum = { service_id: servisId, lat, lng, at: new Date().toISOString() };
          sonKonumlar.set(servisId, yeniKonum);
          sunucu.to(servisOdasi(servisId)).to("yoneticiler").emit("konum", yeniKonum);
        } catch (err) {
          console.error("Konum işlenemedi:", err);
        }
      });
    } catch (err) {
      console.error("Bağlantı kurulamadı:", err);
      socket.disconnect();
    }
  });
}

export function seferBitti(servisId: number) {
  sonKonumlar.delete(servisId);
  io?.to(servisOdasi(servisId)).to("yoneticiler").emit("sefer-bitti", { service_id: servisId });
}
