const express = require("express");
const Meter = require("../models/Meter");
const router = express.Router();

/**
 * Compute live power summary
 */
function evaluateSystem(meters = []) {
  if (!Array.isArray(meters) || meters.length === 0) {
    return {
      streetInputPower: 0,
      toNextPower: 0,
      totalHousePower: 0,
      powerLoss: 0,
      status: { type: "No Data", message: "No meters found in database." },
    };
  }

  // --- Identify meters ---
  const streetInput = meters.find((m) => m.meterId === "A-001")?.watts || 0;
  const toNext = meters.find((m) => m.meterId === "A-005")?.watts || 0;
  const houses = meters.filter((m) =>
    ["A-002", "A-003", "A-004"].includes(m.meterId)
  );
  const totalHousePower = houses.reduce((sum, h) => sum + (h.watts || 0), 0);

  // --- Power loss (simple difference) ---
  const powerLoss = streetInput - toNext - totalHousePower;

  // --- Default theft status ---
  const status = {
    type: "✅ No Theft",
    message: "Live readings normal — theft check runs daily",
  };

  return {
    streetInputPower: Number(streetInput.toFixed(2)),
    toNextPower: Number(toNext.toFixed(2)),
    totalHousePower: Number(totalHousePower.toFixed(2)),
    powerLoss: Number(powerLoss.toFixed(2)),
    status,
  };
}

/**
 * GET /api/meters → returns all meters + computed power summary
 */
router.get("/", async (req, res) => {
  try {
    const meters = await Meter.find();
    if (!meters?.length)
      return res.json({ meters: [], analysis: evaluateSystem([]) });

    const analysis = evaluateSystem(meters);

    const processedMeters = meters.map((m) => {
      const power = m.watts || 0;
      const voltage = m.voltage || 0;
      const current = m.current || 0;
      const units = Math.round((power * 5) / 100);
      return {
        meterId: m.meterId,
        name: m.name,
        voltage,
        current,
        power,
        units,
        status: power > 0 ? "Online" : "Offline",
      };
    });

    res.json({ meters: processedMeters, analysis });
  } catch (err) {
    console.error("❌ Meter fetch error:", err);
    res.status(500).json({ message: "Internal Server Error in /api/meters" });
  }
});

module.exports = router;
