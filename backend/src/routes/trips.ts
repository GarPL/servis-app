import { Router } from "express";
import { pool } from "../db";
import { girisGerekli, rolGerekli, TokenBilgisi } from "../auth";
import { kullanicininServisId } from "../servis";
import { seferBitti } from "../canli";

const router = Router();

router.use(girisGerekli, rolGerekli("driver"));

const SEFER_ALANLARI = "id, date, trip_type, started_at, ended_at";

router.get("/", async (req, res) => {
  const servisId = await kullanicininServisId(res.locals.kullanici as TokenBilgisi);

  if (servisId === null) {
    res.status(404).json({ error: "Size atanmış bir servis yok" });
    return;
  }

  const result = await pool.query(
    `SELECT ${SEFER_ALANLARI} FROM trips WHERE service_id = $1 AND ended_at IS NULL`,
    [servisId]
  );

  res.json({ trip: result.rows[0] ?? null });
});

router.post("/start", async (req, res) => {
  const servisId = await kullanicininServisId(res.locals.kullanici as TokenBilgisi);

  if (servisId === null) {
    res.status(404).json({ error: "Size atanmış bir servis yok" });
    return;
  }

  const { trip_type } = req.body ?? {};

  if (trip_type !== "morning" && trip_type !== "evening") {
    res.status(400).json({ error: "Sabah ya da akşam seferi seçilmeli" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO trips (service_id, date, trip_type)
       VALUES ($1, CURRENT_DATE, $2)
       RETURNING ${SEFER_ALANLARI}`,
      [servisId, trip_type]
    );
    res.status(201).json({ trip: result.rows[0] });
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Zaten devam eden bir sefer var" });
      return;
    }
    throw err;
  }
});

router.post("/end", async (req, res) => {
  const servisId = await kullanicininServisId(res.locals.kullanici as TokenBilgisi);

  if (servisId === null) {
    res.status(404).json({ error: "Size atanmış bir servis yok" });
    return;
  }

  const result = await pool.query(
    `UPDATE trips SET ended_at = now()
     WHERE service_id = $1 AND ended_at IS NULL
     RETURNING ${SEFER_ALANLARI}`,
    [servisId]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Devam eden bir sefer yok" });
    return;
  }
  
  seferBitti(servisId);
  res.json({ trip: result.rows[0] });
});

export default router;
