const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyToken, requireStaff } = require("../middleware/auth");

const router = express.Router();

/* ---------- LOGIN ---------- */
router.post("/login", async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    const password = req.body.password || "";
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password." });
    if (!user.active) return res.status(403).json({ message: "This account has been deactivated. Contact your admin." });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid email or password." });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (e) {
    res.status(500).json({ message: "Server error, please try again." });
  }
});

/* ---------- CREATE ACCOUNT (staff only) ----------
   Admin  -> can create trainees and sub-admins
   Subadmin -> can create trainees only
   Password given here is a TEMPORARY one; the new user must change it on first login. */
router.post("/register", verifyToken, requireStaff, async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").toLowerCase().trim();
    const password = req.body.password || "";
    let role = req.body.role === "subadmin" ? "subadmin" : "trainee";

    // a sub-admin can never create another sub-admin or an admin
    if (req.user.role === "subadmin") role = "trainee";

    if (!name) return res.status(400).json({ message: "Name is required." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: "A valid email is required." });
    if (password.length < 6)
      return res.status(400).json({ message: "Temporary password must be at least 6 characters." });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "That email is already registered." });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role, mustChangePassword: true });

    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    res.status(500).json({ message: "Could not create the account." });
  }
});

module.exports = router;
