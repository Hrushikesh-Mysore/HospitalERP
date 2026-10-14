import { Router } from 'express'
import { z } from 'zod'
import { db } from '../data/store.js'
import { DEMO_PATIENT_IDS } from '../data/seed.js'
import { validate } from '../middleware/validate.js'
import { HttpError } from '../middleware/errorHandler.js'
import { createPatient } from '../services.js'
import { startSession } from '../patientAccess.js'

// Patient sign-in. Demo-level identity (name + phone); see server/patientAccess.js.
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim()
const digits = (s) => s.replace(/\D/g, '')
const who = (p) => ({ id: p.id, name: p.name })
const session = (p) => ({ patient: who(p), token: startSession(p.id) })

const lookup = z.object({ name: z.string().trim().min(2).max(80), phone: z.string().trim().min(5).max(20) })
const register = lookup.extend({
  age: z.number().int().min(0).max(120),
  gender: z.enum(['M', 'F', 'O']),
  condition: z.string().trim().min(2).max(100).default('General check-up'),
})
const match = ({ name, phone }) => db.patients.find((p) => norm(p.name) === norm(name) && digits(p.phone) === digits(phone))

const r = Router()
r.get('/demo', (req, res) => res.json(DEMO_PATIENT_IDS.map((id) => db.patients.find((p) => p.id === id)).filter(Boolean).map((p) => ({ ...who(p), phone: p.phone }))))
r.post('/demo-login', validate(z.object({ patientId: z.number().int() })), (req, res) => {
  const p = DEMO_PATIENT_IDS.includes(req.body.patientId) && db.patients.find((x) => x.id === req.body.patientId)
  if (!p) throw new HttpError(404, 'Not a demo patient')
  res.json(session(p))
})
r.post('/login', validate(lookup), (req, res) => {
  const p = match(req.body)
  if (!p) throw new HttpError(404, 'We could not find a patient with that name and phone number.')
  res.json(session(p))
})
r.post('/register', validate(register), (req, res) => {
  if (match(req.body)) throw new HttpError(409, 'You are already registered. Please sign in instead.')
  const generalMedicine = db.doctors.filter((d) => d.department === 'General Medicine')
  const doctorId = generalMedicine.map((d) => ({ d, n: db.patients.filter((p) => p.doctorId === d.id).length })).sort((a, b) => a.n - b.n)[0]?.d.id ?? db.doctors[0].id
  res.status(201).json(session(createPatient({ ...req.body, doctorId })))
})
export default r
