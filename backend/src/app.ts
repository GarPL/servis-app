import express, { NextFunction, Request, Response } from "express";
import { pool } from "./db";
import cors from "cors";
import bcrypt from "bcryptjs";
import { tokenOlustur, girisGerekli, rolGerekli, TokenBilgisi } from "./auth";
import servicesRouter from "./routes/services";
import usersRouter from "./routes/users";
import stopsRouter from "./routes/stops";
import absencesRouter from "./routes/absences";
import passengersRouter from "./routes/passengers";
import attendanceRouter from "./routes/attendance";
import announcementsRouter from "./routes/announcements";
import tripsRouter from "./routes/trips";
import { createServer } from "http";
import { Server } from "socket.io";
import { canliKonumuKur } from "./canli";
import rateLimit from "express-rate-limit";

const IZINLI_ADRESLER = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((adres) => adres.trim())
    .filter((adres) => adres !== "");

const girisSiniri = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Çok fazla başarısız giriş denemesi. 15 dk sonra tekrar deneyin." },
});

const app = express();
app.set("trust proxy", 1);
app.use(cors({ origin: IZINLI_ADRESLER }));
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Merhaba, servis-app backend çalışıyor");
});

app.use("/services", servicesRouter);
app.use("/users", usersRouter);
app.use("/stops", stopsRouter);
app.use("/my-absences", absencesRouter);
app.use("/my-passengers", passengersRouter);
app.use("/attendance", attendanceRouter);
app.use("/announcements", announcementsRouter);
app.use("/my-trip", tripsRouter);

app.post("/login", girisSiniri, async (req, res) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
        res.status(400).json({ error: "E-posta ve şifre gerekli" });
        return;
    }

    const result = await pool.query(
        "Select id, full_name, password_hash, role, must_change_password from users where email = $1",
        [email]
    );
    const user = result.rows[0];

    if (!user) {
        res.status(401).json({ error: "E-posta veya şifre hatalı" });
        return;
    }

    const sifreDogru = await bcrypt.compare(password, user.password_hash);

    if (!sifreDogru) {
        res.status(401).json({ error: "E-posta veya şifre hatalı" });
        return;
    }

    const token = tokenOlustur({ id: user.id, role: user.role });

    res.json({
        token: token,
        user: {
            id: user.id,
            full_name: user.full_name,
            role: user.role,
            must_change_password: user.must_change_password,
        },
    });
});

app.get("/me", girisGerekli, async (req, res) => {
    const kullanici = res.locals.kullanici as TokenBilgisi;

    const result = await pool.query(
        "Select id, full_name, email, phone, role, must_change_password from users where id = $1",
        [kullanici.id]
    );

    res.json(result.rows[0]);
});

app.post("/change-password", girisGerekli, async (req, res) => {
    const kullanici = res.locals.kullanici as TokenBilgisi;
    const { currentPassword, newPassword } = req.body ?? {};

    if (!currentPassword || !newPassword) {
        res.status(400).json({ error: "Mevcut ve yeni şifre gerekli" });
        return;
    }

    if (newPassword === currentPassword) {
        res.status(400).json({ error: "Yeni şifre eskisiyle aynı olamaz" });
        return;
    }

    const result = await pool.query(
        "Select password_hash from users where id = $1",
        [kullanici.id]
    );

    const sifreDogru = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

    if (!sifreDogru) {
        res.status(401).json({ error: "Mevcut şifre hatalı" });
        return;
    }

    const yeniHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
        "update users set password_hash = $1, must_change_password = false where id = $2",
        [yeniHash, kullanici.id]
    );

    res.json({ message: "Şifre değiştirildi" });
});

app.get("/my-service", girisGerekli, async (req, res) => {
    const kullanici = res.locals.kullanici as TokenBilgisi;

    const result = await pool.query(
        `SELECT
      s.name AS service_name,
      s.plate,
      s.make_model,
      s.morning_departure,
      s.evening_departure,
      st.name AS stop_name,
      st.address AS stop_address,
      d.full_name AS driver_name,
      d.phone AS driver_phone
    FROM users u
    JOIN stops st ON u.stop_id = st.id
    JOIN services s ON st.service_id = s.id
    LEFT JOIN users d ON s.driver_id = d.id
    WHERE u.id = $1`,
        [kullanici.id]
    );

    if (result.rows.length === 0) {
        res.status(404).json({ error: "Henüz bir servise atanmadınız" });
        return;
    }

    res.json(result.rows[0]);
});


app.use((req, res) => {
    res.status(404).json({ error: "Böyle bir adres yok" });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.type === "entity.parse.failed") {
        res.status(400).json({ error: "İstek gövdesi geçerli bir JSON değil" });
        return;
    }

    console.error(err);
    res.status(500).json({ error: "Sunucuda beklenmeyen bir hata oluştu" });
});

export const server = createServer(app);
const io = new Server(server, { cors: { origin: IZINLI_ADRESLER } });
canliKonumuKur(io);