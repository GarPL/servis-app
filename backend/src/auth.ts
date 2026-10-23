import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { pool } from "./db";

export type TokenBilgisi = {
  id: number;
  role: string;
};

export function tokenOlustur(bilgi: TokenBilgisi): string {
  return jwt.sign(bilgi, process.env.JWT_SECRET as string, { expiresIn: "7d" });
}

export async function tokeniCoz(token: string): Promise<TokenBilgisi | null> {
  let bilgi: TokenBilgisi;

  try {
    bilgi = jwt.verify(token, process.env.JWT_SECRET as string) as TokenBilgisi;
  } catch {
    return null;
  }

  const sonuc = await pool.query("SELECT id, role FROM users WHERE id = $1", [bilgi.id]);

  if (sonuc.rows.length === 0) {
    return null;
  }

  return { id: sonuc.rows[0].id, role: sonuc.rows[0].role };
}

export async function girisGerekli(req: Request, res: Response, next: NextFunction) {
  const baslik = req.headers.authorization;

  if (!baslik || !baslik.startsWith("Bearer ")) {
    res.status(401).json({ error: "Giriş yapmanız gerekiyor" });
    return;
  }

  const kullanici = await tokeniCoz(baslik.slice(7));

  if (kullanici === null) {
    res.status(401).json({ error: "Oturum geçersiz, tekrar giriş yapın" });
    return;
  }

  res.locals.kullanici = kullanici;
  next();
}

export function rolGerekli(rol: string) {
  return function (req: Request, res: Response, next: NextFunction) {
    const kullanici = res.locals.kullanici as TokenBilgisi;

    if (kullanici.role !== rol) {
      res.status(403).json({ error: "Bu işlem için yetkiniz yok" });
      return;
    }

    next();
  };
}

