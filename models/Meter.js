const mongoose = require("mongoose");

const meterSchema = new mongoose.Schema({
  meterId: { type: String, required: true, unique: true },     // Unique ID for each meter
  name: { type: String, required: true },                      // Meter name or label
  owner: { type: String },                                     // Owner name or reference (optional)

  // 🆕 Added field: defines the type of meter
  type: { 
    type: String,
    enum: ["streetInput", "house", "toNext"],                  // Only allow these 3 types
    required: true
  },

  watts: { type: Number, default: 0 },
  power: { type: Number, default: 0 },
  voltage: { type: Number, default: 0 },
  current: { type: Number, default: 0 },
  units: { type: Number, default: 0 },
  status: { type: String, default: "Online" },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Meter", meterSchema);
