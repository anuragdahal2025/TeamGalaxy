const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { verifyToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Current logged-in user (any role)
router.get("/me", verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  res.json(user);
});

// List all trainees (admin only)
router.get("/", verifyToken, requireAdmin, async (req, res) => {
  const users = await User.find({ role: "trainee" }).select("-passwordHash").sort({ createdAt: -1 });
  res.json(users);
});

// Edit a trainee's name/email (admin only)
router.patch("/:id", verifyToken, requireAdmin, async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { name, email }, { new: true }).select("-passwordHash");
  res.json({ message: "User updated", user });
});

// Deactivate / reactivate a trainee (admin only)
router.patch("/:id/active", verifyToken, requireAdmin, async (req, res) => {
  const { active } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { active }, { new: true }).select("-passwordHash");
  res.json({ message: active ? "Account reactivated" : "Account deactivated", user });
});

// Reset a trainee's password (admin only)
router.patch("/:id/reset-password", verifyToken, requireAdmin, async (req, res) => {
  const { newPassword } = req.body;
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(req.params.id, { passwordHash });
  res.json({ message: "Password reset successfully" });
});

module.exports = router;