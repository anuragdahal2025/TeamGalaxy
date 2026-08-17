require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const email = "admin@galaxy.com";
  const exists = await User.findOne({ email });
  if (exists) { console.log("Admin already exists"); process.exit(); }
  const passwordHash = await bcrypt.hash("Admin123", 10);
  await User.create({ name: "Admin", email, passwordHash, role: "admin" });
  console.log("Admin created: admin@galaxy.com / Admin123");
  process.exit();
}
run();
