const me = guard(["trainee"]);
document.getElementById("meName").textContent = me.name;
document.getElementById("hiName").textContent = me.name.split(" ")[0];
document.getElementById("av").textContent = initials(me.name);
api("/users/me").then(u => { document.getElementById("meEmail").textContent = u.email; }).catch(() => {});

/* demo modules — "Working at Height" opens the live 360° scene */
const modules = [
  { t: "Working at Height", d: "360° spot-the-hazard scene + quiz.", pct: 60, tag: "brand", link: "360.html", cta: "Enter 360° scene →" },
  { t: "Manual Handling", d: "Safe lifting technique and posture.", pct: 100, tag: "green", done: true },
  { t: "Fire Safety", d: "Extinguisher types and evacuation.", pct: 40, tag: "amber" },
  { t: "PPE & Signage", d: "Personal protective equipment basics.", pct: 0, tag: "gray" },
  { t: "Vehicle & Forklift Safety", d: "Pedestrian and traffic separation.", pct: 0, tag: "gray" },
  { t: "Hazardous Materials", d: "Storage, labelling and spill response.", pct: 0, tag: "gray" },
];
function modCard(m) {
  const status = m.done ? `<span class="chip green">✓ Completed</span>`
    : m.pct > 0 ? `<span class="chip ${m.tag}">In progress</span>` : `<span class="chip gray">Not started</span>`;
  const btn = m.link
    ? `<button class="btn sm" style="align-self:flex-start;margin-top:4px" onclick="location.href='${m.link}'">${m.cta}</button>`
    : `<button class="btn sm ghost" style="align-self:flex-start;margin-top:4px">${m.pct ? "Continue" : "Start"}</button>`;
  return `<div class="card mod"><div style="display:flex;justify-content:space-between;align-items:center">
      <div class="t">${m.t}</div>${status}</div>
    <div class="d">${m.d}</div>
    <div class="bar" style="margin:6px 0 2px"><i style="width:${m.pct}%"></i></div>
    <div style="font-size:12px;color:var(--mut)">${m.pct}% complete</div>${btn}</div>`;
}
const html = modules.map(modCard).join("");
document.getElementById("modGrid").innerHTML = modules.slice(0, 3).map(modCard).join("");
document.getElementById("modGrid2").innerHTML = html;

function show(v) {
  ["dashboard", "modules", "password"].forEach(x => {
    document.getElementById("view-" + x).classList.toggle("hidden", x !== v);
    document.querySelector(`.nav a[data-v="${x}"]`)?.classList.toggle("on", x === v);
  });
  document.getElementById("pageTitle").textContent =
    { dashboard: "Dashboard", modules: "Training modules", password: "Change password" }[v];
  if (window.innerWidth <= 820) { document.querySelector(".side").classList.remove("open"); document.querySelector(".scrim").classList.remove("show"); }
}

async function changeMyPassword() {
  const m = document.getElementById("pMsg");
  const cur = document.getElementById("pCur").value;
  const nw = document.getElementById("pNew").value;
  const cf = document.getElementById("pConf").value;
  if (nw.length < 6) { m.textContent = "New password must be at least 6 characters."; m.className = "msg err"; return; }
  if (nw !== cf) { m.textContent = "The two new passwords do not match."; m.className = "msg err"; return; }
  try {
    await api("/users/me/password", "PATCH", { currentPassword: cur, newPassword: nw });
    m.textContent = "✓ Password updated."; m.className = "msg ok";
    ["pCur", "pNew", "pConf"].forEach(id => document.getElementById(id).value = "");
  } catch (e) { m.textContent = e.message; m.className = "msg err"; }
}

maybeForcePassword();
