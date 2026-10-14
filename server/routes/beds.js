import { Router } from 'express'
import { z } from 'zod'
import { db } from '../data/store.js'
import { validate } from '../middleware/validate.js'
import { find, admitToBed, dischargeBed, NOTE_MAX } from '../services.js'
import { byOf } from '../actor.js'
import { HttpError } from '../middleware/errorHandler.js'

const r = Router()
const expand = (b) => ({ ...b, patient: db.patients.find((p) => p.id === b.patientId)?.name ?? null })
r.get('/', (req, res) => res.json(db.beds.map(expand)))
r.post('/:id/admit', validate(z.object({ patientId: z.number().int(), note: z.string().trim().max(NOTE_MAX).optional() })), (req, res) => {
  const bed = find('beds', req.params.id, 'Bed')
  admitToBed(bed, find('patients', req.body.patientId, 'Patient'), byOf(req), req.body.note)
  res.json(expand(bed))
})
r.post('/:id/discharge', validate(z.object({ note: z.string().trim().max(NOTE_MAX).optional() }).default({})), (req, res) => {
  const bed = find('beds', req.params.id, 'Bed')
  dischargeBed(bed, byOf(req), req.body.note)
  res.json(expand(bed))
})
r.patch('/:id', validate(z.object({ status: z.enum(['free', 'cleaning']) })), (req, res) => {
  const bed = find('beds', req.params.id, 'Bed')
  if (bed.status === 'occupied') throw new HttpError(409, 'Discharge the patient before changing this bed')
  bed.status = req.body.status
  res.json(expand(bed))
})
export default r
