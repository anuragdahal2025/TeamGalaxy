// already signed in? go straight to the right dashboard
(() => {
  const u = TG.user();
  if (TG.token() && u) location.href = u.role === "trainee" ? "trainee.html" : "admin.html";
})();

async function login() {
  const m = document.getElementById("loginMsg");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) { m.textContent = "Please enter your email and password."; m.className = "msg err"; return; }
  m.textContent = "Signing in…"; m.className = "msg";
  try {
    const { token, user } = await api("/auth/login", "POST", { email, password });
    TG.save(token, user);
    location.href = user.role === "trainee" ? "trainee.html" : "admin.html";
  } catch (e) { m.textContent = e.message; m.className = "msg err"; }
}

// press Enter to submit
document.addEventListener("keydown", (e) => { if (e.key === "Enter") login(); });
