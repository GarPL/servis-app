import { Router } from "express";
import { pool } from "../db";
import { girisGerekli, rolGerekli, TokenBilgisi } from "../auth";
import { kullanicininServisId } from "../servis";

const router = Router();

router.use(girisGerekli);

router.get("/", async (req, res) => {
  const kullanici = res.locals.kullanici as TokenBilgisi;
  const servisId = await kullanicininServisId(kullanici);
  const result = await pool.query(
    `SELECT
       a.id,
       a.message,
       a.created_at,
       a.service_id,
       s.name AS service_name,
       u.full_name AS author_name
     FROM announcements a
     LEFT JOIN services s ON s.id = a.service_id
     LEFT JOIN users u ON u.id = a.author_id
     WHERE a.created_at >= now() - interval '30 days'
       AND ($1::boolean OR a.service_id IS NULL OR a.service_id = $2::int)
     ORDER BY a.created_at DESC`,
    [kullanici.role === "admin", servisId]
  );

  res.json(result.rows);
});

router.post("/", rolGerekli("admin"), async (req, res) => {
  const kullanici = res.locals.kullanici as TokenBilgisi;
  const { service_id, message } = req.body ?? {};

  if (typeof message !== "string" || message.trim() === "") {
    res.status(400).json({ error: "Duyuru metni boş olamaz" });
    return;
  }

  if (message.length > 1000) {
    res.status(400).json({ error: "Duyuru en fazla 1000 karakter olabilir" });
    return;
  }

  if (service_id !== null && !Number.isInteger(service_id)) {
    res.status(400).json({ error: "Geçersiz servis" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO announcements (service_id, author_id, message)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [service_id, kullanici.id, message.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23503") {
      res.status(404).json({ error: "Servis bulunamadı" });
      return;
    }
    throw err;
  }
});

router.delete("/:id", rolGerekli("admin"), async (req, res) => {
  const result = await pool.query(
    "DELETE FROM announcements WHERE id = $1 RETURNING id",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Duyuru bulunamadı" });
    return;
  }

  res.json({ message: "Duyuru silindi" });
});

export default router;
