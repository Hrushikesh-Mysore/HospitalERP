// Patients API: list, register, edit, soft delete with impact check and undo, and the status endpoint.
import { Router } from 'express'
import { z } from 'zod'
import { db, logActivity } from '../data/store.js'
import { validate } from '../middleware/validate.js'
import { find, createPatient, deletionImpact, softDeletePatient, restorePatient, changePatientStatus, PATIENT_STATUSES, NOTE_MAX } from '../services.js'
import { requireRole, requireOwnership, byOf } from '../actor.js'

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  age: z.number().int().min(0).max(120),
  gender: z.enum(['M', 'F', 'O']),
  phone: z.string().trim().min(5).max(20),
  condition: z.string().trim().min(2).max(100),
  doctorId: z.number().int(),
})

const update = schema.partial().refine((v) => Object.keys(v).length > 0, 'Nothing to update')

const r = Router()
const withDoctor = (p) => ({ ...p, doctor: db.doctors.find((d) => d.id === p.doctorId) ?? null })
r.get('/', (req, res) => res.json(db.patients.map(withDoctor)))
r.get('/:id', (req, res) => res.json(withDoctor(find('patients', req.params.id, 'Patient'))))
r.post('/', validate(schema), (req, res) => {
  find('doctors', req.body.doctorId, 'Doctor')
  const p = createPatient(req.body)
  res.status(201).json(withDoctor(p))
})
r.get('/:id/impact', (req, res) => {
  const { cancel, noShow, cases } = deletionImpact(find('patients', req.params.id, 'Patient'))
  const brief = (a) => ({ id: a.id, date: a.date, time: a.time, doctor: db.doctors.find((d) => d.id === a.doctorId)?.name })
  res.json({ cancel: cancel.map(brief), noShow: noShow.map(brief), cases: cases.map((c) => ({ id: c.id, complaint: c.complaint, priority: c.priority })) })
})
r.patch('/:id', validate(update), (req, res) => {
  const p = find('patients', req.params.id, 'Patient')
  if (req.body.doctorId !== undefined) find('doctors', req.body.doctorId, 'Doctor')
  Object.assign(p, req.body)
  logActivity(`Patient record updated: ${p.name}`, 'admit')
  res.json(withDoctor(p))
})
// Doctor (own patients) and Admin only. 'admitted' / 'discharged' are refused here and belong to the bed flow.
const statusBody = z.object({ status: z.enum(PATIENT_STATUSES), note: z.string().trim().max(NOTE_MAX).optional() })
r.patch('/:id/status', requireRole('Doctor', 'Admin'), validate(statusBody), (req, res) => {
  const p = find('patients', req.params.id, 'Patient')
  requireOwnership(req, p.doctorId, 'patients')
  changePatientStatus(p, req.body.status, { by: byOf(req), note: req.body.note })
  res.json(withDoctor(p))
})
r.delete('/:id', (req, res) => res.json(softDeletePatient(find('patients', req.params.id, 'Patient'))))
r.post('/:id/restore', (req, res) => res.json(withDoctor(restorePatient(Number(req.params.id)).patient)))
export default r
