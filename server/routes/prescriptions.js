// Prescriptions API: list (optionally per patient) and issue.
import { Router } from 'express'
import { z } from 'zod'
import { db, logActivity } from '../data/store.js'
import { validate } from '../middleware/validate.js'
import { dayOffset } from '../data/seed.js'
import { find } from '../services.js'

const medicine = z.object({
  name: z.string().trim().min(2).max(60),
  dose: z.string().trim().min(1).max(30),
  frequency: z.string().trim().min(1).max(40),
  days: z.number().int().min(1).max(365),
})
const create = z.object({
  patientId: z.number().int(),
  doctorId: z.number().int(),
  medicines: z.array(medicine).min(1).max(6),
  notes: z.string().trim().max(200).default(''),
})

const r = Router()
const expand = (p) => {
  const d = db.doctors.find((x) => x.id === p.doctorId)
  return { ...p, doctor: d?.name, department: d?.department }
}
r.get('/', (req, res) => {
  const patientId = req.query.patientId ? Number(req.query.patientId) : undefined
  const list = db.prescriptions.filter((p) => patientId === undefined || p.patientId === patientId)
  res.json(list.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).map(expand))
})
r.post('/', validate(create), (req, res) => {
  const patient = find('patients', req.body.patientId, 'Patient')
  find('doctors', req.body.doctorId, 'Doctor')
  const p = { id: Math.max(0, ...db.prescriptions.map((x) => x.id)) + 1, date: dayOffset(0), ...req.body }
  db.prescriptions.push(p)
  logActivity(`Prescription issued for ${patient.name}`, 'appt')
  res.status(201).json(expand(p))
})
export default r
