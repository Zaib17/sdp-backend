const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, default: "Zaib" },
  uId: { type: String, required: true, default: "14506" }, // ID
  email: { type: String, required: true, unique: true, default: "zaibuniversity@gmail.com" },
  designation: { type: String, default: "Student" },
  area: { type: String, default: "Korangi 17" },
  profilePic: { type: String, default: "" }, // path to uploaded file
  password: { type: String, required: true }, // hashed
});

module.exports = mongoose.model('Admin', adminSchema);
