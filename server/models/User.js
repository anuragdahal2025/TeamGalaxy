const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // three roles now: admin (full), subadmin (stands in for admin, trainees only), trainee
    role: { type: String, enum: ["trainee", "subadmin", "admin"], default: "trainee" },
    active: { type: Boolean, default: true },
    // when true, the user is forced to set their own password before using the app
    mustChangePassword: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
