const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 3000;
const SECRET_KEY = "your_very_secret_key";

app.use(cors());
app.use(bodyParser.json());

// DB connection
const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "wattana15277",
  database: "trackspend",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error connecting to MySQL:", err);
    return;
  }
  console.log("✅ Connected to MySQL database!");
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
  const { username, phone, email, password } = req.body;

  if (!username || !phone || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  const hashedPassword = bcrypt.hashSync(password, 8);
  const query =
    "INSERT INTO users (username, phone, email, password) VALUES (?, ?, ?, ?)";

  db.query(query, [username, phone, email, hashedPassword], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" });
      }
      return res
        .status(500)
        .json({ success: false, message: "เกิดข้อผิดพลาดในการสมัครสมาชิก" });
    }
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
      return res.status(401).json({ success: false, message: "รหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1d" });
    res.status(200).json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ!",
      token,
      username: user.username, // ✅ ส่ง username กลับไปด้วย
      phone: user.phone,       // ✅ ส่ง phone กลับไปด้วย
    });
  });
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
  if (!date) date = new Date();

  const query =
    "INSERT INTO transactions (user_id, amount, type, category, note, date) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(query, [req.userId, amount, type, category, note, date], (err) => {
    if (err)
      return res.status(500).json({ success: false, message: "Error adding transaction." });
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
  const query = "INSERT INTO budgets (user_id, category, `limit`) VALUES (?, ?, ?)";
  db.query(query, [req.userId, category, limit], (err) => {
    if (err)
      return res.status(500).json({ success: false, message: "Error adding budget." });
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

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
