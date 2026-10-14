import { HttpError } from './middleware/errorHandler.js'
import { db } from './data/store.js'

// DEMO-LEVEL ONLY. The client states who it is in X-Role / X-Doctor-Id headers and the server believes it.
// Anyone can send those headers, so this stops honest mistakes (wrong role in the UI), not an attacker.
// A real deployment needs authentication (sessions or signed tokens issued at login) and must take the
// role and doctor id from the verified identity, never from request headers.
const ROLES = ['Admin', 'Doctor', 'Receptionist', 'Patient']

export function readActor(req, res, next) {
  const role = req.get('x-role')
  const doctorId = Number(req.get('x-doctor-id'))
  req.actor = ROLES.includes(role) ? { role, doctorId: role === 'Doctor' && Number.isInteger(doctorId) ? doctorId : null } : null
  next()
}

export const requireRole = (...allowed) => (req, res, next) => {
  if (!req.actor) throw new HttpError(403, 'Missing or invalid role. Sign in as a staff role to change statuses.')
  if (!allowed.includes(req.actor.role)) throw new HttpError(403, `${req.actor.role} cannot change statuses. Allowed: ${allowed.join(', ')}.`)
  if (req.actor.role === 'Doctor' && !req.actor.doctorId) throw new HttpError(403, 'Doctor requests must say which doctor (X-Doctor-Id).')
  next()
}

// A doctor may only touch records that belong to them; Admin may touch any.
export function requireOwnership(req, ownerDoctorId, what) {
  if (req.actor.role === 'Doctor' && req.actor.doctorId !== ownerDoctorId) throw new HttpError(403, `You can only change your own ${what}.`)
}

// Stored with every status change: who did it, resolved to a name now so history stays readable later.
export const byOf = (req) => {
  const a = req.actor
  if (!a) return { role: 'system', doctorId: null, name: null }
  if (a.role === 'Patient') return { role: a.role, doctorId: null, name: db.patients.find((p) => p.id === a.patientId)?.name ?? null }
  return { role: a.role, doctorId: a.doctorId, name: a.doctorId ? db.doctors.find((d) => d.id === a.doctorId)?.name ?? null : null }
}
