# Team Galaxy — 360° Health & Safety Training (Sprint 1.5)

Multi-file build with: sub-admin role, self-service passwords, clean light theme.

## Run locally
1. In the `server` folder, create a file named `.env` (copy `.env.example` and fill in your real
   MongoDB Atlas URI and a JWT secret).
2. Open a terminal in the `server` folder:
   npm install
   node seedAdmin.js      # first time only – creates admin@galaxy.com / Admin123
   node server.js
3. Open the address it prints (e.g. http://localhost:5050).

## Roles
- Admin: manage trainees AND sub-admins, reset access for anyone.
- Sub-admin: stand-in for admin; manage trainees only.
- Trainee: training + change own password.

## Passwords
Staff never see real passwords. New users get a temporary password and must set their own
on first login. "Reset access" issues a one-time code if someone is locked out.
