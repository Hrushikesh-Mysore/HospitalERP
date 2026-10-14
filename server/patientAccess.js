// Patient sessions and the per-route guard that limits the Patient role to its own records (demo-level, not real auth).
import crypto from 'node:crypto'
import { db } from './data/store.js'
import { dayOffset } from './data/seed.js'
import { HttpError } from './middleware/errorHandler.js'

// DEMO-LEVEL, like actor.js. A patient "signs in" with name + phone (or picks a demo patient) and gets a random session
// token. Requests from the Patient role must carry it in X-Patient-Token, and the server takes the patient id from the
// token, never from the request body or URL, so one patient cannot read or change another by editing an id.
// It is not real authentication: anyone who knows a name and phone can sign in, and requests that claim no role at all
// are not filtered. A real deployment needs OTP/identity verification and server-side sessions for every role.
const sessions = new Map() // token -> patientId
export const startSession = (patientId) => {
  const token = crypto.randomBytes(16).toString('hex')
  sessions.set(token, patientId)
  return token
}

const deny = (msg = 'Patients can only use their own records.') => { throw new HttpError(403, msg) }

// Mounted on /api after readActor. Only affects requests that say they are a Patient.
export function patientGuard(req, res, next) {
  const a = req.actor
  if (!a || a.role !== 'Patient') return next()
  const { method, path } = req
  if (path.startsWith('/portal/')) return next()
  if (method === 'GET' && (path === '/doctors' || path === '/status-rules')) return next()

  const token = req.get('x-patient-token')
  if (!token) deny('Sign in as a patient first.')
  const id = sessions.get(token)
  if (!id || !db.patients.some((p) => p.id === id)) throw new HttpError(401, 'Your session has ended. Please sign in again.') // e.g. the patient was removed
  a.patientId = id
  const mine = (v) => Number(v) === id

  const seg = path.split('/').filter(Boolean)
  const body = req.body ?? {}
  const apptOf = () => db.appointments.find((x) => x.id === Number(seg[1]))

  if (seg[0] === 'patients' && mine(seg[1]) && seg.length >= 2 && (seg.length === 2 ? method === 'GET' : seg[2] === 'documents')) return next()
  if (seg[0] === 'prescriptions' && method === 'GET' && seg.length === 1 && mine(req.query.patientId)) return next()
  if (seg[0] === 'appointments') {
    if (method === 'GET' && seg.length === 1) return next() // other people's rows are reduced to slot info in the route
    if (method === 'POST' && seg.length === 1 && mine(body.patientId)) return next()
    if (method === 'PATCH' && seg.length === 2) {
      const ap = apptOf()
      if (!ap) return next() // the route answers 404
      if (!mine(ap.patientId)) deny('That appointment belongs to someone else.')
      if (Object.keys(body).some((k) => k !== 'status' && k !== 'note') || body.status !== 'cancelled') deny('Patients can only cancel their own appointments.')
      if (ap.date < dayOffset(0)) throw new HttpError(409, 'Past appointments cannot be cancelled.')
      return next()
    }
  }
  if (seg[0] === 'tokens') {
    if (method === 'GET' && seg.length === 2) return next() // token slip lookup, personal details are hidden in the route
    if (method === 'GET' && seg.length === 1 && mine(req.query.patientId)) return next()
    if (method === 'POST' && seg.length === 1) {
      if (body.appointmentId) {
        const ap = db.appointments.find((x) => x.id === Number(body.appointmentId))
        if (!ap) return next()
        if (!mine(ap.patientId)) deny('That appointment belongs to someone else.')
        return next()
      }
      if (mine(body.patientId)) return next()
    }
  }
  deny()
}

// What a patient may see of someone else's data.
export const isPatient = (req) => req.actor?.role === 'Patient'
export const ownsPatient = (req, patientId) => req.actor?.patientId === patientId
