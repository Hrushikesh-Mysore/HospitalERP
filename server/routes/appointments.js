import { Router } from 'express'
import { z } from 'zod'
import { db, logActivity } from '../data/store.js'
import { validate } from '../middleware/validate.js'
import { dayOffset } from '../data/seed.js'
import { find, checkSlot, isInactive } from '../services.js'
import { HttpError } from '../middleware/errorHandler.js'
import { slots } from '../data/seed.js'

const create = z.object({
  patientId: z.number().int(),
  doctorId: z.number().int(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.enum(slots),
  reason: z.string().trim().min(2).max(120).default('Consultation'),
})
const patch = z.object({
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.enum(slots).optional(),
}).refine((v) => Object.keys(v).length > 0, 'Nothing to update')

const r = Router()
const expand = (a) => ({ ...a, patient: db.patients.find((p) => p.id === a.patientId)?.name ?? a.patientName, doctor: db.doctors.find((d) => d.id === a.doctorId) })
r.get('/', (req, res) => res.json(db.appointments.map(expand)))
r.post('/', validate(create), (req, res) => {
  const patient = find('patients', req.body.patientId, 'Patient')
  find('doctors', req.body.doctorId, 'Doctor')
  checkSlot(req.body)
  const a = { id: Math.max(0, ...db.appointments.map((x) => x.id)) + 1, ...req.body, status: 'scheduled' }
  db.appointments.push(a)
  logActivity(`Appointment booked for ${patient.name}`, 'appt')
  res.status(201).json(expand(a))
})
r.patch('/:id', validate(patch), (req, res) => {
  const a = find('appointments', req.params.id, 'Appointment')
  const next = { ...a, ...req.body }
  if (['cancelled', 'no-show'].includes(a.status) && req.body.status !== undefined && req.body.status !== a.status) throw new HttpError(409, `This appointment is already ${a.status}`)
  if (req.body.status === 'no-show' && next.date > dayOffset(0)) throw new HttpError(409, 'Can only mark no-show on or after the appointment date')
  if (!isInactive(next.status) && (req.body.date || req.body.time)) checkSlot(next, a.id)
  Object.assign(a, req.body)
  logActivity(`Appointment #${a.id} is now ${a.status}`, 'appt')
  res.json(expand(a))
})
export default r
