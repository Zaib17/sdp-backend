const mongoose = require("mongoose");

const usageLogSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },

  streetInput: { type: Number, required: true },
  toNext: { type: Number, required: true },
  houseTotal: { type: Number, required: true },

  powerLoss: { type: Number, required: true },

  theftAlert: {
    type: String,
    enum: ["No Theft", "Theft Detected", "System Fault", "Light Cut Off"],
    default: "No Theft",
  },

  logType: {
    type: String,
    enum: ["daily", "monthly"],
    required: true,
  },
});

module.exports = mongoose.model("UsageLog", usageLogSchema);
