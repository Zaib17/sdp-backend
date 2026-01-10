const express = require("express");
const router = express.Router();

// Mock dynamic live data
router.get("/health", async (_req, res) => {
  try {
    const fakeData = {
      network: Math.random() > 0.1 ? "Online" : "Offline",
      accuracy: Math.floor(95 + Math.random() * 5),
      activeMeters: 4,
      lastSync: new Date().toLocaleTimeString(),
    };
    res.json(fakeData);
  } catch (err) {
    res.status(500).json({ message: "Error fetching health data" });
  }
});

module.exports = router;
