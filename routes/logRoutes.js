const express = require("express");
const UsageLog = require("../models/UsageLog");
const router = express.Router();

/* =====================================================
   🟩 FETCH LOGS (Daily & Monthly)
===================================================== */

// ✅ Get last 7 daily logs
router.get("/daily", async (_req, res) => {
  try {
    const logs = await UsageLog.find({ logType: "daily" })
      .sort({ date: -1 })
      .limit(7)
      .lean();
    res.json(logs.reverse());
  } catch (err) {
    console.error("❌ Error fetching daily logs:", err);
    res.status(500).json({ message: "Failed to fetch daily logs" });
  }
});

// ✅ Get last 6 monthly logs
router.get("/monthly", async (_req, res) => {
  try {
    const logs = await UsageLog.find({ logType: "monthly" })
      .sort({ date: -1 })
      .limit(6)
      .lean();
    res.json(logs.reverse());
  } catch (err) {
    console.error("❌ Error fetching monthly logs:", err);
    res.status(500).json({ message: "Failed to fetch monthly logs" });
  }
});

/* =====================================================
   🗑️ DELETE ROUTES
===================================================== */

// Delete one daily log
router.delete("/daily/:id", async (req, res) => {
  try {
    const deleted = await UsageLog.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Daily log not found" });
    res.json({ message: "✅ Daily log deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting daily log:", err);
    res.status(500).json({ message: "Failed to delete daily log" });
  }
});

// Delete all daily logs
router.delete("/daily", async (_req, res) => {
  try {
    await UsageLog.deleteMany({ logType: "daily" });
    res.json({ message: "🗑️ All daily logs deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting daily logs:", err);
    res.status(500).json({ message: "Failed to delete all daily logs" });
  }
});

// Delete one month’s logs
router.delete("/monthly/:id", async (req, res) => {
  try {
    const month = parseInt(req.params.id, 10);
    if (isNaN(month) || month < 1 || month > 12)
      return res.status(400).json({ message: "Invalid month ID" });

    const result = await UsageLog.deleteMany({
      logType: "monthly",
      $expr: { $eq: [{ $month: "$date" }, month] },
    });

    if (result.deletedCount === 0)
      return res
        .status(404)
        .json({ message: `No logs found for month ${month}` });

    res.json({ message: `✅ Monthly logs for month ${month} deleted` });
  } catch (err) {
    console.error("❌ Error deleting monthly logs:", err);
    res.status(500).json({ message: "Failed to delete monthly logs" });
  }
});

// Delete all monthly logs
router.delete("/monthly", async (_req, res) => {
  try {
    await UsageLog.deleteMany({ logType: "monthly" });
    res.json({ message: "🗑️ All monthly logs deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting monthly logs:", err);
    res.status(500).json({ message: "Failed to delete all monthly logs" });
  }
});

module.exports = router;
