# How it works

MediCore is one Express API (`server/`) with an in-memory database, and one React app (`src/`) that is three interfaces: staff screens on a laptop, the Patient role on a phone, and the public `/display` board.

## Layout
- `server/index.js` mounts middleware, then one router per resource in `server/routes/`. Rules shared by routes live in `server/services.js`. Data lives in `server/data/store.js` (`db`), seeded by `server/data/seed.js`.
- `src/main.jsx` → `src/App.jsx` (routes) → `components/layout/Layout.jsx` → a page in `src/pages/`. Pages call `useFetch` / `api` from `src/lib/`.
- The active role and signed-in patient live in `src/lib/RoleContext.jsx` and are mirrored into `src/lib/actor.js` so `api()` can send them.

## One click, end to end: patient taps "Confirm booking"
1. **Page.** `src/pages/Book.jsx`, function `book`, runs `api('/appointments', { method: 'POST', body: { patientId, doctorId, date, time, reason } })`.
2. **api.js.** `src/lib/api.js` builds `fetch('/api/appointments')` with headers `X-Role: Patient` and `X-Patient-Token` (read from `actor`), plus `Content-Type: application/json`, and a JSON body.
3. **Proxy.** In development Vite forwards `/api` to `http://localhost:3001` (`vite.config.js`, target overridable with `API_URL`). The browser only ever uses relative URLs, so this works from a phone too.
4. **Express middleware**, in order (`server/index.js`): `helmet`, `cors`, rate limit (300/min), `express.json` (10 kb limit), `readActor` (`server/actor.js`: puts `{role, doctorId}` on `req.actor`), `patientGuard` (`server/patientAccess.js`: looks up the token, then allows this request only because `body.patientId` is the signed-in patient), `broadcastWrites` (`server/events.js`: registers a hook for when the response finishes).
5. **Route.** `server/routes/appointments.js`: `r.post('/', validate(create), ...)`. `validate` (`server/middleware/validate.js`) runs the zod schema and answers 400 with the issues if it fails. The handler then calls `find` (patient, doctor exist) and `checkSlot` (`server/services.js`).
6. **Business rule.** If that doctor already has that date and time, `checkSlot` throws `HttpError(409, "Dr. … is already booked on … Please choose another slot.")`. `errorHandler` (`server/middleware/errorHandler.js`) turns it into `{ "error": "..." }` with status 409.
7. **Success.** Otherwise the handler pushes the new appointment into `db.appointments`, calls `logActivity` (Overview feed) and replies `201` with the expanded appointment JSON.
8. **Back in the browser.** `api()` parses the JSON. On an error status it throws `Error(message)`, which `book` shows inline. On success `book` shows a toast and calls `appts.refetch()` (`useFetch`, `src/lib/useFetch.js`).

## What the other screens see (live sync)
- When the 201 is sent, the hook from step 4 runs `broadcast({ type: 'created', resource: 'appointments' })` to every open `GET /api/events` stream (`eventsHandler`).
- In each browser, `src/lib/liveStore.js` holds one shared `EventSource`. Its `affects()` function uses the `RELATED` map to decide which resources an event touches (appointments also touch `stats`).
- `useLiveSync` (`src/lib/useLiveSync.js`), used by the receptionist's `src/pages/Appointments.jsx`, calls that page's `refetch` for `appointments`, so the new row appears without a reload. If the stream is down, `useLiveSync` polls every 5 seconds instead.

## Other flows use the same pattern
- **Queue tokens:** `src/components/queue/DoctorConsole.jsx` → `POST /api/tokens/doctors/:doctorId/call-next` → `server/routes/tokens.js`. The `/display` page (`src/pages/Display.jsx`) refetches on the `tokens` event.
- **Status changes:** `src/components/ui/StatusMenu.jsx` → `PATCH /api/appointments/:id/status` or `/api/patients/:id/status`. The allowed moves are in `server/services.js` and served by `server/routes/statusRules.js`.
- **Admit / discharge:** `src/components/beds/BedActions.jsx` → `POST /api/beds/:id/admit` or `/discharge` (`server/routes/beds.js`).
- **Upload:** `src/components/patients/PatientDocuments.jsx` → `compressImage` → `POST /api/patients/:id/documents` (multipart) → `server/routes/documents.js` and `server/uploads.js`.

## Where to change things
- New API field: its zod schema in the route file, then the page that sends it.
- New status rule: the tables in `server/services.js`; the UI follows automatically.
- Which pages a role sees: `src/lib/roles.js`. Nav items: `src/lib/nav.js`.
- Reset: `POST /api/demo/reset` runs `resetDb()` in `server/data/store.js`.

Limits: no real authentication and no database (see `docs/BUILD_LOG.md`).
