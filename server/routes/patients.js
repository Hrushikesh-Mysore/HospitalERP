import { Router } from 'express'
import { z } from 'zod'
import { db, logActivity } from '../data/store.js'
import { validate } from '../middleware/validate.js'
import { find } from '../services.js'

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  age: z.number().int().min(0).max(120),
  gender: z.enum(['M', 'F', 'O']),
  phone: z.string().trim().min(5).max(20),
  condition: z.string().trim().min(2).max(100),
  doctorId: z.number().int(),
})

const r = Router()
const withDoctor = (p) => ({ ...p, doctor: db.doctors.find((d) => d.id === p.doctorId) ?? null })
r.get('/', (req, res) => res.json(db.patients.map(withDoctor)))
r.get('/:id', (req, res) => res.json(withDoctor(find('patients', req.params.id, 'Patient'))))
r.post('/', validate(schema), (req, res) => {
  find('doctors', req.body.doctorId, 'Doctor')
  const p = { id: Math.max(0, ...db.patients.map((x) => x.id)) + 1, ...req.body, status: 'outpatient', bedId: null,
    vitals: { heartRate: 72, bp: '120/80', temp: 36.6, spo2: 98 }, history: [{ date: new Date().toISOString().slice(0, 10), event: 'Registered' }] }
  db.patients.push(p)
  logActivity(`New patient registered: ${p.name}`, 'admit')
  res.status(201).json(withDoctor(p))
})
export default r
