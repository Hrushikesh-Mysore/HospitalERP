import { Router } from 'express'
import { z } from 'zod'
import { db, logActivity } from '../data/store.js'
import { validate } from '../middleware/validate.js'
import { dayOffset } from '../data/seed.js'
import { find, isInactive } from '../services.js'
import { lanOrigin } from '../network.js'
import { HttpError } from '../middleware/errorHandler.js'

// First come, first served: one counter per doctor per day. Order is strictly by issue time (seq is assigned
// server-side at issue time, so it is the same order). Emergency triage is a separate queue and never touches this.
const DEFAULT_AVG_MIN = 10
const MIN_SAMPLES = 3 // consults needed before the measured average replaces the default
const ACTIVE = ['waiting', 'called', 'in-consult']
const today = () => dayOffset(0)
const pad = (n) => String(n).padStart(3, '0')
const byIssue = (a, b) => a.issuedAt.localeCompare(b.issuedAt) || a.seq - b.seq
const todays = (doctorId) => db.tokens.filter((t) => t.date === today() && (doctorId === undefined || t.doctorId === doctorId))
const serving = (doctorId) => todays(doctorId).find((t) => t.status === 'called' || t.status === 'in-consult')

export function avgConsultMin(doctorId) {
  const mins = todays(doctorId).filter((t) => t.status === 'done' && t.startedAt && t.finishedAt).map((t) => (new Date(t.finishedAt) - new Date(t.startedAt)) / 60000)
  if (mins.length < MIN_SAMPLES) return DEFAULT_AVG_MIN
  return Math.max(1, Math.round((mins.reduce((s, m) => s + m, 0) / mins.length) * 10) / 10)
}

// Token plus live queue info. position: 1 = next in line (waiting only). ahead counts the person being served too.
function view(t) {
  const doctor = db.doctors.find((d) => d.id === t.doctorId)
  const out = { ...t, doctor: doctor?.name, department: doctor?.department, position: null, ahead: null, estWaitMin: null }
  if (t.status === 'waiting') {
    const waitingAhead = todays(t.doctorId).filter((x) => x.status === 'waiting' && byIssue(x, t) < 0).length
    out.position = waitingAhead + 1
    out.ahead = waitingAhead + (serving(t.doctorId) ? 1 : 0)
    out.estWaitMin = Math.round(out.ahead * avgConsultMin(t.doctorId))
  }
  return out
}

const issue = z.object({
  doctorId: z.number().int().optional(),
  patientId: z.number().int().optional(),
  appointmentId: z.number().int().optional(),
  name: z.string().trim().min(2).max(80).optional(),
}).refine((v) => v.appointmentId || (v.doctorId && (v.patientId || v.name)), 'Provide an appointmentId, or a doctorId with a patientId or name')

const r = Router()

r.get('/', (req, res) => {
  const only = req.query.doctorId ? Number(req.query.doctorId) : undefined
  const doctors = db.doctors.filter((d) => only === undefined || d.id === only).map((d) => {
    const list = todays(d.id).sort(byIssue)
    const current = list.find((t) => t.status === 'called' || t.status === 'in-consult')
    return {
      id: d.id, name: d.name, department: d.department, avgConsultMin: avgConsultMin(d.id),
      serving: current ? view(current) : null,
      waiting: list.filter((t) => t.status === 'waiting').map(view),
      skipped: list.filter((t) => t.status === 'skipped').map(view),
      doneCount: list.filter((t) => t.status === 'done').length,
    }
  })
  const patientId = req.query.patientId ? Number(req.query.patientId) : undefined
  const mine = patientId ? todays().filter((t) => t.patientId === patientId).sort(byIssue).reverse().map(view) : undefined
  res.json({ date: today(), lanOrigin: lanOrigin(), doctors, ...(mine && { mine }) })
})

// :ref is a numeric id or a token code such as D2-014 (today's)
r.get('/:ref', (req, res) => {
  const ref = req.params.ref.toUpperCase()
  const t = db.tokens.find((x) => (/^\d+$/.test(ref) ? x.id === Number(ref) : x.date === today() && x.code === ref))
  if (!t) throw new HttpError(404, 'Token not found')
  res.json(view(t))
})

r.post('/', validate(issue), (req, res) => {
  let { doctorId, patientId, name } = req.body
  const { appointmentId } = req.body
  if (appointmentId) {
    const a = find('appointments', appointmentId, 'Appointment')
    if (isInactive(a.status) || a.status === 'completed') throw new HttpError(409, `Appointment is already ${a.status}`)
    if (a.date !== today()) throw new HttpError(409, 'Check-in is only possible on the appointment day')
    if (doctorId && doctorId !== a.doctorId) throw new HttpError(400, 'doctorId does not match the appointment')
    ;({ doctorId, patientId } = a)
  }
  find('doctors', doctorId, 'Doctor')
  if (patientId) name = find('patients', patientId, 'Patient').name
  const dupe = todays(doctorId).find((t) => ACTIVE.includes(t.status) && ((appointmentId && t.appointmentId === appointmentId) || (patientId && t.patientId === patientId)))
  if (dupe) throw new HttpError(409, `${name} already has token ${dupe.code} for this doctor`)

  const seq = Math.max(0, ...todays(doctorId).map((t) => t.seq)) + 1 // resets each day because only today's tokens count
  const t = {
    id: Math.max(0, ...db.tokens.map((x) => x.id)) + 1, code: `D${doctorId}-${pad(seq)}`, seq, doctorId, date: today(),
    patientId: patientId ?? null, appointmentId: appointmentId ?? null, name, status: 'waiting',
    issuedAt: new Date().toISOString(), calledAt: null, startedAt: null, finishedAt: null, recalls: 0,
  }
  db.tokens.push(t)
  logActivity(`Token ${t.code} issued to ${name}`, 'appt')
  res.status(201).json(view(t))
})

r.post('/doctors/:doctorId/call-next', (req, res) => {
  const doctor = find('doctors', req.params.doctorId, 'Doctor')
  const current = serving(doctor.id)
  if (current) throw new HttpError(409, `Finish or skip ${current.code} before calling the next patient`)
  const next = todays(doctor.id).filter((t) => t.status === 'waiting').sort(byIssue)[0]
  if (!next) throw new HttpError(409, 'No one is waiting')
  Object.assign(next, { status: 'called', calledAt: new Date().toISOString() })
  logActivity(`Now serving ${next.code} at ${doctor.name}`, 'appt')
  res.json(view(next))
})

const token = (req) => {
  const t = db.tokens.find((x) => x.id === Number(req.params.id))
  if (!t) throw new HttpError(404, 'Token not found')
  return t
}
const move = (t, from, to, patch = {}) => {
  if (!from.includes(t.status)) throw new HttpError(409, `Token ${t.code} is ${t.status}; expected ${from.join(' or ')}`)
  Object.assign(t, { status: to, ...patch })
}
const now = () => new Date().toISOString()

r.post('/:id/start', (req, res) => { const t = token(req); move(t, ['called'], 'in-consult', { startedAt: now() }); res.json(view(t)) })
r.post('/:id/finish', (req, res) => { const t = token(req); move(t, ['in-consult'], 'done', { finishedAt: now() }); res.json(view(t)) })
r.post('/:id/skip', (req, res) => { const t = token(req); move(t, ['waiting', 'called'], 'skipped'); res.json(view(t)) })
// called -> announce again; skipped -> back in line at its ORIGINAL place (order is still by issue time)
r.post('/:id/recall', (req, res) => {
  const t = token(req)
  if (t.status === 'called') Object.assign(t, { calledAt: now(), recalls: t.recalls + 1 })
  else move(t, ['skipped'], 'waiting', { calledAt: null })
  res.json(view(t))
})

export default r
