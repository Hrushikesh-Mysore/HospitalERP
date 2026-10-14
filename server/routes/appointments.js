import { Router } from 'express'
import { z } from 'zod'
import { db, logActivity } from '../data/store.js'
import { validate } from '../middleware/validate.js'
import { find, checkSlot, isInactive, assertAppointmentTransition, changeAppointmentStatus, NOTE_MAX, APPOINTMENT_TRANSITIONS } from '../services.js'
import { requireRole, requireOwnership, byOf } from '../actor.js'
import { slots } from '../data/seed.js'

const create = z.object({
  patientId: z.number().int(),
  doctorId: z.number().int(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.enum(slots),
  reason: z.string().trim().min(2).max(120).default('Consultation'),
})
const patch = z.object({
  status: z.enum(Object.keys(APPOINTMENT_TRANSITIONS)).optional(),
  note: z.string().trim().max(NOTE_MAX).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.enum(slots).optional(),
}).refine((v) => Object.keys(v).some((k) => k !== 'note'), 'Nothing to update')

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
// Reschedule and/or move along the status table (reception uses this one).
r.patch('/:id', validate(patch), (req, res) => {
  const a = find('appointments', req.params.id, 'Appointment')
  const { status, note, ...changes } = req.body
  const moves = status !== undefined && status !== a.status
  if (moves) assertAppointmentTransition(a, status)
  const next = { ...a, ...changes, ...(moves && { status }) }
  if (!isInactive(next.status) && (changes.date || changes.time)) checkSlot(next, a.id)
  Object.assign(a, changes)
  if (moves) changeAppointmentStatus(a, status, { by: byOf(req), note })
  else logActivity(`Appointment #${a.id} is now ${a.status}`, 'appt')
  res.json(expand(a))
})

// Doctor (own appointments) and Admin only. Demo-level role check: see server/actor.js.
const statusBody = z.object({ status: z.enum(Object.keys(APPOINTMENT_TRANSITIONS)), note: z.string().trim().max(NOTE_MAX).optional() })
r.patch('/:id/status', requireRole('Doctor', 'Admin'), validate(statusBody), (req, res) => {
  const a = find('appointments', req.params.id, 'Appointment')
  requireOwnership(req, a.doctorId, 'appointments')
  changeAppointmentStatus(a, req.body.status, { by: byOf(req), note: req.body.note })
  res.json(expand(a))
})
export default r
