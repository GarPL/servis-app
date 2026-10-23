import { Router } from "express";
import { pool } from "../db";
import { girisGerekli, rolGerekli } from "../auth";
import { gunuOku, seferiOku } from "../tarih";

const router = Router();

router.use(girisGerekli, rolGerekli("admin"));

type Gelmeyen = {
  id: number;
  full_name: string;
  stop_name: string;
};

type ServisDurumu = {
  id: number;
  name: string;
  plate: string;
  departure: string;
  total: number;
  absent_count: number;
  absentees: Gelmeyen[];
};

router.get("/", async (req, res) => {
  const sefer = seferiOku(req.query.trip);
  const gun = await gunuOku(req.query.date);

  if (gun === null) {
    res.status(400).json({ error: "Geçersiz tarih" });
    return;
  }

  const servisSonuc = await pool.query(
    `SELECT
       s.id,
       s.name,
       s.plate,
       CASE WHEN $2::text = 'evening' THEN s.evening_departure ELSE s.morning_departure END AS departure,
       COUNT(u.id)::int AS total,
       COUNT(a.id)::int AS absent_count
     FROM services s
     LEFT JOIN stops st ON st.service_id = s.id
     LEFT JOIN users u ON u.stop_id = st.id
     LEFT JOIN absences a ON a.user_id = u.id AND a.date = $1 AND a.trip_type = $2
     GROUP BY s.id
     ORDER BY s.name`,
    [gun, sefer]
  );

  const gelmeyenSonuc = await pool.query(
    `SELECT st.service_id, u.id, u.full_name, st.name AS stop_name
     FROM absences a
     JOIN users u ON u.id = a.user_id
     JOIN stops st ON st.id = u.stop_id
     WHERE a.date = $1 AND a.trip_type = $2
     ORDER BY st.order_no, u.full_name`,
    [gun, sefer]
  );

  const servisler: ServisDurumu[] = servisSonuc.rows.map((servis) => ({
    ...servis,
    absentees: gelmeyenSonuc.rows
      .filter((g) => g.service_id === servis.id)
      .map((g) => ({ id: g.id, full_name: g.full_name, stop_name: g.stop_name })),
  }));

  let toplam = 0;
  let gelmeyen = 0;
  for (const servis of servisler) {
    toplam += servis.total;
    gelmeyen += servis.absent_count;
  }

  res.json({
    date: gun,
    trip_type: sefer,
    total: toplam,
    absent_count: gelmeyen,
    services: servisler,
  });
});

export default router;
