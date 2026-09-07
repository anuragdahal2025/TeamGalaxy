const jwt = require("jsonwebtoken");

// Verify the Bearer token and attach the user payload to req.user
function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Not signed in." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, role, name }
    next();
  } catch (e) {
    return res.status(401).json({ message: "Session expired, please sign in again." });
  }
}

// Only a full admin may pass
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ message: "Admins only." });
}

// Staff = admin OR sub-admin (both can manage trainees)
function requireStaff(req, res, next) {
  if (req.user && (req.user.role === "admin" || req.user.role === "subadmin")) return next();
  return res.status(403).json({ message: "Staff access only." });
}

module.exports = { verifyToken, requireAdmin, requireStaff };
