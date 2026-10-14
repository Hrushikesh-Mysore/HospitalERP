import { Router } from 'express'
import { db } from '../data/store.js'

const r = Router()
r.get('/', (req, res) => {
  const occupied = db.beds.filter((b) => b.status === 'occupied').length
  const apptsByDept = {}
  db.appointments.forEach((a) => {
    const dept = db.doctors.find((d) => d.id === a.doctorId).department
    apptsByDept[dept] = (apptsByDept[dept] || 0) + 1
  })
  res.json({
    kpis: {
      totalPatients: db.patients.length,
      admitted: db.patients.filter((p) => p.status === 'admitted').length,
      appointments: db.appointments.filter((a) => a.status !== 'cancelled').length,
      bedsAvailable: db.beds.filter((b) => b.status === 'free').length,
      occupancyPct: Math.round((occupied / db.beds.length) * 100),
      activeEmergencies: db.emergency.filter((e) => e.status === 'waiting').length,
    },
    weeklyAdmissions: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => ({ day, admissions: [24,31,28,39,35,22,18][i] + (i === 6 ? occupied : 0) })),
    appointmentsByDept: Object.entries(apptsByDept).map(([dept, count]) => ({ dept, count })),
    activity: db.activity.slice(0, 8),
  })
})
export default r
