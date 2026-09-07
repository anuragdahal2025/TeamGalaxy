/* ===== Team Galaxy — shared front-end helpers ===== */
// Works both locally (http://localhost:5050) and on the deployed site (same origin).
const API = (location.protocol.startsWith("http") && location.host)
  ? "/api"
  : "http://localhost:5050/api";

const TG = {
  token: () => localStorage.getItem("tg_token"),
  user:  () => { try { return JSON.parse(localStorage.getItem("tg_user") || "null"); } catch { return null; } },
  save:  (token, user) => { localStorage.setItem("tg_token", token); localStorage.setItem("tg_user", JSON.stringify(user)); },
  patchUser: (p) => { const u = TG.user() || {}; localStorage.setItem("tg_user", JSON.stringify({ ...u, ...p })); },
  logout: () => { localStorage.removeItem("tg_token"); localStorage.removeItem("tg_user"); location.href = "index.html"; },
};

// central fetch wrapper — attaches token, throws readable errors, auto-logs-out on 401
async function api(path, method = "GET", body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(TG.token() ? { Authorization: "Bearer " + TG.token() } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && TG.token()) { TG.logout(); return; }
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

// page guard — call at top of each dashboard. roles = allowed roles array.
function guard(roles) {
  const u = TG.user();
  if (!TG.token() || !u) { location.href = "index.html"; return null; }
  if (roles && !roles.includes(u.role)) {
    location.href = u.role === "trainee" ? "trainee.html" : "admin.html";
    return null;
  }
  return u;
}

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase() || "U";
}

/* ---- mobile sidebar toggle ---- */
function toggleSide() {
  document.querySelector(".side")?.classList.toggle("open");
  document.querySelector(".scrim")?.classList.toggle("show");
}

/* ---- forced first-login password change ----
   Any page that includes the #force overlay markup can call maybeForcePassword(). */
function maybeForcePassword() {
  const u = TG.user();
  if (u && u.mustChangePassword) document.getElementById("force")?.classList.add("show");
}
async function submitForcedPassword() {
  const m = document.getElementById("forceMsg");
  const cur = document.getElementById("fCur").value;
  const nw  = document.getElementById("fNew").value;
  const cf  = document.getElementById("fConf").value;
  if (nw.length < 6) { m.textContent = "New password must be at least 6 characters."; m.className = "msg err"; return; }
  if (nw !== cf)     { m.textContent = "The two new passwords do not match."; m.className = "msg err"; return; }
  try {
    await api("/users/me/password", "PATCH", { currentPassword: cur, newPassword: nw });
    TG.patchUser({ mustChangePassword: false });
    m.textContent = "Password set — welcome!"; m.className = "msg ok";
    setTimeout(() => document.getElementById("force").classList.remove("show"), 700);
  } catch (e) { m.textContent = e.message; m.className = "msg err"; }
}
