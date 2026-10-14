import { Router } from 'express'
import { z } from 'zod'
import { db, logActivity } from '../data/store.js'
import { validate } from '../middleware/validate.js'
import { dayOffset } from '../data/seed.js'
import { find, admitToBed, sortEmergency } from '../services.js'
import { HttpError } from '../middleware/errorHandler.js'

const create = z.object({
  name: z.string().trim().min(2).max(80),
  age: z.number().int().min(0).max(120),
  complaint: z.string().trim().min(2).max(160),
  priority: z.number().int().min(1).max(4),
})
const r = Router()
r.get('/', (req, res) => res.json(sortEmergency(db.emergency)))
r.post('/', validate(create), (req, res) => {
  const c = { id: Math.max(0, ...db.emergency.map((x) => x.id)) + 1, ...req.body, arrivedAt: new Date().toISOString(), status: 'waiting', patientId: null, bedId: null }
  db.emergency.push(c)
  logActivity(`Emergency case: ${c.complaint} (P${c.priority})`, 'alert')
  res.status(201).json(c)
})
r.post('/:id/assign-bed', validate(z.object({ bedId: z.number().int() })), (req, res) => {
  const c = find('emergency', req.params.id, 'Emergency case')
  if (c.status !== 'waiting') throw new HttpError(409, 'Case already has a bed')
  const bed = find('beds', req.body.bedId, 'Bed')
  if (bed.status !== 'free') throw new HttpError(409, `Bed ${bed.label} is ${bed.status}, not free`)
  const patient = { id: Math.max(0, ...db.patients.map((x) => x.id)) + 1, name: c.name, age: c.age, gender: 'O', phone: 'N/A',
    condition: c.complaint, doctorId: 1, status: 'outpatient', bedId: null, registeredOn: dayOffset(0), vitals: { heartRate: 90, bp: '120/80', temp: 37, spo2: 96 },
    history: [{ date: dayOffset(0), event: 'Emergency arrival' }] }
  db.patients.push(patient)
  admitToBed(bed, patient)
  Object.assign(c, { status: 'admitted', patientId: patient.id, bedId: bed.id })
  res.json(c)
})
export default r
