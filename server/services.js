import { db, logActivity } from './data/store.js'
import { HttpError } from './middleware/errorHandler.js'

export const find = (list, id, label) => {
  const item = db[list].find((x) => x.id === Number(id))
  if (!item) throw new HttpError(404, `${label} not found`)
  return item
}
const today = () => new Date().toISOString().slice(0, 10)

export function admitToBed(bed, patient) {
  if (bed.status !== 'free') throw new HttpError(409, `Bed ${bed.label} is ${bed.status}, not free`)
  if (patient.status === 'admitted') throw new HttpError(409, `${patient.name} is already admitted`)
  bed.status = 'occupied'; bed.patientId = patient.id
  patient.status = 'admitted'; patient.bedId = bed.id
  patient.history.push({ date: today(), event: `Admitted to ${bed.label}` })
  logActivity(`${patient.name} admitted to ${bed.ward} bed ${bed.label}`, 'admit')
}

export function dischargeBed(bed) {
  if (bed.status !== 'occupied') throw new HttpError(409, `Bed ${bed.label} has no patient`)
  const patient = db.patients.find((p) => p.id === bed.patientId)
  if (patient) {
    patient.status = 'discharged'; patient.bedId = null
    patient.history.push({ date: today(), event: `Discharged from ${bed.label}` })
    logActivity(`${patient.name} discharged from ${bed.label}`, 'discharge')
  }
  bed.status = 'cleaning'; bed.patientId = null
}

export function checkSlot({ doctorId, date, time }, ignoreId) {
  const clash = db.appointments.find((a) => a.id !== ignoreId && a.doctorId === doctorId && a.date === date && a.time === time && a.status !== 'cancelled')
  if (clash) {
    const d = find('doctors', doctorId, 'Doctor')
    throw new HttpError(409, `${d.name} is already booked on ${date} at ${time}. Please choose another slot.`)
  }
}

export const sortEmergency = (list) =>
  [...list].sort((a, b) => a.priority - b.priority || new Date(a.arrivedAt) - new Date(b.arrivedAt))
