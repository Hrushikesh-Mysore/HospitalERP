import { db, logActivity, trash } from './data/store.js'
import { removeFile } from './uploads.js'
import { dayOffset } from './data/seed.js'
import { HttpError } from './middleware/errorHandler.js'

export const find = (list, id, label) => {
  const item = db[list].find((x) => x.id === Number(id))
  if (!item) throw new HttpError(404, `${label} not found`)
  return item
}
const today = () => dayOffset(0)
// Cancelled and no-show appointments no longer hold their slot.
export const isInactive = (status) => status === 'cancelled' || status === 'no-show'

const UNDO_MS = 6000 // 5s undo shown to the user + 1s grace for network latency

// What deleting a patient would touch: future open appointments get cancelled, past open ones become no-shows,
// and any waiting emergency case for the same person is dropped from the queue.
export function deletionImpact(patient) {
  const open = db.appointments.filter((a) => a.patientId === patient.id && ['scheduled', 'confirmed'].includes(a.status))
  const sameName = (c) => c.name.trim().toLowerCase() === patient.name.trim().toLowerCase() && c.age === patient.age
  return {
    cancel: open.filter((a) => a.date >= today()),
    noShow: open.filter((a) => a.date < today()),
    cases: db.emergency.filter((c) => c.status === 'waiting' && (c.patientId === patient.id || sameName(c))),
  }
}

export function softDeletePatient(patient) {
  if (patient.status === 'admitted' || patient.bedId) {
    throw new HttpError(409, `Discharge first: ${patient.name} is still admitted to a bed`)
  }
  const { cancel, noShow, cases } = deletionImpact(patient)
  const changed = [...cancel.map((a) => [a, 'cancelled']), ...noShow.map((a) => [a, 'no-show'])]
    .map(([a, status]) => { const prev = a.status; a.status = status; return { id: a.id, prev } })
  db.appointments.filter((a) => a.patientId === patient.id).forEach((a) => { a.patientName = patient.name }) // keep the name once the record is gone
  db.emergency = db.emergency.filter((c) => !cases.includes(c))
  db.patients = db.patients.filter((p) => p.id !== patient.id)
  const timer = setTimeout(() => { // undo window over: purge for good, including the patient's uploaded files
    trash.delete(patient.id)
    db.documents.filter((d) => d.patientId === patient.id).forEach((d) => removeFile(d.filename))
    db.documents = db.documents.filter((d) => d.patientId !== patient.id)
  }, UNDO_MS)
  timer.unref()
  trash.set(patient.id, { patient, changed, cases, timer })
  logActivity(`Patient record deleted: ${patient.name}`, 'alert')
  return { id: patient.id, cancelled: cancel.map((a) => a.id), noShow: noShow.map((a) => a.id), removedCases: cases.length, undoMs: 5000 }
}

export function restorePatient(id) {
  const t = trash.get(id)
  if (!t) throw new HttpError(404, 'Nothing to restore - the undo window has passed')
  if (db.patients.some((p) => p.id === id)) throw new HttpError(409, 'Another patient now uses this record id')
  clearTimeout(t.timer)
  trash.delete(id)
  db.patients.push(t.patient)
  db.patients.sort((a, b) => a.id - b.id)
  let kept = 0
  for (const { id: apptId, prev } of t.changed) {
    const a = db.appointments.find((x) => x.id === apptId)
    if (!a) continue
    try { checkSlot(a, a.id); a.status = prev } catch { kept++ } // slot was re-booked meanwhile: leave it cancelled
  }
  db.emergency.push(...t.cases)
  logActivity(`Patient record restored: ${t.patient.name}`, 'admit')
  return { patient: t.patient, notRestored: kept }
}

export function admitToBed(bed, patient) {
  if (bed.status !== 'free') throw new HttpError(409, `Bed ${bed.label} is ${bed.status}, not free`)
  if (patient.status === 'admitted') throw new HttpError(409, `${patient.name} is already admitted`)
  bed.status = 'occupied'; bed.patientId = patient.id
  patient.status = 'admitted'; patient.bedId = bed.id
  patient.history.push({ date: today(), event: `Admitted to ${bed.label}` })
  const entry = db.admissionLog.find((e) => e.date === today())
  if (entry) entry.count++
  else db.admissionLog.push({ date: today(), count: 1 })
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
  const clash = db.appointments.find((a) => a.id !== ignoreId && a.doctorId === doctorId && a.date === date && a.time === time && !isInactive(a.status))
  if (clash) {
    const d = find('doctors', doctorId, 'Doctor')
    throw new HttpError(409, `${d.name} is already booked on ${date} at ${time}. Please choose another slot.`)
  }
}

export const sortEmergency = (list) =>
  [...list].sort((a, b) => a.priority - b.priority || new Date(a.arrivedAt) - new Date(b.arrivedAt))
