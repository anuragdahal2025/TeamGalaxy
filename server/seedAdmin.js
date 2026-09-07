// Run once:  node seedAdmin.js
// Creates the first full admin account so you can log in and create everyone else.
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const email = "admin@galaxy.com";
  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin already exists:", email);
    process.exit(0);
  }
  const passwordHash = await bcrypt.hash("Admin123", 10);
  await User.create({
    name: "System Admin",
    email,
    passwordHash,
    role: "admin",
    active: true,
    mustChangePassword: false, // demo admin can log straight in; change it later from the dashboard
  });
  console.log("Admin created:  admin@galaxy.com  /  Admin123");
  process.exit(0);
})();
