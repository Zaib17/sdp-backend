// Run once to create admin
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

(async () => {
  const hashed = await bcrypt.hash("abcd1234", 10);
  await Admin.create({ email: "zaibuniversity@gmail.com", password: hashed });
  console.log("Admin created");
  process.exit();
})();
