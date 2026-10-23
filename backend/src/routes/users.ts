import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db";
import { girisGerekli, rolGerekli, TokenBilgisi } from "../auth";

const router = Router();

router.use(girisGerekli, rolGerekli("admin"));

const ROLLER = ["admin", "driver", "employee"];

function kullaniciVerisiHatasi(govde: any, yeniKayit: boolean): string | null {
  const { full_name, email, role, password } = govde ?? {};

  if (!full_name || !email) {
    return "Ad ve e-posta gerekli";
  }

  if (yeniKayit) {
    if (!ROLLER.includes(role)) {
      return "Geçerli bir rol seçilmeli";
    }
    if (!password) {
      return "Geçici şifre gerekli";
    }
  }

  return null;
}

router.get("/drivers", async (req, res) => {
  const result = await pool.query(
    `SELECT u.id, u.full_name, s.id AS service_id, s.name AS service_name
     FROM users u
     LEFT JOIN services s ON s.driver_id = u.id
     WHERE u.role = 'driver'
     ORDER BY u.full_name`
  );
  res.json(result.rows);
});

router.get("/", async (req, res) => {
  const rol = typeof req.query.role === "string" ? req.query.role : null;

  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.must_change_password,
            u.stop_id, st.name AS stop_name,
            s.id AS service_id, s.name AS service_name,
            ds.name AS driven_service_name
     FROM users u
     LEFT JOIN stops st ON u.stop_id = st.id
     LEFT JOIN services s ON st.service_id = s.id
     LEFT JOIN services ds ON ds.driver_id = u.id
     WHERE ($1::text IS NULL OR u.role = $1)
     ORDER BY u.role, u.full_name`,
    [rol]
  );
  res.json(result.rows);
});

router.get("/:id", async (req, res) => {
  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.stop_id, st.service_id
     FROM users u
     LEFT JOIN stops st ON u.stop_id = st.id
     WHERE u.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Kullanıcı bulunamadı" });
    return;
  }

  res.json(result.rows[0]);
});

router.post("/", async (req, res) => {
  const hata = kullaniciVerisiHatasi(req.body, true);
  if (hata !== null) {
    res.status(400).json({ error: hata });
    return;
  }

  const { full_name, email, phone, role, password, stop_id } = req.body;
  const durak = role === "employee" ? stop_id || null : null;
  const hash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone, role, password_hash, stop_id, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, full_name, email, phone, role, stop_id`,
      [full_name, email, phone || null, role, hash, durak]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Bu e-posta zaten kayıtlı" });
      return;
    }
    if (err.code === "23503") {
      res.status(400).json({ error: "Seçilen durak bulunamadı" });
      return;
    }
    throw err;
  }
});

router.put("/:id", async (req, res) => {
  const hata = kullaniciVerisiHatasi(req.body, false);
  if (hata !== null) {
    res.status(400).json({ error: hata });
    return;
  }

  const { full_name, email, phone, stop_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET full_name = $1, email = $2, phone = $3,
           stop_id = CASE WHEN role = 'employee' THEN $4::int ELSE NULL END
       WHERE id = $5
       RETURNING id, full_name, email, phone, role, stop_id`,
      [full_name, email, phone || null, stop_id || null, req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Kullanıcı bulunamadı" });
      return;
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Bu e-posta zaten kayıtlı" });
      return;
    }
    if (err.code === "23503") {
      res.status(400).json({ error: "Seçilen durak bulunamadı" });
      return;
    }
    throw err;
  }
});

router.post("/:id/reset-password", async (req, res) => {
  const { password } = req.body ?? {};

  if (!password) {
    res.status(400).json({ error: "Yeni geçici şifre gerekli" });
    return;
  }

  const hash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    "UPDATE users SET password_hash = $1, must_change_password = true WHERE id = $2 RETURNING id",
    [hash, req.params.id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Kullanıcı bulunamadı" });
    return;
  }

  res.json({ message: "Şifre sıfırlandı" });
});

router.delete("/:id", async (req, res) => {
  const yonetici = res.locals.kullanici as TokenBilgisi;

  if (Number(req.params.id) === yonetici.id) {
    res.status(400).json({ error: "Kendinizi silemezsiniz" });
    return;
  }

  const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [req.params.id]);

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Kullanıcı bulunamadı" });
    return;
  }

  res.json({ message: "Kullanıcı silindi" });
});

export default router;
