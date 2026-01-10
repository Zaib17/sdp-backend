// sdp/backend/simulateMeters.js
const Meter = require("./models/Meter");
const UsageLog = require("./models/UsageLog");

// ===============================
// Initial Meters Setup
// ===============================
const initialMeters = [
  { meterId: "A-001", name: "Street Input", type: "streetInput", units: 0 },
  { meterId: "A-002", name: "Syed Hassan", type: "house", units: 0 },
  { meterId: "A-003", name: "Orangzaib", type: "house", units: 0 },
  { meterId: "A-004", name: "Maliha Bibi", type: "house", units: 0 },
  { meterId: "A-005", name: "To Next Street", type: "toNext", units: 0 },
];

let simulationStarted = false;
let loggingStarted = false;

// 🕒 Last sync time for system health
let lastSyncTime = null;

// ===============================
// Start Simulation
// ===============================
const startMeterSimulation = async () => {
  try {
    if (simulationStarted) {
      console.log("⚙️ Simulation already running — skipping re-init.");
      return;
    }
    simulationStarted = true;

    // Ensure initial meters exist
    for (const data of initialMeters) {
      await Meter.findOneAndUpdate(
        { meterId: data.meterId },
        data,
        { upsert: true }
      );
    }

    console.log("⚡ Meter simulation started...");

    // Every 5 seconds simulate live readings
    setInterval(async () => {
      const meters = await Meter.find();

      const houseMeters = meters.filter((m) => m.type === "house");
      const toNextMeter = meters.find((m) => m.type === "toNext");
      const streetInputMeter = meters.find((m) => m.type === "streetInput");

      // --- Update House Meters ---
      for (const house of houseMeters) {
        const watts = Math.floor(Math.random() * (300 - 50 + 1)) + 50;
        const voltage = 220;
        const current = Number((watts / voltage).toFixed(2));

        Object.assign(house, {
          watts,
          voltage,
          current,
          units: (house.units || 0) + watts / 100,
          status: "Online",
          lastUpdated: new Date(),
        });

        await house.save();
      }

      // --- Update ToNext Meter ---
      if (toNextMeter) {
        const watts = Math.floor(Math.random() * (200 - 50 + 1)) + 50;
        const voltage = 220;
        const current = Number((watts / voltage).toFixed(2));

        Object.assign(toNextMeter, {
          watts,
          voltage,
          current,
          units: (toNextMeter.units || 0) + watts / 100,
          status: "Online",
          lastUpdated: new Date(),
        });

        await toNextMeter.save();
      }

      // --- Update Street Input Meter ---
      if (streetInputMeter) {
        const totalHousePower = houseMeters.reduce(
          (sum, h) => sum + (h.watts || 0),
          0
        );
        const toNextPower = toNextMeter?.watts || 0;
        const watts = totalHousePower + toNextPower;
        const voltage = 220;
        const current = Number((watts / voltage).toFixed(2));

        Object.assign(streetInputMeter, {
          watts,
          voltage,
          current,
          units: (streetInputMeter.units || 0) + watts / 100,
          status: "Online",
          lastUpdated: new Date(),
        });

        await streetInputMeter.save();
      }

      // 🕒 Update system last sync time
      lastSyncTime = new Date().toISOString();

      console.log({
        streetInput: streetInputMeter?.watts,
        toNext: toNextMeter?.watts,
        houseTotal: houseMeters.reduce(
          (s, h) => s + (h.watts || 0),
          0
        ),
      });
    }, 5000);

    // Start logging once
    if (!loggingStarted) {
      loggingStarted = true;
      startLoggingIntervals();
    }
  } catch (err) {
    console.error("❌ Meter simulation error:", err.message);
  }
};

// ===============================
// Logging Functions
// ===============================
async function logUsage(type) {
  try {
    const meters = await Meter.find();
    if (!meters.length) return;

    const streetInput =
      meters.find((m) => m.type === "streetInput")?.watts || 0;
    const toNext =
      meters.find((m) => m.type === "toNext")?.watts || 0;
    const houseTotal = meters
      .filter((m) => m.type === "house")
      .reduce((sum, h) => sum + (h.watts || 0), 0);

    const powerLossRaw = streetInput - toNext - houseTotal;
    const powerLoss = Number(powerLossRaw.toFixed(2));

    const theftThreshold = Math.abs(powerLossRaw * 0.05);
    const theftAlert =
      Math.abs(powerLoss) <= theftThreshold
        ? "No Theft"
        : "Theft Detected";

    const now = new Date();
    const roundedMinute = new Date(now.setSeconds(0, 0));

    // Prevent duplicate logs
    const existing = await UsageLog.findOne({
      date: roundedMinute,
      logType: type,
    });
    if (existing) return;

    await UsageLog.create({
      date: roundedMinute,
      streetInput,
      toNext,
      houseTotal,
      powerLoss,
      theftAlert,
      logType: type,
    });

    console.log(
      `📘 ${type} log saved | Loss=${powerLoss}W | Status=${theftAlert}`
    );
  } catch (err) {
    console.error(`❌ Error saving ${type} log:`, err.message);
  }
}

// Run both Daily and Monthly intervals
function startLoggingIntervals() {
  console.log("🕒 Logging started: 1 min (daily) | 5 min (monthly)");

  // Daily logs → every 1 minute
  setInterval(() => logUsage("daily"), 60_000);

  // Monthly logs → every 5 minutes
  setInterval(() => logUsage("monthly"), 5 * 60_000);
}

// ===============================
// Export functions
// ===============================
const getLastSyncTime = () => lastSyncTime;

module.exports = {
  startMeterSimulation,
  getLastSyncTime,
};
