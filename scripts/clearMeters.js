// scripts/clearMeters.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Meter = require("../models/Meter");

// Load .env configuration (must contain MONGO_URI)
dotenv.config();

async function clearMeters() {
  try {
    // Connect MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Delete all Meter records
    const result = await Meter.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} old meter records`);

    await mongoose.disconnect();
    console.log("✅ Disconnected successfully");
  } catch (error) {
    console.error("❌ Error clearing meters:", error);
  }
}

clearMeters();
