import { pool } from "./db";
import { TokenBilgisi } from "./auth";

export async function kullanicininServisId(kullanici: TokenBilgisi): Promise<number | null> {
  if (kullanici.role === "employee") {
    const sonuc = await pool.query(
      `SELECT st.service_id
       FROM users u
       JOIN stops st ON st.id = u.stop_id
       WHERE u.id = $1`,
      [kullanici.id]
    );
    return sonuc.rows.length > 0 ? sonuc.rows[0].service_id : null;
  }

  if (kullanici.role === "driver") {
    const sonuc = await pool.query("SELECT id FROM services WHERE driver_id = $1", [kullanici.id]);
    return sonuc.rows.length > 0 ? sonuc.rows[0].id : null;
  }

  return null;
}
