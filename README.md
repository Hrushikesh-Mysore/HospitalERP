# MediCore — Hospital Management Dashboard

MediCore is a role-aware hospital dashboard that keeps patients, appointments, beds and the emergency queue in sync through a validated Express API. Admitting a patient occupies a bed and updates every stat, double-booked doctors are rejected with a clear message, and emergency cases are triaged by priority and can be assigned straight to a bed. Built in 90 minutes with React, Vite, Tailwind v4 and framer-motion. All data is fake and held in memory.

## Features
- Live Overview: KPIs computed from the API, admissions and department charts, activity feed
- Patients: search, filter (status, ward), sort, pagination, detail slide-over with vitals and history, add-patient form
- Patient records: Admin and Receptionist can edit; only Admin can delete (UI-enforced, the demo API has no auth). Delete is blocked while admitted (409), cancels future appointments, marks past open ones no-show, drops matching waiting emergency cases, and offers a 5s Undo
- Appointments: date strip, per-doctor timeline, Confirm / Complete / Cancel / No-show actions (cancelled and no-show free the slot), booking with server-side slot-conflict (409) handling
- Beds: ward tabs, status-coloured grid, admit / discharge / cleaning, live occupancy bars
- Emergency: triage queue (priority, then arrival), live wait timers, pulsing critical cases, assign-to-bed flow
- Live sync: changes made on one device appear on every other open device within a moment (Server-Sent Events, 5s polling fallback); a green "Live" dot in the top bar shows the connection
- Queue tokens (first come, first served): reception issues per-doctor tokens (D2-014) for walk-ins or booked appointments; doctors use Call next / Start / Finish / Skip / Recall; positions and estimated waits (avg consult minutes x people ahead) update live. Emergency triage stays a separate, higher-priority queue
- Waiting-room board at `/display` (token codes only, no names) and a patient phone view at `/token/D2-014`
- Patient documents: add a prescription, report or scan from a phone camera (`capture="environment"`) or a file; photos are shrunk to 1600px in the browser, shown as thumbnails with a full-screen viewer, and deleted after a confirm. Server accepts only real JPEG/PNG/WebP/PDF (checked by file signature), max 5 MB, stored under random names in `server/uploads/` (git-ignored, cleared on reset and on server start)
- Roles: Admin, Doctor and Receptionist change the sidebar and Overview
- Onboarding: Quick Tour, "?" how-to panel, Ctrl+K search, helpful empty states
- Security basics: helmet, restricted CORS, rate limiting, 10kb body limit, zod validation, no stack traces in errors

## Run
```bash
npm install
cp .env.example .env     # defaults work as-is
npm run dev:all          # frontend http://localhost:5173, API http://localhost:3001
npm run build            # production build
```
Use "Reset demo data" in the sidebar to restore the seed data.

## Open it on a phone (live sync demo)
Both devices must be on the same network. A phone hotspot works well and needs no router.
1. Turn on a hotspot on your phone, or join any Wi-Fi, and connect the laptop to it. (If the phone is the hotspot, use a *second* device to scan, or just type the URL into the phone browser.)
2. On the laptop run `npm run dev:lan`.
3. The terminal prints `Open on your phone: http://<laptop-ip>:5173` and a QR code. Scan it with the phone camera, or type the URL.
4. Both screens show a green **Live** dot. Change something on one (admit a bed, add an emergency case) and watch the other update without a refresh.

### Troubleshooting
- **Page won't load on the phone**: confirm both devices are on the same network and the URL uses the laptop's LAN IP, not `localhost`. Some guest/office Wi-Fi isolates clients; use a hotspot instead.
- **Firewall**: allow inbound TCP 5173 (Vite). Linux: `sudo ufw allow 5173/tcp`. Windows: allow Node.js on Private networks. macOS: allow incoming connections for Node when prompted. Port 3001 is only reached through the Vite proxy, so it does not need opening.
- **Wrong IP / no QR**: the server picks the first private IPv4 address. With VPNs or several adapters it may choose the wrong one; run `ip addr` / `ipconfig` and type the right address by hand.
- **Port 5173 already in use**: Vite silently moves to 5174, so the printed URL and QR are wrong. Stop the other dev server, or set `CLIENT_PORT` in `.env` to the port Vite reports.
- **Grey dot / "Offline"**: the live stream is not connected. The app keeps working by polling every 5s. Check that the API is running (`npm run dev:lan` starts both) and that no proxy or VPN is buffering `/api/events`.
- **Data differs between devices**: both must talk to the same laptop. Data lives in server memory, so restarting the server or pressing "Reset demo data" resets everyone.

## Queue tokens
- **Reception** (Admin / Receptionist) > Queue > *Issue token*: check in a booked appointment or add a walk-in. The result shows the token, position and a phone link (uses the laptop's LAN address, so it opens on a phone on the same network).
- **Doctor** > My Queue: *Call next* calls the earliest-issued waiting token. One patient at a time: finish or skip before calling again. A skipped token can be recalled and returns to its original place in line.
- **TV**: open `/display` on the waiting-room screen (button F11 / the expand icon for full screen).
- **Phone**: `/token/D2-014` shows the token, people ahead, estimated wait and "You're next". `/token` asks for the code.
- Estimated wait uses 10 min per consult until 3 consults are finished that day, then the doctor's measured average.
- Counters restart each day; "Reset demo data" clears all tokens.
- Tests: `npm test` starts the API on a spare port and checks ordering, numbering, recall and guards.

## Documents (demo-safe)
- Use only the fake files in `samples/` (prescription, report, scan, discharge PDF), never real patient documents. Each is labelled "SAMPLE - FAKE DATA".
- Upload API: `POST /api/patients/:id/documents` (multipart: `category` = prescription | report | scan, and `file`), `GET` the list, `GET .../:docId/file`, `DELETE .../:docId`. Max 20 documents per patient. Files are served only if the patient and document exist.
- Deleting a patient removes their files once the 5s undo window passes.

## 3-minute demo script
1. **0:00 Overview** — point out live KPIs and charts. Close the Quick Tour, open "?" to show per-role how-tos.
2. **0:30 Patients** — search "Aarav", filter Admitted, click a row for vitals and history. Add a patient (show validation first).
3. **1:15 Appointments** — book Dr. Anil Rao at 09:00 on today's date to show the 409 conflict, then pick a free slot. Confirm one appointment.
4. **2:00 Emergency → Beds** — show the pulsing P1 cases and timers, add a P1 case (it jumps to the top), click Assign bed, pick a free bed. Watch the occupancy bar move; discharge from Beds.
5. **2:40 Roles** — switch to Doctor, then Receptionist, to show the changed sidebar and widgets. Press Ctrl+K to search. Finish with Reset demo data.
