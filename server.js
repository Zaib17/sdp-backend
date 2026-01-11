const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const authMiddleware = require("./middleware/authMiddleware");
const bcrypt = require("bcrypt");

// Models
const Admin = require("./models/Admin");
const Meter = require("./models/Meter");

// Simulated Meters
const { startMeterSimulation, getLastSyncTime } = require("./simulateMeters");

// Load environment variables
dotenv.config();

// Connect MongoDB
connectDB();

const app = express();

/* =====================================================
   🧠 SECURITY & MIDDLEWARES
===================================================== */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =====================================================
   🚫 RATE LIMITING
===================================================== */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again later.",
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many verification attempts. Try again later.",
});

app.use("/api/login", loginLimiter);
app.use("/api/admin/verify-password", verifyLimiter);

/* =====================================================
   📦 ROUTES
===================================================== */
const meterRoutes = require("./routes/meterRoutes");
const emailRoutes = require("./routes/emailRoutes");
const logRoutes = require("./routes/logRoutes");
const authRoutes = require("./routes/authRoutes");
const passwordRoutes = require("./routes/passwordRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/meters", meterRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/logs", logRoutes);
app.use("/api", authRoutes);
app.use("/api", passwordRoutes);
app.use("/api", adminRoutes);

/* =====================================================
   🟢 DEFAULT ADMIN (LOCAL + FIRST DEPLOY SAFE)
===================================================== */
async function createDefaultAdmin() {
  try {
    const existing = await Admin.findOne({
      email: "zaibuniversity@gmail.com",
    });

    if (!existing) {
      const hashed = await bcrypt.hash("abcd1234", 10);
      await Admin.create({
        name: "Zaib",
        uId: "14506",
        email: "zaibuniversity@gmail.com",
        designation: "Student",
        area: "Korangi 17",
        profilePic: "",
        password: hashed,
      });
      console.log("✅ Default admin ensured");
    }
  } catch (err) {
    console.error("❌ Admin creation error:", err.message);
  }
}

createDefaultAdmin();

/* =====================================================
   ⚡ START METER SIMULATION
===================================================== */
startMeterSimulation();

/* =====================================================
   🧩 PROTECTED TEST ROUTE
===================================================== */
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "You have access", user: req.user });
});

/* =====================================================
   🟢 SYSTEM HEALTH ROUTE
===================================================== */
app.get("/api/system/health", async (req, res) => {
  try {
    const meters = await Meter.find();
    const totalMeters = meters.length;
    const activeMeters = meters.filter((m) => (m.watts || 0) > 0).length;

    const networkStatus =
      activeMeters === 0
        ? "Offline"
        : activeMeters === totalMeters
        ? "Online"
        : "Partial";

    const dataAccuracy =
      totalMeters > 0
        ? ((activeMeters / totalMeters) * 100).toFixed(1)
        : 0;

    const lastSync = getLastSyncTime
      ? getLastSyncTime()
      : new Date().toISOString();

    res.json({
      network: networkStatus,
      accuracy: Number(dataAccuracy),
      activeMeters,
      lastSync,
    });
  } catch (err) {
    console.error("❌ System health error:", err);
    res.status(500).json({ message: "Failed to fetch system health" });
  }
});

/* =====================================================
   🟢 SYSTEM STATUS ROUTE (FINAL THEFT DETECTION LOGIC)
===================================================== */
app.get("/api/system/status", async (req, res) => {
  try {
    const meters = await Meter.find();

    const streetInput =
      meters.find((m) => m.type === "streetInput") ||
      meters.find((m) => m.meterId === "A-001");

    const toNext =
      meters.find((m) => m.type === "toNext") ||
      meters.find((m) => m.meterId === "A-005");

    const houses =
      meters.filter((m) => m.type === "house")?.length
        ? meters.filter((m) => m.type === "house")
        : meters.filter((m) =>
            ["A-002", "A-003", "A-004"].includes(m.meterId)
          );

    const streetInputPower = streetInput?.watts || 0;
    const toNextPower = toNext?.watts || 0;
    const houseTotalPower = houses.reduce(
      (sum, h) => sum + (h.watts || 0),
      0
    );

    const powerLoss =
      streetInputPower - toNextPower - houseTotalPower;

    const lossPercent =
      streetInputPower > 0
        ? (Math.abs(powerLoss) / streetInputPower) * 100
        : 0;

    const theftStatus = lossPercent > 5 ? "Theft Detected" : "No Theft";

    const meterStatus = meters.map((m) => ({
      id: m.meterId,
      name: m.name,
      watts: m.watts || 0,
      voltage: m.voltage || 0,
      current: m.current || 0,
      status: m.status || (m.watts > 0 ? "Online" : "Offline"),
    }));

    const admin = await Admin.findOne();
    const areaName = admin?.area || "Unknown Area";

    res.json({
      area: areaName,
      streetInputPower,
      houseTotalPower,
      toNextPower,
      powerLoss,
      theftStatus,
      meterStatus,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("❌ Failed to fetch system status:", err);
    res.status(500).json({ message: "Failed to fetch system status" });
  }
});

/* =====================================================
   🚀 START SERVER
===================================================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
