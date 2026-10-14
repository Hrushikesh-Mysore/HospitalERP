# PLAN

## Phase 1 — Foundation + Overview
- [x] git init; install react-router-dom recharts lucide-react
- [x] Design tokens in src/index.css via @theme
- [x] Layout shell: sidebar, top bar (search, bell, role switcher), mobile collapse
- [x] UI kit in src/components/ui: Button, Card, Badge, StatCard, Table, Modal, SlideOver, Skeleton, Toast
- [x] Overview page: 4 KPIs, weekly admissions line chart, appointments-by-dept bar chart, activity feed (mock in src/data)

## Phase 2 — Backend + API
- [x] Express in /server (ESM): helmet, cors (localhost:5173), rate-limit, json limit 10kb, zod on POST/PATCH, central error handler, .env/.env.example
- [x] Fake data: 40 patients, 8 doctors/5 depts, 30 beds/3 wards, 25 appointments, 8 emergency cases
- [x] Endpoints: stats, patients, appointments, beds (admit/discharge/cleaning), emergency (assign-bed), demo/reset
- [x] Business logic: admit/discharge sync, 409 slot conflicts, triage sort, assign-bed admits
- [x] Vite proxy /api -> :3001; src/lib/api.js + useFetch; Overview wired to /api/stats
- [x] Scripts: server, dev:all

## Phase 3 — Patients + Appointments
- [x] Patients table (search/filter/sort/paginate), SlideOver details, Add patient modal
- [x] Appointments: date strip, timeline by doctor, status change, Book modal with inline 409 error

## Phase 4 — Beds + Emergency
- [ ] Beds: ward tabs, tile grid, legend, popover actions, live occupancy bars
- [ ] Emergency: triage queue, wait timers, 5s polling, critical pulse, add case form, assign bed -> Beds

## Phase 5 — Roles + Usage
- [ ] Role switcher changes sidebar + Overview widgets
- [ ] Quick Tour (5 steps) + "?" How-to panel
- [ ] Empty states with CTA
- [ ] Ctrl+K quick search (cut first if short)

## Phase 6 — Polish + Demo
- [ ] Responsive pass 375/768/1280
- [ ] Spacing, skeletons, error states, transitions
- [ ] Title + favicon
- [ ] Reset demo data button
- [ ] README (pitch, features, run steps, 3-min demo script)
- [ ] npm run build clean
