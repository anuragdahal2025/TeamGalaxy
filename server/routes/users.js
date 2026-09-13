const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { verifyToken, requireAdmin, requireStaff } = require("../middleware/auth");

const router = express.Router();

const safe = (u) => ({
  id: u._id, name: u.name, email: u.email, role: u.role,
  active: u.active, mustChangePassword: u.mustChangePassword, createdAt: u.createdAt,
});

/* current signed-in user */
router.get("/me", verifyToken, async (req, res) => {
  const u = await User.findById(req.user.id);
  if (!u) return res.status(404).json({ message: "User not found." });
  res.json(safe(u));
});

/* CHANGE MY OWN PASSWORD — any signed-in user. */
router.patch("/me/password", verifyToken, async (req, res) => {
  try {
    const currentPassword = req.body.currentPassword || "";
    const newPassword = req.body.newPassword || "";
    if (newPassword.length < 6)
      return res.status(400).json({ message: "New password must be at least 6 characters." });

    const u = await User.findById(req.user.id);
    if (!u) return res.status(404).json({ message: "User not found." });

    const ok = await bcrypt.compare(currentPassword, u.passwordHash);
    if (!ok) return res.status(400).json({ message: "Your current password is incorrect." });

    u.passwordHash = await bcrypt.hash(newPassword, 10);
    u.mustChangePassword = false;
    await u.save();
    res.json({ message: "Password updated." });
  } catch (e) {
    res.status(500).json({ message: "Could not update password." });
  }
});

/* list of TRAINEES (staff) */
router.get("/", verifyToken, requireStaff, async (req, res) => {
  const list = await User.find({ role: "trainee" }).sort({ createdAt: -1 });
  res.json(list.map(safe));
});

/* list of SUB-ADMINS (admin only) */
router.get("/staff", verifyToken, requireAdmin, async (req, res) => {
  const list = await User.find({ role: "subadmin" }).sort({ createdAt: -1 });
  res.json(list.map(safe));
});

// helper: can the requester manage this target?
async function loadManageable(req, res) {
  const target = await User.findById(req.params.id);
  if (!target) { res.status(404).json({ message: "User not found." }); return null; }
  if (target.role === "admin") { res.status(403).json({ message: "Admin accounts cannot be changed here." }); return null; }
  // sub-admins may only manage trainees
  if (req.user.role === "subadmin" && target.role !== "trainee") {
    res.status(403).json({ message: "Sub-admins can only manage trainees." }); return null;
  }
  return target;
}

/* edit name / email (staff: sub-admin limited to trainees) */
router.patch("/:id", verifyToken, requireStaff, async (req, res) => {
  try {
    const target = await loadManageable(req, res);
    if (!target) return;
    if (req.body.name) target.name = req.body.name.trim();
    if (req.body.email) {
      const email = req.body.email.toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ message: "A valid email is required." });
      target.email = email;
    }
    await target.save();
    res.json(safe(target));
  } catch (e) {
    res.status(500).json({ message: "Could not update the account." });
  }
});

/* activate / deactivate — ADMIN ONLY */
router.patch("/:id/active", verifyToken, requireAdmin, async (req, res) => {
  const target = await loadManageable(req, res);
  if (!target) return;
  target.active = !!req.body.active;
  await target.save();
  res.json(safe(target));
});

/* RE-ISSUE A TEMPORARY PASSWORD (staff: sub-admin limited to trainees). */
router.patch("/:id/reissue-temp", verifyToken, requireStaff, async (req, res) => {
  try {
    const target = await loadManageable(req, res);
    if (!target) return;
    const temp = "Tg" + Math.random().toString(36).slice(2, 8) + Math.floor(10 + Math.random() * 89);
    target.passwordHash = await bcrypt.hash(temp, 10);
    target.mustChangePassword = true;
    await target.save();
    res.json({ message: "Temporary password issued.", tempPassword: temp });
  } catch (e) {
    res.status(500).json({ message: "Could not issue a temporary password." });
  }
});

/* DELETE an account permanently — ADMIN ONLY.
   Nobody can delete an admin account, and you cannot delete yourself. */
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const target = await loadManageable(req, res);
    if (!target) return;
    if (String(target._id) === String(req.user.id))
      return res.status(400).json({ message: "You cannot delete your own account." });
    await target.deleteOne();
    res.json({ message: "Account deleted." });
  } catch (e) {
    res.status(500).json({ message: "Could not delete the account." });
  }
});

module.exports = router;