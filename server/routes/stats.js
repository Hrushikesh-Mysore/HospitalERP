import { Router } from 'express'
import { db } from '../data/store.js'
import { dayOffset } from '../data/seed.js'

const weekday = (date) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en', { weekday: 'short', timeZone: 'UTC' })

function doctorStats(doctorId) {
  const doctor = db.doctors.find((d) => d.id === doctorId)
  if (!doctor) return null
  const today = dayOffset(0)
  const nowHM = new Date().toISOString().slice(11, 16)
  const mine = db.appointments.filter((a) => a.doctorId === doctorId)
  const upcoming = mine
    .filter((a) => ['scheduled', 'confirmed'].includes(a.status) && (a.date > today || (a.date === today && a.time >= nowHM)))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]
  return {
    doctor,
    appointmentsToday: mine.filter((a) => a.date === today && a.status !== 'cancelled').length,
    admittedPatients: db.patients.filter((p) => p.doctorId === doctorId && p.status === 'admitted').length,
    nextAppointment: upcoming
      ? { date: upcoming.date, time: upcoming.time, patient: db.patients.find((p) => p.id === upcoming.patientId)?.name }
      : null,
  }
}

const r = Router()
r.get('/', (req, res) => {
  const today = dayOffset(0)
  const occupied = db.beds.filter((b) => b.status === 'occupied').length
  const apptsByDept = {}
  db.appointments.forEach((a) => {
    const dept = db.doctors.find((d) => d.id === a.doctorId).department
    apptsByDept[dept] = (apptsByDept[dept] || 0) + 1
  })
  const doctorId = Number(req.query.doctorId)
  res.json({
    kpis: {
      totalPatients: db.patients.length,
      admitted: db.patients.filter((p) => p.status === 'admitted').length,
      appointments: db.appointments.filter((a) => a.status !== 'cancelled').length,
      bedsAvailable: db.beds.filter((b) => b.status === 'free').length,
      occupancyPct: Math.round((occupied / db.beds.length) * 100),
      activeEmergencies: db.emergency.filter((e) => e.status === 'waiting').length,
      registrationsToday: db.patients.filter((p) => p.registeredOn === today).length,
      pendingBookings: db.appointments.filter((a) => a.status === 'scheduled').length,
    },
    doctor: doctorId ? doctorStats(doctorId) : null,
    weeklyAdmissions: db.admissionLog.slice(-7).map((e) => ({ day: weekday(e.date), admissions: e.count })),
    admissionHistory: db.admissionLog,
    appointmentsByDept: Object.entries(apptsByDept).map(([dept, count]) => ({ dept, count })),
    activity: db.activity.slice(0, 8),
  })
})
export default r
