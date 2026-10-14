# MediCore — Hospital Management Dashboard

MediCore is a role-aware hospital dashboard that keeps patients, appointments, beds and the emergency queue in sync through a validated Express API. Admitting a patient occupies a bed and updates every stat, double-booked doctors are rejected with a clear message, and emergency cases are triaged by priority and can be assigned straight to a bed. Built in 90 minutes with React, Vite, Tailwind v4 and framer-motion. All data is fake and held in memory.

## Features
- Live Overview: KPIs computed from the API, admissions and department charts, activity feed
- Patients: search, filter (status, ward), sort, pagination, detail slide-over with vitals and history, add-patient form
- Appointments: date strip, per-doctor timeline, status actions, booking with server-side slot-conflict (409) handling
- Beds: ward tabs, status-coloured grid, admit / discharge / cleaning, live occupancy bars
- Emergency: triage queue (priority, then arrival), live wait timers, 5s polling, pulsing critical cases, assign-to-bed flow
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

## 3-minute demo script
1. **0:00 Overview** — point out live KPIs and charts. Close the Quick Tour, open "?" to show per-role how-tos.
2. **0:30 Patients** — search "Aarav", filter Admitted, click a row for vitals and history. Add a patient (show validation first).
3. **1:15 Appointments** — book Dr. Anil Rao at 09:00 on today's date to show the 409 conflict, then pick a free slot. Confirm one appointment.
4. **2:00 Emergency → Beds** — show the pulsing P1 cases and timers, add a P1 case (it jumps to the top), click Assign bed, pick a free bed. Watch the occupancy bar move; discharge from Beds.
5. **2:40 Roles** — switch to Doctor, then Receptionist, to show the changed sidebar and widgets. Press Ctrl+K to search. Finish with Reset demo data.
