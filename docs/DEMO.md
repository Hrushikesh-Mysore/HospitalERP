# 5-minute judge demo

Cast: **laptop** = Reception/Doctor/Admin (role switcher, top right). **Phone** = Patient. **TV or second tab** = `/display`.

## Setup checklist (do this 10 minutes before)
- [ ] Hotspot on (phone or router). Laptop and phone on the same network; hotspot-only clients can isolate, see README "Troubleshooting".
- [ ] Laptop: `npm run dev:lan`. Terminal prints `http://<laptop-ip>:5173` and a QR code. Note the IP.
- [ ] Phone: scan the QR (or type the URL). Grey top-bar dot = live stream down, wait for green.
- [ ] Laptop: sidebar **Reset demo data**. Do it again right before you start, so tokens D7-001/D7-002 exist and nothing is half-used.
- [ ] Laptop tab 1 `/` as **Admin**; tab 2 `/display` full screen (F11); phone on the "Who are you?" screen (role **Patient**).
- [ ] Browser zoom 110-125% on the laptop; phone brightness up and auto-lock off.
- [ ] Backup screen recording of the full run open in a player. Fake sample files are in `samples/`.

## Timed script
| Time | Do (exact clicks) | Say |
|---|---|---|
| 0:00 | Slide or Overview, nothing clicked yet | "Hospitals juggle front desk, doctors, beds and waiting rooms on separate screens. MediCore puts them on one live backend." |
| 0:30 | Laptop, Admin, **Overview**: point at KPIs, weekly admissions chart, activity feed | "Admin sees occupancy, admissions and appointments by department. All fake data, seeded relative to today." |
| 0:50 | Role switcher → **Receptionist**, open **Booking** (`/appointments`), keep the day strip on today | "Reception works from this screen. Watch it while a patient books from their phone." |
| 1:10 | Phone: role Patient → tap **Pooja Nair** (demo patient). Tab **Book**: pick **Dr. Anil Rao**, today, a free time, **Confirm booking** | "The patient picks from free slots only. A taken slot returns a 409 with a clear message." |
| 1:40 | Laptop, no reload: new row under Dr. Anil Rao appears | "That is server-sent events: the server pushed it, nothing polled." |
| 1:55 | Phone: in **My appointments** tap **Check in** → confetti, token **D1-001** on **My Token** | "Check-in issues a token, numbered by the server per doctor per day." |
| 2:15 | Show `/display`: D1-001 under Dr. Anil Rao as "Next" | "This is the waiting-room board. Same backend, third interface." |
| 2:30 | **Network tab** (F12 on the laptop) open. Role → **Doctor**, doctor picker **Dr. Anil Rao**, **Queue**. Click **Call next (D1-001)**. Click the `call-next` request | "Request: `POST /api/tokens/doctors/1/call-next`. Reply: JSON. One backend, three interfaces." |
| 2:55 | `/display` flips to "Now serving D1-001"; phone My Token says "It's your turn" | "Phone, board and doctor changed together." |
| 3:10 | Doctor: **Start consult**, **Finish** (optional, if time) | "Every status change is validated against a rules table and stored in history." |
| 3:20 | Phone: **Records** tab → **Add prescription** → take a photo of any paper (fake). Thumbnail appears | "The phone camera uploads a compressed image. The server checks the file signature, not just the extension." |
| 3:50 | Laptop: role **Admin** → **Emergency** → **Add emergency case**: name, age, complaint, priority **P1 Critical** | "Triage is a separate queue ordered by priority, then arrival." |
| 4:10 | The case lands under the two earlier P1 cases and above every P2 to P4. Click **Assign bed**, pick a free bed on **Beds** | "A critical patient jumps every lower-priority case. Assigning a bed admits them." |
| 4:30 | **Beds**: occupancy bar went up. Click that occupied bed → **Discharge** | "Admit and discharge are the only way bed and patient status change, so they cannot drift." |
| 4:50 | Close: roles, live sync, phone and TV | "Three interfaces, one backend, live. Questions?" |

## Likely judge questions
1. **Why no database?** Hackathon scope: in-memory data seeded from `server/data/seed.js` keeps setup to one command and makes Reset exact. The store sits behind one module, so swapping in Postgres means changing that layer.
2. **How is it secure?** helmet, rate limiting (300/min), zod validation on writes, upload signature and size checks, and per-patient session tokens on patient routes. The role headers are demo-level and we say so.
3. **How does live sync work?** `GET /api/events` is a Server-Sent Events stream. After each successful write the server broadcasts the resource name and clients refetch it, with a 5-second polling fallback.
4. **What about real login?** Not built. Production needs real authentication (OTP or an identity provider), server-side sessions and role claims taken from the verified identity, not headers.
5. **How would it scale?** State is in one process, so first move data to a database and fan SSE out through Redis pub/sub or a message queue. Then run several API instances behind a load balancer.
6. **Privacy of patient data?** Demo data is fake. For real data we would need authentication, encryption at rest and in transit, access logs and retention rules. Patients can already only reach their own records.
7. **Why first-come-first-served tokens?** It is predictable and fair, and tokens are ordered by issue time so a skipped patient returns to their original place. Emergency triage stays separate and higher priority.
8. **What's next?** Real authentication, a database, SMS/WhatsApp "you're next" alerts, and e-prescriptions from the doctor view. (Those are plans, not built.)

## Failure plan
- **Wi-Fi drops:** the laptop UI keeps working on `localhost:5173` (same server). Phone loses the page: switch the phone to the hotspot again, reload, sign back in. If it does not return in 20 s, narrate over the **backup video** and continue on the laptop with the role switcher.
- **Server crashes:** restart `npm run dev:lan` (data resets to the seed, same as Reset). Reload every device; the phone shows "Who are you?" again. If the QR changed, rescan.
- **A screen goes blank:** hard reload (Ctrl+Shift+R). If the token page stays blank, open `/token/D1-001` directly. Still blank: Network tab, look for a red request, then fall back to the backup video.
- **Slot or token conflict surprises you:** that is the 409 rule working; say so and pick another doctor or slot.
