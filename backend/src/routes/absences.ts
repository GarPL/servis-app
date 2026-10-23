import { Router } from "express";
import { pool } from "../db";
import { girisGerekli, rolGerekli, TokenBilgisi } from "../auth";
import { TARIH_KALIBI } from "../tarih";

const router = Router();

router.use(girisGerekli, rolGerekli("employee"));


const SEFERLER = ["morning", "evening"];

router.get("/", async (req, res) => {
  const kullanici = res.locals.kullanici as TokenBilgisi;

  const result = await pool.query(
    `SELECT id, date, trip_type
     FROM absences
     WHERE user_id = $1 AND date >= CURRENT_DATE
     ORDER BY date, trip_type DESC`,
    [kullanici.id]
  );
  res.json(result.rows);
});

router.post("/", async (req, res) => {
  const kullanici = res.locals.kullanici as TokenBilgisi;
  const { dates, trip_types } = req.body ?? {};

  if (!Array.isArray(dates) || dates.length === 0) {
    res.status(400).json({ error: "En az bir gün seçilmeli" });
    return;
  }

  if (!Array.isArray(trip_types) || trip_types.length === 0) {
    res.status(400).json({ error: "Sabah, akşam ya da ikisi seçilmeli" });
    return;
  }

  for (const tarih of dates) {
    if (typeof tarih !== "string" || !TARIH_KALIBI.test(tarih)) {
      res.status(400).json({ error: "Tarih formatı hatalı" });
      return;
    }
  }

  for (const sefer of trip_types) {
    if (!SEFERLER.includes(sefer)) {
      res.status(400).json({ error: "Geçersiz sefer" });
      return;
    }
  }

  try {
    for (const tarih of dates) {
      const kontrol = await pool.query("SELECT $1::date < CURRENT_DATE AS gecmis", [tarih]);
      if (kontrol.rows[0].gecmis) {
        res.status(400).json({ error: "Geçmiş bir gün seçilemez" });
        return;
      }
    }

    for (const tarih of dates) {
      for (const sefer of trip_types) {
        await pool.query(
          `INSERT INTO absences (user_id, date, trip_type)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [kullanici.id, tarih, sefer]
        );
      }
    }
  } catch (err: any) {
    if (err.code === "22008" || err.code === "22007") {
      res.status(400).json({ error: "Geçersiz tarih" });
      return;
    }
    throw err;
  }

  res.status(201).json({ message: "Bildirim kaydedildi" });
});

router.delete("/:id", async (req, res) => {
  const kullanici = res.locals.kullanici as TokenBilgisi;

  const result = await pool.query(
    "DELETE FROM absences WHERE id = $1 AND user_id = $2 RETURNING id",
    [req.params.id, kullanici.id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Bildirim bulunamadı" });
    return;
  }

  res.json({ message: "Bildirim geri alındı" });
});

export default router;