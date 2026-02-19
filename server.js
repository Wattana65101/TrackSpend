require("dotenv").config();
const crypto = require("crypto");
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");

// ส่งอีเมล: Resend หรือ Gmail (Nodemailer) - ใช้อย่างใดอย่างหนึ่ง
let resend = null;
try {
  if (process.env.RESEND_API_KEY) {
    const { Resend } = require("resend");
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch (_) {}
const useGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

const app = express();
const port = process.env.SERVER_PORT || 500;
// ⚠️ หมายเหตุ: ควรใช้ environment variable สำหรับ production
// ตัวอย่าง: process.env.JWT_SECRET_KEY || "your_very_secret_key"
const SECRET_KEY = process.env.JWT_SECRET_KEY || "your_very_secret_key";

// CORS configuration - ควรกำหนด allowed origins ใน production
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request log (method, path, status)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const level = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO";
    console.log(`[${level}] ${req.method} ${req.path} ${status} ${ms}ms`);
  });
  next();
});

// DB connection
// ⚠️ หมายเหตุ: ควรใช้ environment variables สำหรับ production
// สำหรับ Docker: DB_HOST=localhost, DB_PORT=3308
// สำหรับ MySQL แบบปกติ: DB_HOST=127.0.0.1, DB_PORT=3306
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3308, // Docker ใช้ 3308, MySQL ปกติใช้ 3306
  user: process.env.DB_USER || "trackspend_user",
  password: process.env.DB_PASSWORD || "trackspend_pass", // ⚠️ เปลี่ยนใน production
  database: process.env.DB_NAME || "trackspend",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error connecting to MySQL:", err);
    return;
  }
  console.log("✅ Connected to MySQL database!");
  if (useGmail) {
    if ((process.env.GMAIL_USER || "").includes("your.email")) {
      console.log("⚠️ GMAIL_USER ยังเป็น placeholder - เปลี่ยนเป็นอีเมล Gmail จริงใน .env");
    } else {
      console.log("📧 ส่งอีเมล: Gmail พร้อมใช้งาน");
    }
  } else if (resend) console.log("📧 ส่งอีเมล: Resend พร้อมใช้งาน");
  else console.log("⚠️ ส่งอีเมล: โหมด dev (ดูรหัสที่ terminal)");
  // สร้างตาราง password_reset_tokens ถ้ายังไม่มี
  db.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_token (token),
      INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `, (e) => { if (e) console.warn("⚠️ password_reset_tokens table:", e.message); });
});

// JWT verify middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(403).json({ success: false, message: "No token provided." });
  }
  
  // ตรวจสอบ format ของ token
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(403).json({ success: false, message: "Invalid token format." });
  }
  
  const token = parts[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: "Failed to authenticate token." });
    }
    req.userId = decoded.id;
    next();
  });
};

// ✅ Register
app.post("/api/register", (req, res) => {
  console.log("📥 Received register request at:", new Date().toISOString());
  console.log("📥 Request body:", { 
    username: req.body.username, 
    email: req.body.email, 
    phone: req.body.phone,
    hasPassword: !!req.body.password
  });
  
  // ตรวจสอบว่า database connected หรือไม่
  if (db.state === "disconnected") {
    console.error("❌ Database is disconnected!");
    return res.status(503).json({ 
      success: false, 
      message: "ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาตรวจสอบการตั้งค่า MySQL" 
    });
  }

  const { username, phone, email, password } = req.body;

  if (!username || !phone || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  // Input validation
  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ success: false, message: "ชื่อผู้ใช้ต้องมีความยาว 3-50 ตัวอักษร" });
  }

  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length !== 10) {
    return res.status(400).json({ success: false, message: "เบอร์โทรศัพท์ต้องเป็น 10 ตัวเลข" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "รูปแบบอีเมลไม่ถูกต้อง" });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });
  }

  const hashedPassword = bcrypt.hashSync(password, 8);
  const query =
    "INSERT INTO users (username, phone, email, password) VALUES (?, ?, ?, ?)";

  db.query(query, [username, phoneDigits, email, hashedPassword], (err) => {
    if (err) {
      console.error("❌ Database error:", err);
      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" });
      }
      return res
        .status(500)
        .json({ success: false, message: `เกิดข้อผิดพลาดในการสมัครสมาชิก: ${err.message}` });
    }
    console.log("✅ User registered successfully:", email);
    res.status(201).json({ success: true, message: "สมัครสมาชิกสำเร็จ!" });
  });
});

// ✅ Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  console.log("📥 Login attempt:", email);

  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error("❌ DB error:", err);
      return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบบัญชีผู้ใช้นี้" });
    }

    const user = results[0];
    const passwordIsValid = bcrypt.compareSync(password, user.password);

    if (!passwordIsValid) {
      console.log("[Login] รหัสผ่านผิด email:", email);
      return res.status(401).json({ success: false, message: "รหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1d" });
    console.log("[Login] สำเร็จ userId:", user.id, "email:", email);
    res.status(200).json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ!",
      token,
      username: user.username, // ✅ ส่ง username กลับไปด้วย
      phone: user.phone,       // ✅ ส่ง phone กลับไปด้วย
    });
  });
});

// ส่งอีเมลรหัสยืนยัน (Gmail ผ่าน Nodemailer)
async function sendCodeByGmail(toEmail, code) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  await transporter.sendMail({
    from: `"TrackSpend" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "รหัสยืนยันตัวตน TrackSpend",
    html: `
      <div style="font-family: sans-serif; max-width: 400px;">
        <h2 style="color: #059669;">TrackSpend - รหัสยืนยันตัวตน</h2>
        <p>คุณได้ขอรีเซ็ตรหัสผ่าน รหัสยืนยัน 6 หลักของคุณคือ</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #064E3B;">${code}</p>
        <p style="color: #6B7280; font-size: 14px;">รหัสหมดอายุใน 10 นาที กรุณาอย่าส่งรหัสนี้ให้ใคร</p>
        <p style="color: #6B7280; font-size: 12px;">หากคุณไม่ได้ขอดูเมลนี้ กรุณาไม่ต้องทำอะไร</p>
      </div>
    `,
  });
}

// ✅ Forgot Password - ส่งรหัส 6 หลักยืนยันตัวตนทางอีเมล (Resend หรือ Gmail)
app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ success: false, message: "กรุณากรอกอีเมล" });
  }
  const emailTrim = email.trim();
  const q = "SELECT id FROM users WHERE email = ?";
  db.query(q, [emailTrim], (err, rows) => {
    if (err) {
      console.error("❌ forgot-password DB error:", err);
      return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
    }
    if (rows.length === 0) {
      return res.status(200).json({ success: true, message: "ถ้ามีบัญชีผูกกับอีเมลนี้ จะส่งรหัสยืนยันให้" });
    }
    const userId = rows[0].id;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const insertQ = "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)";
    db.query(insertQ, [userId, code, expiresAt], async (err2) => {
      if (err2) {
        console.error("❌ insert reset token error:", err2);
        return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
      }

      // ตัวเลือก 1: Resend
      if (resend) {
        try {
          const fromEmail = process.env.RESEND_FROM || "TrackSpend <onboarding@resend.dev>";
          const { error } = await resend.emails.send({
            from: fromEmail,
            to: [emailTrim],
            subject: "รหัสยืนยันตัวตน TrackSpend",
            html: `<div style="font-family: sans-serif; max-width: 400px;"><h2 style="color: #059669;">TrackSpend - รหัสยืนยันตัวตน</h2><p>รหัสยืนยัน 6 หลักของคุณคือ</p><p style="font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #064E3B;">${code}</p><p style="color: #6B7280; font-size: 14px;">รหัสหมดอายุใน 10 นาที</p></div>`,
          });
          if (error) throw error;
          console.log("✅ [Resend] Verification code sent to:", emailTrim);
          return res.status(200).json({ success: true, message: "เราได้ส่งรหัส 6 หลักไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบอีเมล (รวมถึงโฟลเดอร์สแปม)" });
        } catch (sendErr) {
          console.error("❌ Resend error:", sendErr);
          return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการส่งอีเมล กรุณาลองใหม่" });
        }
      }

      // ตัวเลือก 2: Gmail (Nodemailer)
      if (useGmail) {
        try {
          await sendCodeByGmail(emailTrim, code);
          console.log("✅ [Gmail] Verification code sent to:", emailTrim);
          return res.status(200).json({ success: true, message: "เราได้ส่งรหัส 6 หลักไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบอีเมล (รวมถึงโฟลเดอร์สแปม)" });
        } catch (sendErr) {
          console.error("❌ Gmail send error:", sendErr.message || sendErr);
          return res.status(500).json({ success: false, message: "ส่งอีเมลไม่สำเร็จ: " + (sendErr.message || "ตรวจสอบ GMAIL_USER และ GMAIL_APP_PASSWORD ใน .env") });
        }
      }

      // โหมด dev: ไม่มี Resend หรือ Gmail
      console.log("🔑 [DEV] Verification code for", emailTrim, ":", code);
      res.status(200).json({
        success: true,
        message: "รหัสถูกสร้างแล้ว (โหมด dev - ดูรหัสที่ terminal) กรุณากรอกรหัสด้านล่าง",
        devCode: code,
      });
    });
  });
});

// ✅ Reset Password - ยืนยันด้วยรหัส 6 หลัก แล้วตั้งรหัสผ่านใหม่
app.post("/api/reset-password", (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword || typeof newPassword !== "string") {
    return res.status(400).json({ success: false, message: "กรุณากรอกอีเมล รหัสยืนยัน และรหัสผ่านใหม่ให้ครบ" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });
  }
  const codeStr = String(code).trim();
  const q = `SELECT pr.user_id FROM password_reset_tokens pr
    JOIN users u ON u.id = pr.user_id
    WHERE u.email = ? AND pr.token = ? AND pr.expires_at > NOW()`;
  db.query(q, [email.trim(), codeStr], (err, rows) => {
    if (err) {
      console.error("❌ reset-password DB error:", err);
      return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
    }
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "รหัสยืนยันไม่ถูกต้องหรือหมดอายุ กรุณาขอรหัสใหม่" });
    }
    const userId = rows[0].user_id;
    const hashed = bcrypt.hashSync(newPassword, 8);
    const updateQ = "UPDATE users SET password = ? WHERE id = ?";
    db.query(updateQ, [hashed, userId], (err2) => {
      if (err2) {
        console.error("❌ update password error:", err2);
        return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
      }
      db.query("DELETE FROM password_reset_tokens WHERE user_id = ? AND token = ?", [userId, codeStr]);
      res.status(200).json({ success: true, message: "ตั้งรหัสผ่านใหม่สำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่" });
    });
  });
});

// ✅ Google Login (ตรวจ idToken กับ Google แล้วสร้าง/เข้าบัญชี)
// รองรับทั้ง Web และ Android client เพราะ idToken จากแอปอาจมี aud เป็นตัวใดตัวหนึ่ง
// ถ้าโทเคนไม่ถูกต้อง: ดูที่ terminal ว่า [Google Login] แจ้ง aud เป็นอะไร แล้วเพิ่มใน .env เป็น GOOGLE_EXTRA_CLIENT_ID=ค่า_aud_นั้น
const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID || "660835922057-ag4kgdpq4jnt7gkektt7h3suml230mbj.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = process.env.GOOGLE_ANDROID_CLIENT_ID || "660835922057-mup0rn0bl5v1t17bid0caljvsa8nqspo.apps.googleusercontent.com";
const GOOGLE_EXTRA = process.env.GOOGLE_EXTRA_CLIENT_ID ? process.env.GOOGLE_EXTRA_CLIENT_ID.split(",").map((s) => s.trim()).filter(Boolean) : [];
const GOOGLE_CLIENT_IDS = [GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, ...GOOGLE_EXTRA];

function isAudienceValid(aud) {
  if (!aud) return false;
  if (Array.isArray(aud)) return aud.some((a) => GOOGLE_CLIENT_IDS.includes(a));
  return GOOGLE_CLIENT_IDS.includes(aud);
}

app.post("/api/auth/google", async (req, res) => {
  const { idToken, phone, username: reqUsername } = req.body;
  console.log("[Google Login] ได้รับ request มี idToken:", !!idToken, "phone:", !!phone);
  if (!idToken) {
    return res.status(400).json({ success: false, message: "ไม่มี idToken" });
  }
  try {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const resp = await fetch(url);
    const payload = await resp.json();
    // log สิ่งที่ Google ส่งกลับ (ไม่รวม idToken)
    console.log("[Google Login] tokeninfo:", {
      hasError: !!payload.error,
      error: payload.error || null,
      error_description: payload.error_description || null,
      aud: payload.aud || null,
      email: payload.email || null,
      email_verified: payload.email_verified,
    });
    if (payload.error) {
      const msg = payload.error_description || payload.error || "โทเคน Google ไม่ถูกต้อง";
      console.warn("[Google Login] โทเคนไม่ผ่าน:", payload.error, payload.error_description);
      return res.status(401).json({ success: false, message: msg });
    }
    if (!isAudienceValid(payload.aud)) {
      console.warn("[Google Login] Client ID ไม่ตรง: โทเคนมี aud =", payload.aud, "| เซิร์ฟรับเฉพาะ:", GOOGLE_CLIENT_IDS);
      return res.status(401).json({
        success: false,
        message: "Client ID ในโทเคนไม่ตรงกับเซิร์ฟเวอร์ — ดู log ที่ terminal ที่รัน node server.js ว่า aud เป็นอะไร แล้วเพิ่มใน server หรือ Google Cloud Console",
      });
    }
    console.log("[Google Login] aud ผ่านแล้ว ใช้ email จากโทเคน");
    const email = payload.email;
    const name = (payload.name || email).trim() || "User";

    const findQuery = "SELECT id, username, phone FROM users WHERE email = ?";
    db.query(findQuery, [email], (err, results) => {
      if (err) {
        console.error("[Google Login] DB error:", err.message);
        return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
      }
      if (results.length > 0) {
        const user = results[0];
        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1d" });
        console.log("[Google Login] สำเร็จ (มีบัญชีแล้ว) userId:", user.id, "email:", email);
        return res.status(200).json({
          success: true,
          isNewUser: false,
          message: "เข้าสู่ระบบด้วย Google สำเร็จ!",
          token,
          username: user.username,
          phone: user.phone,
        });
      }
      const phoneDigits = (phone || "").toString().replace(/\D/g, "");
      if (phoneDigits.length !== 10) {
        console.log("[Google Login] บัญชีใหม่ แต่ยังไม่มีเบอร์ 10 หลัก ส่ง needMoreInfo");
        return res.status(200).json({
          success: false,
          needMoreInfo: true,
          email,
          name: name.substring(0, 50),
          message: "กรุณากรอกเบอร์โทรศัพท์ 10 ตัวเลขเพื่อสมัครสมาชิก",
        });
      }
      const username = (reqUsername && String(reqUsername).trim()) ? String(reqUsername).trim().substring(0, 50) : name.substring(0, 50);
      const hashedPassword = bcrypt.hashSync("google-" + email + "-" + Date.now(), 8);
      const insertQuery = "INSERT INTO users (username, phone, email, password) VALUES (?, ?, ?, ?)";
      db.query(insertQuery, [username, phoneDigits, email, hashedPassword], (err2, insertResult) => {
        if (err2) {
          console.error("[Google Login] DB insert error:", err2.message);
          return res.status(500).json({ success: false, message: "ไม่สามารถสร้างบัญชีได้" });
        }
        db.query("SELECT id, username, phone FROM users WHERE email = ?", [email], (err3, rows) => {
          if (err3 || !rows?.length) {
            console.error("[Google Login] DB select หลัง insert error:", err3?.message);
            return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดหลังสร้างบัญชี" });
          }
          const user = rows[0];
          const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1d" });
          console.log("[Google Login] สำเร็จ (สร้างบัญชีใหม่) userId:", user.id, "email:", email);
          res.status(200).json({
            success: true,
            isNewUser: true,
            message: "สร้างบัญชีและเข้าสู่ระบบด้วย Google สำเร็จ!",
            token,
            username: user.username,
            phone: user.phone || "",
          });
        });
      });
    });
  } catch (e) {
    console.error("[Google Login] exception:", e.message || e);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการตรวจสอบ Google" });
  }
});

// ✅ Get transactions
app.get("/api/transactions", verifyToken, (req, res) => {
  const query =
    "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC";
  db.query(query, [req.userId], (err, results) => {
    if (err)
      return res.status(500).json({ success: false, message: "Error fetching transactions." });
    res.status(200).json(results);
  });
});

// ✅ Add transaction
app.post("/api/transactions", verifyToken, (req, res) => {
  let { amount, type, category, note, date } = req.body;
  
  // Input validation
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return res.status(400).json({ success: false, message: "จำนวนเงินไม่ถูกต้อง" });
  }

  if (!type || (type !== "income" && type !== "expense")) {
    return res.status(400).json({ success: false, message: "ประเภทไม่ถูกต้อง" });
  }

  if (!category || category.trim() === "") {
    return res.status(400).json({ success: false, message: "กรุณาเลือกหมวดหมู่" });
  }

  if (!date) date = new Date().toISOString().split("T")[0];

  const query =
    "INSERT INTO transactions (user_id, amount, type, category, note, date) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(query, [req.userId, parseFloat(amount), type, category.trim(), note || "", date], (err) => {
    if (err) {
      console.error("❌ Error adding transaction:", err);
      return res.status(500).json({ success: false, message: "Error adding transaction." });
    }
    res.status(201).json({ success: true, message: "Transaction added successfully!" });
  });
});

// ✅ Delete transaction
app.delete("/api/transactions/:id", verifyToken, (req, res) => {
  const transactionId = req.params.id;
  const query = "DELETE FROM transactions WHERE id = ? AND user_id = ?";

  db.query(query, [transactionId, req.userId], (err, result) => {
    if (err) {
      console.error("❌ Error deleting transaction:", err);
      return res.status(500).json({ success: false, message: "Error deleting transaction." });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found or not authorized." });
    }

    res.json({ success: true, message: "Transaction deleted successfully!" });
  });
});

// ✅ Get user profile
app.get("/api/user", verifyToken, (req, res) => {
  const query = "SELECT id, username, email, phone FROM users WHERE id = ?";
  db.query(query, [req.userId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching user:", err);
      return res.status(500).json({ success: false, message: "Error fetching user profile." });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, user: results[0] });
  });
});

// ✅ Update user profile (username)
app.put("/api/user", verifyToken, (req, res) => {
  const { username: newUsername } = req.body;
  if (!newUsername || typeof newUsername !== "string" || !newUsername.trim()) {
    return res.status(400).json({ success: false, message: "กรุณากรอกชื่อเล่น" });
  }
  const name = newUsername.trim().substring(0, 50);
  const query = "UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
  db.query(query, [name, req.userId], (err, result) => {
    if (err) {
      console.error("[PUT /api/user] DB error:", err.message);
      return res.status(500).json({ success: false, message: "ไม่สามารถบันทึกได้" });
    }
    if (result.affectedRows === 0) {
      console.warn("[PUT /api/user] ไม่พบ user id:", req.userId);
      return res.status(404).json({ success: false, message: "ไม่พบบัญชีผู้ใช้" });
    }
    console.log("[PUT /api/user] บันทึกชื่อเล่นสำเร็จ userId:", req.userId, "username:", name);
    res.status(200).json({ success: true, message: "บันทึกชื่อเล่นเรียบร้อยแล้ว", username: name });
  });
});

// ✅ Get budgets
app.get("/api/budgets", verifyToken, (req, res) => {
  const query = "SELECT * FROM budgets WHERE user_id = ?";
  db.query(query, [req.userId], (err, results) => {
    if (err)
      return res.status(500).json({ success: false, message: "Error fetching budgets." });
    res.status(200).json(results);
  });
});

// ✅ Add budget
app.post("/api/budgets", verifyToken, (req, res) => {
  const { category, limit } = req.body;

  // Input validation
  if (!category || category.trim() === "") {
    return res.status(400).json({ success: false, message: "กรุณาเลือกหมวดหมู่" });
  }

  if (!limit || isNaN(parseFloat(limit)) || parseFloat(limit) <= 0) {
    return res.status(400).json({ success: false, message: "จำนวนเงินไม่ถูกต้อง" });
  }

  const query = "INSERT INTO budgets (user_id, category, `limit`) VALUES (?, ?, ?)";
  db.query(query, [req.userId, category.trim(), parseFloat(limit)], (err) => {
    if (err) {
      console.error("❌ Error adding budget:", err);
      return res.status(500).json({ success: false, message: "Error adding budget." });
    }
    res.status(201).json({ success: true, message: "Budget added successfully!" });
  });
});

// ✅ Update budget
app.put("/api/budgets/:id", verifyToken, (req, res) => {
  const budgetId = req.params.id;
  const { limit } = req.body;
  const query = "UPDATE budgets SET `limit` = ? WHERE id = ? AND user_id = ?";

  db.query(query, [limit, budgetId, req.userId], (err, result) => {
    if (err) {
      console.error("❌ Error updating budget:", err);
      return res.status(500).json({ success: false, message: "Error updating budget." });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Budget not found or not authorized." });
    }
    res.status(200).json({ success: true, message: "Budget updated successfully!" });
  });
});

// ✅ Delete budget
app.delete("/api/budgets/:id", verifyToken, (req, res) => {
  const budgetId = req.params.id;
  const query = "DELETE FROM budgets WHERE id = ? AND user_id = ?";

  db.query(query, [budgetId, req.userId], (err, result) => {
    if (err) {
      console.error("❌ Error deleting budget:", err);
      return res.status(500).json({ success: false, message: "Error deleting budget." });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Budget not found or not authorized." });
    }
    res.json({ success: true, message: "Budget deleted successfully!" });
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`   เข้าได้จากเครื่องอื่น: http://<IP เครื่อง>:${port}`);
});
