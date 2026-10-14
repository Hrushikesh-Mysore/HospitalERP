# BUILD_LOG

## What this is
MediCore (also called NIERA) is a hospital management dashboard built for a 90-minute hackathon (CLAUDE.md) and extended afterwards. It covers patients, appointments, beds, emergency triage, queue tokens, status tracking, and a phone-friendly patient portal. Front end: React 19, Vite, Tailwind v4, framer-motion, react-router-dom, recharts, lucide-react. Back end: Express in `/server` with zod, helmet, cors and rate limiting, multer for uploads, and no database. All data is fake.

Sources: PLAN.md, CLAUDE.md, `git log --stat`. PLAN.md was extended in Phase 10B to cover 9A onward; before that it stopped at Phase 8, so 9A-9F descriptions come from commit file lists and README.md and are partly "(inferred)".

## Phases
| Phase | Name | Added | Key files | Commit |
|---|---|---|---|---|
| 1 | Foundation + Overview | Layout shell, UI kit, Overview with mock data | `src/components/ui/*`, `layout/*`, `pages/Overview.jsx` | 49ee61f |
| 2 | Backend + API | Express API, seed data, zod validation, Vite proxy, `useFetch` | `server/index.js`, `services.js`, `routes/*`, `src/lib/api.js` | cdfeea6 |
| 3 | Patients + Appointments | Patient table/details/add, appointment timeline and booking | `pages/Patients.jsx`, `Appointments.jsx` | 266ac7b |
| 4 | Beds + Emergency | Bed grid and actions, triage queue | `pages/Beds.jsx`, `Emergency.jsx`, `components/beds/*` | d14a650 |
| 5 | Roles + Usage | Role switcher, tour, how-to, Ctrl+K search | `lib/RoleContext.jsx`, `components/help/*` | 64afb08 |
| 6 | Polish + Demo | Responsive pass, favicon, README with demo script | `README.md`, `Layout.jsx` | 9e21a38 |
| 7A | Data and roles | Dates relative to today, role-specific KPIs | `server/data/seed.js`, `routes/stats.js` | 6a2e1f2 |
| 7B | Visual polish | Count-up, code splitting, shared status colors | `lib/status.js`, `App.jsx`, `useCountUp.js` | fa104d4 |
| 8 | Dark mode | Theme tokens, toggle, theme-aware charts | `lib/ThemeProvider.jsx`, `useChartColors.js` | ae3b208 |
| 9A | LAN + live sync | SSE events, `useLiveSync`, Live dot, `.env.example` (QR code on start: README/package.json, inferred) | `server/events.js`, `lib/liveStore.js` | 8dcf57b |
| 9B | Patient edit/delete | Soft delete, appointment cancel handling (undo window: inferred) | `services.js`, `DeletePatientModal.jsx` | d65ff40 |
| 9C | Queue tokens | Per-doctor tokens, doctor and reception queue, `/display` board, token page | `routes/tokens.js`, `tokens.test.js`, `pages/Queue.jsx`, `Display.jsx` | dfda31e |
| 9D | Phone layout | Bottom tabs, Patient role, Book/My Token pages, prescriptions | `BottomTabs.jsx`, `routes/prescriptions.js`, `pages/Book.jsx` | 10ca077 |
| 9E | Documents | Upload, serve and delete patient files, image compression, sample files | `routes/documents.js`, `uploads.js`, `samples/` | 4345e8b |
| 9F | Status editing | Status transition rules, history timeline, role headers, status menu | `server/actor.js`, `services.js`, `status.test.js`, `StatusMenu.jsx` | f0e3e5e |
| 10A + fix | Patient portal + token fix | Patient sign-in and per-patient checks, demo patients, My Records, token animation, public pages anonymous | `patientAccess.js`, `routes/portal.js`, `WhoAreYou.jsx`, `Confetti.jsx` | 19ad8a4 |
| 10B | Cleanup | Removed dead `Table.jsx`, shared date helpers, header comments, docs in `docs/` | `docs/*`, `PLAN.md` | `cleanup` branch |

Commit 19ad8a4 holds two pieces of work (portal and token fix), as its message says.

## Five biggest design decisions
1. **In-memory data, no database.** CLAUDE.md says "no database". `server/data/store.js` holds a seeded object and `demo/reset` rebuilds it, so the demo is repeatable and needs no setup.
2. **Vite proxy and relative `/api` paths.** The front end only calls relative `/api` URLs, and `vite.config.js` proxies them (target configurable through `API_URL`). One origin means a phone on the LAN works without CORS or hard-coded IPs.
3. **SSE live sync with a polling fallback.** `GET /api/events` plus a broadcast after every successful write; the client uses one shared EventSource and refetches affected resources through a related-resource map. This makes the laptop, phone and display board update together.
4. **zod on every write, plus one rules table per status.** Input is validated (CLAUDE.md rule). Appointment and patient transitions live in `server/services.js` and are served at `/api/status-rules`, so UI menus and server checks share one source. Admit/discharge go only through the bed flow so bed occupancy stays consistent.
5. **First come, first served tokens.** Tokens are numbered on the server per doctor per day and ordered by issue time; a skipped token recalls into its original place. Emergency triage stays a separate queue. Covered by `server/tokens.test.js`.

## Known limitations
- **No real authentication.** Roles are sent in `X-Role` / `X-Doctor-Id` headers and trusted (comment in `server/actor.js`). Patient sign-in is name + phone with a random session token (`patientAccess.js`); requests that send no role are not filtered.
- **No database.** All data is in memory and returns to the seed on server restart; uploaded files live in `server/uploads/`, which is git-ignored and cleared at start (inferred from `clearStaleUploads` and `.gitignore`).
- **Demo data only.** Not suited to real patient information.
- **Tests cover the server only** (`npm test`: tokens, documents, status, patient); there are no front-end tests in the commits.
