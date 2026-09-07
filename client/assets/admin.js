const me = guard(["admin", "subadmin"]);
const isAdmin = me && me.role === "admin";

// header
document.getElementById("meName").textContent = me.name;
document.getElementById("av").textContent = initials(me.name);
document.getElementById("roleChip").textContent = isAdmin ? "● ADMIN" : "● SUB-ADMIN";
document.getElementById("roleChip").className = "chip " + (isAdmin ? "brand" : "indigo");

// sub-admins are hidden for a sub-admin user (they can't manage other staff)
if (!isAdmin) {
  ["navStaff", "tileStaff", "cardStaff"].forEach(id => document.getElementById(id)?.classList.add("hidden"));
}

// fill "me email" from server (token only has name/role)
api("/users/me").then(u => { document.getElementById("meEmail").textContent = u.email; }).catch(() => {});

/* ---- view switching ---- */
function show(v) {
  ["dashboard", "trainees", "staff", "password"].forEach(x => {
    document.getElementById("view-" + x).classList.toggle("hidden", x !== v);
    document.querySelector(`.nav a[data-v="${x}"]`)?.classList.toggle("on", x === v);
  });
  document.getElementById("pageTitle").textContent =
    { dashboard: "Dashboard", trainees: "Trainees", staff: "Sub-admins", password: "Change password" }[v];
  if (window.innerWidth <= 820) { document.querySelector(".side").classList.remove("open"); document.querySelector(".scrim").classList.remove("show"); }
}

/* ---- render a user row ---- */
function row(u) {
  const status = u.active
    ? `<span class="pill" style="background:var(--greenTint);color:#0F7A38">Active</span>`
    : `<span class="pill" style="background:var(--redTint);color:#B91C1C">Inactive</span>`;
  const mustCh = u.mustChangePassword
    ? ` <span class="chip gray" title="Has not set their own password yet">temp pw</span>` : "";
  const created = new Date(u.createdAt).toLocaleDateString();
  const toggle = u.active
    ? `<button class="btn sm danger" onclick="toggleActive('${u.id}',false)">Deactivate</button>`
    : `<button class="btn sm ghost" onclick="toggleActive('${u.id}',true)">Activate</button>`;
  return `<tr>
    <td><div class="uname">${esc(u.name)}${mustCh}</div><div class="uemail">${esc(u.email)}</div></td>
    <td>${status}</td>
    <td style="color:var(--mut)">${created}</td>
    <td><div class="acts" style="justify-content:flex-end">
      <button class="btn sm ghost" onclick="openEdit('${u.id}','${esc(u.name)}','${esc(u.email)}')">Edit</button>
      ${toggle}
      <button class="btn sm ghost" onclick="reissue('${u.id}','${esc(u.name)}')">Reset access</button>
    </div></td></tr>`;
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---- loads ---- */
async function loadTrainees() {
  try {
    const list = await api("/users");
    document.getElementById("traineeRows").innerHTML =
      list.length ? list.map(row).join("") : `<tr><td colspan="4" style="color:var(--mut)">No trainees yet — add your first one.</td></tr>`;
    document.getElementById("kTotal").textContent = list.length;
    document.getElementById("kActive").textContent = list.filter(u => u.active).length;
  } catch (e) { document.getElementById("traineeRows").innerHTML = `<tr><td colspan="4" style="color:var(--red)">${e.message}</td></tr>`; }
}
async function loadStaff() {
  if (!isAdmin) return;
  try {
    const list = await api("/users/staff");
    document.getElementById("staffRows").innerHTML =
      list.length ? list.map(row).join("") : `<tr><td colspan="4" style="color:var(--mut)">No sub-admins yet.</td></tr>`;
    document.getElementById("kStaff").textContent = list.length;
  } catch (e) { document.getElementById("staffRows").innerHTML = `<tr><td colspan="4" style="color:var(--red)">${e.message}</td></tr>`; }
}

/* ---- modals ---- */
function closeM(id) { document.getElementById(id).classList.remove("show"); }
let createRole = "trainee";
function openCreate(role) {
  createRole = role;
  document.getElementById("createTitle").textContent = role === "subadmin" ? "New sub-admin" : "New trainee";
  ["cName", "cEmail", "cPass"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("cMsg").textContent = "";
  document.getElementById("mCreate").classList.add("show");
}
async function createAccount() {
  const m = document.getElementById("cMsg");
  const name = document.getElementById("cName").value.trim();
  const email = document.getElementById("cEmail").value.trim();
  const password = document.getElementById("cPass").value;
  if (!name) return fail(m, "Please enter the full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(m, "Please enter a valid email (e.g. name@galaxy.com).");
  if (password.length < 6) return fail(m, "Temporary password must be at least 6 characters.");
  try {
    await api("/auth/register", "POST", { name, email, password, role: createRole });
    m.textContent = "✓ Account created — share the email & temporary password."; m.className = "msg ok";
    loadTrainees(); loadStaff();
    setTimeout(() => closeM("mCreate"), 1100);
  } catch (e) { fail(m, e.message); }
}
function openEdit(id, name, email) {
  document.getElementById("eId").value = id;
  document.getElementById("eName").value = name;
  document.getElementById("eEmail").value = email;
  document.getElementById("eMsg").textContent = "";
  document.getElementById("mEdit").classList.add("show");
}
async function saveEdit() {
  const m = document.getElementById("eMsg");
  const id = document.getElementById("eId").value;
  const name = document.getElementById("eName").value.trim();
  const email = document.getElementById("eEmail").value.trim();
  try {
    await api("/users/" + id, "PATCH", { name, email });
    m.textContent = "✓ Saved."; m.className = "msg ok";
    loadTrainees(); loadStaff();
    setTimeout(() => closeM("mEdit"), 800);
  } catch (e) { fail(m, e.message); }
}
async function toggleActive(id, active) {
  try { await api("/users/" + id + "/active", "PATCH", { active }); loadTrainees(); loadStaff(); }
  catch (e) { alert(e.message); }
}
async function reissue(id, name) {
  if (!confirm(`Issue a new one-time temporary password for ${name}? Their current password will stop working.`)) return;
  try {
    const r = await api("/users/" + id + "/reissue-temp", "PATCH", {});
    document.getElementById("tempFor").textContent = name;
    document.getElementById("tempCode").textContent = r.tempPassword;
    document.getElementById("mTemp").classList.add("show");
    loadTrainees(); loadStaff();
  } catch (e) { alert(e.message); }
}
function fail(m, t) { m.textContent = t; m.className = "msg err"; }

/* ---- change my own password ---- */
async function changeMyPassword() {
  const m = document.getElementById("pMsg");
  const cur = document.getElementById("pCur").value;
  const nw = document.getElementById("pNew").value;
  const cf = document.getElementById("pConf").value;
  if (nw.length < 6) return fail(m, "New password must be at least 6 characters.");
  if (nw !== cf) return fail(m, "The two new passwords do not match.");
  try {
    await api("/users/me/password", "PATCH", { currentPassword: cur, newPassword: nw });
    m.textContent = "✓ Password updated."; m.className = "msg ok";
    ["pCur", "pNew", "pConf"].forEach(id => document.getElementById(id).value = "");
  } catch (e) { fail(m, e.message); }
}

// close modal when clicking the dark backdrop
document.querySelectorAll(".modalbg").forEach(bg =>
  bg.addEventListener("click", e => { if (e.target === bg) bg.classList.remove("show"); }));

// go
maybeForcePassword();
loadTrainees();
loadStaff();
