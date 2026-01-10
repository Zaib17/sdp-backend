const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Admin = require("./models/Admin");

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Admin.deleteMany({});
  console.log("✅ All admins deleted");
  process.exit();
});
