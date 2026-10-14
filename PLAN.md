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
- [x] Beds: ward tabs, tile grid, legend, popover actions, live occupancy bars
- [x] Emergency: triage queue, wait timers, 5s polling, critical pulse, add case form, assign bed -> Beds

## Phase 5 — Roles + Usage
- [x] Role switcher changes sidebar + Overview widgets
- [x] Quick Tour (5 steps) + "?" How-to panel
- [x] Empty states with CTA
- [x] Ctrl+K quick search (cut first if short)

## Phase 6 — Polish + Demo
- [x] Responsive pass 375/768/1280
- [x] Spacing, skeletons, error states, transitions
- [x] Title + favicon
- [x] Reset demo data button
- [x] README (pitch, features, run steps, 3-min demo script)
- [x] npm run build clean

## Phase 7A — Data and roles
- [x] Seed dates relative to today (no hardcoded dates)
- [x] 14 days admission history from the API; appointments on all 7 strip days; patients in every ward
- [x] Reset restores full seeded state
- [x] Doctor / Receptionist role-specific KPIs and widgets (Admin keeps 4 global KPIs)
- [x] Doctor picker beside role switcher (view as any of 8 doctors)
- [x] curl-verify admit -> stats occupancy -> discharge

## Phase 7B — Visual polish and performance
- [x] Bed popover flips upward near viewport bottom
- [x] KPI count-up; staggered fade-in for cards and rows (<400ms)
- [x] Consistent page header (title, subtitle, primary action right)
- [x] Consistent hover / focus-visible / active states
- [x] Single source for status colors
- [x] Route-level code splitting (lazy + Suspense + Skeleton)
- [x] Overview header: today's date + pulsing live indicator
- [x] Build and lint clean

## Phase 8 — Dark mode
- [x] Audit hard-coded colors in src/
- [x] Dark token set under [data-theme="dark"]; light tokens unchanged
- [x] Hard-coded colors replaced with tokens (status, triage, overlays, skeleton, inputs)
- [x] Charts, gridlines and tooltips follow the theme (useChartColors)
- [x] Sun/moon toggle in top bar; system default; remembered in localStorage
- [x] Inline script in index.html sets data-theme before first paint
- [x] Build and lint clean

## Phase 9A — LAN access + live sync
- [x] Vite `host: true`, `dev:lan` script, relative `/api` paths only
- [x] `GET /api/events` (SSE) broadcasts `{type, resource}` after every successful write; 25s heartbeat
- [x] `useLiveSync` refetches affected resources, falls back to 5s polling; green/grey Live dot
- [x] Server prints LAN URL + QR code on start; README hotspot/troubleshooting

## Phase 9B — Patient edit / delete
- [x] `PATCH /api/patients/:id` (partial), `DELETE /api/patients/:id` soft delete + restore (Undo toast, then purge)
- [x] Admitted patient cannot be deleted (409); future appointments cancelled, past open ones no-show, slots freed
- [x] Edit form prefilled; delete confirm lists what it cancels; Cancel / No-show on appointments

## Phase 9C — First come, first served tokens
- [x] Tokens per doctor per day (`D2-014`), assigned server-side; waiting, called, in-consult, done, skipped
- [x] Issue, call-next, start, finish, skip, recall; order by issue time; emergency triage stays separate
- [x] Doctor console, reception queue with position and estimated wait, `/display` board, `/token/:ref` phone view
- [x] `server/tokens.test.js`

## Phase 9D — Phone layout + Patient role
- [x] Bottom tab bar per role with a More sheet, bottom-sheet modals, 44px touch targets
- [x] Patient role: Book, My Token, prescriptions; doctor prescribing (`/api/prescriptions`)

## Phase 9E — Patient documents
- [x] multer upload (jpeg/png/webp/pdf, 5 MB, signature check, random names) into `server/uploads/`
- [x] List / serve / delete routes; browser-side image compression; viewer; categories; reset clears files
- [x] `server/documents.test.js`, fake files in `samples/`

## Phase 9F — Doctor status editing
- [x] Transition tables for appointments and patients (`GET /api/status-rules`); invalid moves 409
- [x] `admitted` / `discharged` only through the bed flow
- [x] `statusHistory` with optional note (max 200); timeline in patient panel; status menu for Doctor/Admin
- [x] Demo-level role headers checked on the server (`server/actor.js`); `server/status.test.js`

## Phase 10A — Patient portal (committed with the token bug fix, 19ad8a4)
- [x] "Who are you?" sign-in: demo patients, name + phone, or register; session token per patient
- [x] Server checks the patient id on patient routes (`server/patientAccess.js`); 403 elsewhere
- [x] Cancel own appointment, camera upload, My Records tab, two seeded demo patients with appointment + token
- [x] Bug fix: public token slip and `/display` ignore the browser role; token celebration animation
- [x] `server/patient.test.js`

## Phase 10B — Cleanup
- [x] Removed unused `Table.jsx` and `@types/react*`; shared date helpers; `WhoAreYou` moved under `components/patients`
- [x] Docs in `docs/` (BUILD_LOG, HOW_IT_WORKS, DEMO); header comment on each major file
