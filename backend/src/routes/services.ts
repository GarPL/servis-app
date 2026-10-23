import { Router, Response } from "express";
import { pool } from "../db";
import { girisGerekli, rolGerekli } from "../auth";

const router = Router();

router.use(girisGerekli, rolGerekli("admin"));

async function servisVerisiHatasi(govde: any): Promise<string | null> {
  const { name, plate, capacity, morning_departure, evening_departure, driver_id } = govde ?? {};

  if (!name || !plate || !capacity || !morning_departure || !evening_departure) {
    return "Ad, plaka, kapasite ve kalkış saatleri gerekli";
  }

  if (driver_id) {
    const sonuc = await pool.query("SELECT role FROM users WHERE id = $1", [driver_id]);
    if (sonuc.rows.length === 0 || sonuc.rows[0].role !== "driver") {
      return "Seçilen kişi bir şoför değil";
    }
  }

  return null;
}

function veritabaniHatasi(err: any, res: Response) {
  if (err.code === "23505") {
    res.status(409).json({ error: "Bu plaka ya da şoför başka bir serviste kayıtlı" });
    return;
  }
  if (err.code === "23514") {
    res.status(400).json({ error: "Kapasite 0'dan büyük olmalı" });
    return;
  }
  if (err.code === "22007" || err.code === "22008") {
    res.status(400).json({ error: "Saat formatı hatalı (örnek: 07:30)" });
    return;
  }
  throw err;
}

router.get("/", async (req, res) => {
  const result = await pool.query(
    `SELECT s.id, s.name, s.plate, s.make_model, s.capacity,
            s.morning_departure, s.evening_departure,
            s.driver_id, d.full_name AS driver_name
     FROM services s
     LEFT JOIN users d ON s.driver_id = d.id
     ORDER BY s.id`
  );
  res.json(result.rows);
});

router.get("/:id", async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, plate, make_model, capacity,
            morning_departure, evening_departure, driver_id
     FROM services
     WHERE id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Servis bulunamadı" });
    return;
  }

  res.json(result.rows[0]);
});

router.post("/", async (req, res) => {
  const hata = await servisVerisiHatasi(req.body);
  if (hata !== null) {
    res.status(400).json({ error: hata });
    return;
  }

  const { name, plate, make_model, capacity, morning_departure, evening_departure, driver_id } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO services (name, plate, make_model, capacity, morning_departure, evening_departure, driver_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, plate, make_model || null, capacity, morning_departure, evening_departure, driver_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    veritabaniHatasi(err, res);
  }
});

router.put("/:id", async (req, res) => {
  const hata = await servisVerisiHatasi(req.body);
  if (hata !== null) {
    res.status(400).json({ error: hata });
    return;
  }

  const { name, plate, make_model, capacity, morning_departure, evening_departure, driver_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE services
       SET name = $1, plate = $2, make_model = $3, capacity = $4,
           morning_departure = $5, evening_departure = $6, driver_id = $7
       WHERE id = $8
       RETURNING *`,
      [name, plate, make_model || null, capacity, morning_departure, evening_departure, driver_id || null, req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Servis bulunamadı" });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    veritabaniHatasi(err, res);
  }
});

router.delete("/:id", async (req, res) => {
  const result = await pool.query("DELETE FROM services WHERE id = $1 RETURNING id", [req.params.id]);

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Servis bulunamadı" });
    return;
  }

  res.json({ message: "Servis silindi" });
});

router.get("/:id/stops", async (req, res) => {
  const result = await pool.query(
    `SELECT st.id, st.name, st.order_no, st.address,
            COUNT(u.id)::int AS employee_count
     FROM stops st
     LEFT JOIN users u ON u.stop_id = st.id
     WHERE st.service_id = $1
     GROUP BY st.id
     ORDER BY st.order_no`,
    [req.params.id]
  );
  res.json(result.rows);
});

router.post("/:id/stops", async (req, res) => {
  const { name, address } = req.body ?? {};

  if (!name || !address) {
    res.status(400).json({ error: "Durak adı ve adresi gerekli" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO stops (service_id, name, address, order_no)
       VALUES ($1, $2, $3,
         (SELECT COALESCE(MAX(order_no), 0) + 1 FROM stops WHERE service_id = $1))
       RETURNING *`,
      [req.params.id, name, address]
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

export default router;
