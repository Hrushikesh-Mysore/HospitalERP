// Serves the status transition tables so the UI only offers valid next statuses.
import { Router } from 'express'
import { APPOINTMENT_TRANSITIONS, PATIENT_TRANSITIONS, PATIENT_STATUSES, NOTE_MAX } from '../services.js'

// The client builds its status menus from this, so the rules live in exactly one place.
const r = Router()
r.get('/', (req, res) => res.json({ appointment: APPOINTMENT_TRANSITIONS, patient: PATIENT_TRANSITIONS, patientStatuses: PATIENT_STATUSES, noteMax: NOTE_MAX }))
export default r
