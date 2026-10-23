import { Router } from "express";
import { pool } from "../db";
import { girisGerekli, rolGerekli, TokenBilgisi } from "../auth";
import { gunuOku, seferiOku } from "../tarih";

const router = Router();

router.use(girisGerekli, rolGerekli("driver"));

type Yolcu = {
  id: number;
  full_name: string;
  phone: string | null;
  absent: boolean;
};

type DurakGrubu = {
  id: number;
  name: string;
  address: string;
  passengers: Yolcu[];
};

router.get("/", async (req, res) => {
  const sofor = res.locals.kullanici as TokenBilgisi;
  const sefer = seferiOku(req.query.trip);
  const gun = await gunuOku(req.query.date);

  if (gun === null) {
    res.status(400).json({ error: "Geçersiz tarih" });
    return;
  }

  const servisSonuc = await pool.query(
    `SELECT id, name, plate, morning_departure, evening_departure
     FROM services
     WHERE driver_id = $1`,
    [sofor.id]
  );

  if (servisSonuc.rows.length === 0) {
    res.status(404).json({ error: "Size atanmış bir servis yok" });
    return;
  }

  const servis = servisSonuc.rows[0];
  const result = await pool.query(
    `SELECT
       st.id AS stop_id,
       st.name AS stop_name,
       st.address,
       u.id AS user_id,
       u.full_name,
       u.phone,
       EXISTS (
         SELECT 1 FROM absences a
         WHERE a.user_id = u.id AND a.date = $2 AND a.trip_type = $3
       ) AS absent
     FROM stops st
     LEFT JOIN users u ON u.stop_id = st.id
     WHERE st.service_id = $1
     ORDER BY
       CASE WHEN $3::text = 'evening' THEN -st.order_no ELSE st.order_no END,
       u.full_name`,
    [servis.id, gun, sefer]
  );

  const duraklar: DurakGrubu[] = [];
  let toplam = 0;
  let gelmeyen = 0;

  for (const satir of result.rows) {
    let durak = duraklar.find((d) => d.id === satir.stop_id);

    if (!durak) {
      durak = {
        id: satir.stop_id,
        name: satir.stop_name,
        address: satir.address,
        passengers: [],
      };
      duraklar.push(durak);
    }

    if (satir.user_id === null) {
      continue;
    }

    durak.passengers.push({
      id: satir.user_id,
      full_name: satir.full_name,
      phone: satir.phone,
      absent: satir.absent,
    });

    toplam++;
    if (satir.absent) {
      gelmeyen++;
    }
  }

  res.json({
    service: {
      name: servis.name,
      plate: servis.plate,
      departure: sefer === "morning" ? servis.morning_departure : servis.evening_departure,
    },
    date: gun,
    trip_type: sefer,
    total: toplam,
    absent_count: gelmeyen,
    stops: duraklar,
  });
});

export default router;