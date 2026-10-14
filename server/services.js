// Business rules shared by routes: slot conflicts, status transition tables, bed admit/discharge, soft delete and restore of patients.
import { db, logActivity, trash } from './data/store.js'
import { removeFile } from './uploads.js'
import { dayOffset } from './data/seed.js'
import { HttpError } from './middleware/errorHandler.js'

export const find = (list, id, label) => {
  const item = db[list].find((x) => x.id === Number(id))
  if (!item) throw new HttpError(404, `${label} not found`)
  return item
}

// Shared by staff registration and the patient portal so new patients always look the same.
export function createPatient(data) {
  const p = { id: Math.max(0, ...db.patients.map((x) => x.id)) + 1, ...data, status: 'outpatient', bedId: null, registeredOn: dayOffset(0),
    vitals: { heartRate: 72, bp: '120/80', temp: 36.6, spo2: 98 }, history: [{ date: dayOffset(0), event: 'Registered' }] }
  db.patients.push(p)
  logActivity(`New patient registered: ${p.name}`, 'admit')
  return p
}
// Cancelled and no-show appointments no longer hold their slot.
export const isInactive = (status) => status === 'cancelled' || status === 'no-show'

const UNDO_MS = 6000 // 5s undo shown to the user + 1s grace for network latency

// What deleting a patient would touch: future open appointments get cancelled, past open ones become no-shows,
// and any waiting emergency case for the same person is dropped from the queue.
export function deletionImpact(patient) {
  const open = db.appointments.filter((a) => a.patientId === patient.id && !['completed', 'cancelled', 'no-show'].includes(a.status))
  const sameName = (c) => c.name.trim().toLowerCase() === patient.name.trim().toLowerCase() && c.age === patient.age
  return {
    cancel: open.filter((a) => a.date >= dayOffset(0)),
    noShow: open.filter((a) => a.date < dayOffset(0)),
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

// ---- Status rules (single source of truth; the client reads them from GET /api/status-rules) ----
// Appointment: scheduled -> (confirmed) -> checked-in -> in-consult -> completed; cancelled / no-show are final.
export const APPOINTMENT_TRANSITIONS = {
  scheduled: ['confirmed', 'checked-in', 'cancelled', 'no-show'],
  confirmed: ['checked-in', 'cancelled', 'no-show'],
  'checked-in': ['in-consult', 'cancelled', 'no-show'],
  'in-consult': ['completed'],
  completed: [],
  cancelled: [],
  'no-show': [],
}
// Patient: "admitted" and "discharged" are not plain status edits. They change a bed, so they only happen
// through the bed admit / discharge flow (POST /api/beds/:id/admit and /discharge).
export const PATIENT_STATUSES = ['outpatient', 'under-observation', 'admitted', 'discharged', 'referred']
export const PATIENT_TRANSITIONS = {
  outpatient: ['under-observation', 'referred'],
  'under-observation': ['outpatient', 'referred'],
  admitted: [], // leaves only via the discharge flow
  discharged: ['outpatient', 'under-observation', 'referred'],
  referred: ['outpatient', 'under-observation'],
}
export const NOTE_MAX = 200

export function recordStatus(entity, from, to, by, note = '') {
  ;(entity.statusHistory ??= []).push({ from, to, by: by ?? { role: 'system', doctorId: null, name: null }, at: new Date().toISOString(), note })
}

export function assertAppointmentTransition(a, to) {
  if (a.status === to) throw new HttpError(409, `Appointment is already ${to}`)
  const allowed = APPOINTMENT_TRANSITIONS[a.status] ?? []
  if (!allowed.includes(to)) {
    throw new HttpError(409, `Cannot move an appointment from ${a.status} to ${to}. ${allowed.length ? `From ${a.status} you can go to: ${allowed.join(', ')}.` : `${a.status} is a final status.`}`)
  }
  if (to === 'no-show' && a.date > dayOffset(0)) throw new HttpError(409, 'Can only mark no-show on or after the appointment date')
}

export function changeAppointmentStatus(a, to, { by, note } = {}) {
  assertAppointmentTransition(a, to)
  const from = a.status
  a.status = to
  recordStatus(a, from, to, by, note)
  logActivity(`Appointment #${a.id} is now ${a.status}`, 'appt')
}

export function changePatientStatus(p, to, { by, note } = {}) {
  if (to === 'admitted') {
    throw new HttpError(409, 'Admitting needs a bed. Use the bed admit flow (POST /api/beds/:id/admit) so occupancy stays correct.', { flow: 'admit' })
  }
  if (p.status === 'admitted') {
    throw new HttpError(409, `${p.name} is admitted. Discharge from the bed first (POST /api/beds/:id/discharge); the status cannot be edited directly.`, { flow: 'discharge', bedId: p.bedId })
  }
  if (to === 'discharged') {
    throw new HttpError(409, 'Only an admitted patient can be discharged, and only through the bed discharge flow.', { flow: 'discharge' })
  }
  if (p.status === to) throw new HttpError(409, `Patient is already ${to}`)
  if (!PATIENT_TRANSITIONS[p.status]?.includes(to)) {
    throw new HttpError(409, `Cannot move a patient from ${p.status} to ${to}. From ${p.status} you can go to: ${PATIENT_TRANSITIONS[p.status].join(', ')}.`)
  }
  const from = p.status
  p.status = to
  p.history.push({ date: dayOffset(0), event: `Status: ${from} → ${to}` })
  recordStatus(p, from, to, by, note)
  logActivity(`${p.name} is now ${to}`, 'admit')
}

export function admitToBed(bed, patient, by, note) {
  if (bed.status !== 'free') throw new HttpError(409, `Bed ${bed.label} is ${bed.status}, not free`)
  if (patient.status === 'admitted') throw new HttpError(409, `${patient.name} is already admitted`)
  bed.status = 'occupied'; bed.patientId = patient.id
  const from = patient.status
  patient.status = 'admitted'; patient.bedId = bed.id
  recordStatus(patient, from, 'admitted', by, note)
  patient.history.push({ date: dayOffset(0), event: `Admitted to ${bed.label}` })
  const entry = db.admissionLog.find((e) => e.date === dayOffset(0))
  if (entry) entry.count++
  else db.admissionLog.push({ date: dayOffset(0), count: 1 })
  logActivity(`${patient.name} admitted to ${bed.ward} bed ${bed.label}`, 'admit')
}

export function dischargeBed(bed, by, note) {
  if (bed.status !== 'occupied') throw new HttpError(409, `Bed ${bed.label} has no patient`)
  const patient = db.patients.find((p) => p.id === bed.patientId)
  if (patient) {
    recordStatus(patient, patient.status, 'discharged', by, note)
    patient.status = 'discharged'; patient.bedId = null
    patient.history.push({ date: dayOffset(0), event: `Discharged from ${bed.label}` })
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
