import { Router } from "express";
import { pool } from "../db";
import { girisGerekli, rolGerekli } from "../auth";

const router = Router();

router.use(girisGerekli, rolGerekli("admin"));

router.put("/:id", async (req, res) => {
  const { name, address } = req.body ?? {};

  if (!name || !address) {
    res.status(400).json({ error: "Durak adı ve adresi gerekli" });
    return;
  }

  const result = await pool.query(
    "UPDATE stops SET name = $1, address = $2 WHERE id = $3 RETURNING *",
    [name, address, req.params.id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Durak bulunamadı" });
    return;
  }

  res.json(result.rows[0]);
});

router.delete("/:id", async (req, res) => {
  const result = await pool.query("DELETE FROM stops WHERE id = $1 RETURNING id", [req.params.id]);

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Durak bulunamadı" });
    return;
  }

  res.json({ message: "Durak silindi" });
});

router.post("/:id/move", async (req, res) => {
  const { direction } = req.body ?? {};

  if (direction !== "up" && direction !== "down") {
    res.status(400).json({ error: "Yön 'up' ya da 'down' olmalı" });
    return;
  }

  const durakSonuc = await pool.query(
    "SELECT id, service_id, order_no FROM stops WHERE id = $1",
    [req.params.id]
  );

  if (durakSonuc.rows.length === 0) {
    res.status(404).json({ error: "Durak bulunamadı" });
    return;
  }

  const durak = durakSonuc.rows[0];

  const komsuSonuc = await pool.query(
    direction === "up"
      ? `SELECT id, order_no FROM stops
         WHERE service_id = $1 AND order_no < $2
         ORDER BY order_no DESC LIMIT 1`
      : `SELECT id, order_no FROM stops
         WHERE service_id = $1 AND order_no > $2
         ORDER BY order_no ASC LIMIT 1`,
    [durak.service_id, durak.order_no]
  );

  if (komsuSonuc.rows.length === 0) {
    res.json({ message: "Durak zaten en uçta" });
    return;
  }

  const komsu = komsuSonuc.rows[0];

  await pool.query(
    `UPDATE stops
     SET order_no = CASE id WHEN $1 THEN $2::int WHEN $3 THEN $4::int END
     WHERE id IN ($1, $3)`,
    [durak.id, komsu.order_no, komsu.id, durak.order_no]
  );

  res.json({ message: "Sıra değiştirildi" });
});

export default router;
