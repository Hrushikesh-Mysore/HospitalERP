// Fake data only. All dates are relative to "today" so the demo always looks current.
const first = ['Aarav','Isha','Kabir','Meera','Rohan','Anaya','Vivaan','Diya','Arjun','Saanvi','Neel','Tara','Dev','Riya','Karan','Nisha','Aditya','Pooja','Samir','Leela']
const last = ['Mehta','Nair','Shah','Rao','Iyer','Gupta','Verma','Kulkarni','Singh','Patel']
const conditions = ['Hypertension','Type 2 Diabetes','Asthma','Fracture','Migraine','Pneumonia','Appendicitis','Arrhythmia','Dengue','Back pain']

export const wards = ['General', 'ICU', 'Pediatrics']
export const departments = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine']
export const slots = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00']

export const dayOffset = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

export function buildData() {
  const today = dayOffset(0)
  const doctors = [
    ['Dr. Anil Rao','Cardiology'],['Dr. Sunita Menon','Cardiology'],['Dr. Vikram Joshi','Neurology'],
    ['Dr. Priya Desai','Pediatrics'],['Dr. Farah Khan','Pediatrics'],['Dr. Manoj Pillai','Orthopedics'],
    ['Dr. Lata Bose','General Medicine'],['Dr. Rahul Sen','General Medicine'],
  ].map(([name, department], i) => ({ id: i + 1, name, department }))

  const patients = Array.from({ length: 40 }, (_, i) => {
    const registeredOn = i >= 37 ? today : dayOffset(-(3 + ((i * 5) % 40)))
    return {
      id: i + 1,
      name: `${first[i % 20]} ${last[(i * 3) % 10]}`,
      age: 5 + ((i * 17) % 80),
      gender: i % 2 ? 'F' : 'M',
      phone: `555-01${String(i).padStart(2, '0')}`,
      condition: conditions[i % 10],
      doctorId: (i % 8) + 1,
      status: 'outpatient',
      bedId: null,
      registeredOn,
      vitals: { heartRate: 62 + (i * 7) % 40, bp: `${110 + (i % 5) * 6}/${70 + (i % 4) * 5}`, temp: +(36.4 + (i % 6) * 0.2).toFixed(1), spo2: 94 + (i % 6) },
      history: [{ date: registeredOn, event: 'Registered' }],
    }
  })

  const beds = []
  wards.forEach((ward, w) => {
    for (let n = 1; n <= 10; n++) beds.push({ id: w * 10 + n, ward, label: `${ward[0]}-${String(n).padStart(2, '0')}`, status: 'free', patientId: null })
  })
  const admit = (bedIdx, pid, daysAgo) => {
    beds[bedIdx].status = 'occupied'; beds[bedIdx].patientId = pid
    const p = patients[pid - 1]; p.status = 'admitted'; p.bedId = beds[bedIdx].id
    p.history.push({ date: dayOffset(-daysAgo), event: `Admitted to ${beds[bedIdx].label}` })
  }
  // 5 General, 4 ICU, 3 Pediatrics admitted
  ;[[0,1,4],[1,2,3],[2,3,2],[3,4,1],[4,5,0],[10,6,5],[11,7,2],[12,8,1],[13,12,0],[20,9,3],[21,10,1],[22,11,0]].forEach(([b, p, d]) => admit(b, p, d))
  beds[5].status = 'cleaning'; beds[25].status = 'cleaning'
  ;[14, 15, 16].forEach((pid, k) => {
    patients[pid - 1].status = 'discharged'
    patients[pid - 1].history.push({ date: dayOffset(-(k + 2)), event: 'Discharged' })
  })

  // 25 appointments: 8 today (one per doctor), the other 17 spread over the next 6 days
  const mixToday = ['completed', 'completed', 'confirmed', 'confirmed', 'scheduled', 'scheduled', 'scheduled', 'cancelled']
  const mixLater = ['scheduled', 'confirmed', 'scheduled', 'confirmed', 'scheduled', 'cancelled']
  const appointments = Array.from({ length: 25 }, (_, i) => {
    const offset = i < 8 ? 0 : 1 + ((i - 8) % 6)
    return {
      id: i + 1,
      patientId: 13 + i,
      doctorId: (i % 8) + 1,
      date: dayOffset(offset),
      time: slots[(i * 2) % slots.length],
      reason: ['Consultation', 'Follow-up', 'Check-up', 'Lab review'][i % 4],
      status: i < 8 ? mixToday[i] : mixLater[i % 6],
    }
  })
  const seen = new Set()
  appointments.forEach((a) => {
    let s = slots.indexOf(a.time)
    while (seen.has(`${a.doctorId}|${a.date}|${slots[s]}`)) s = (s + 1) % slots.length
    a.time = slots[s]
    seen.add(`${a.doctorId}|${a.date}|${a.time}`)
  })

  const now = Date.now()
  const emergency = [
    ['Chest pain, shortness of breath', 1, 3],['Severe bleeding after accident', 1, 8],['High fever, seizure', 2, 12],
    ['Fractured wrist', 3, 20],['Abdominal pain', 3, 25],['Allergic reaction', 2, 30],['Minor burn', 4, 40],['Sprained ankle', 4, 55],
  ].map(([complaint, priority, minsAgo], i) => ({
    id: i + 1, name: `${first[(i * 5 + 2) % 20]} ${last[(i * 7) % 10]}`, age: 20 + i * 6, complaint, priority,
    arrivedAt: new Date(now - minsAgo * 60000).toISOString(), status: 'waiting', patientId: null, bedId: null,
  }))

  // 14 days of admissions, oldest first; the last entry is today (grows as patients are admitted)
  const counts = [21, 26, 24, 31, 28, 19, 16, 22, 27, 25, 34, 30, 21, 9]
  const admissionLog = counts.map((count, i) => ({ date: dayOffset(i - 13), count }))

  return {
    patients, doctors, beds, appointments, emergency, admissionLog,
    tokens: [], // first-come-first-served queue tokens; start empty so reset clears them
    activity: [
      { id: 1, text: `${patients[4].name} admitted to General bed G-05`, type: 'admit', at: new Date(now - 2 * 60000).toISOString() },
      { id: 2, text: 'Dr. Anil Rao confirmed an appointment', type: 'appt', at: new Date(now - 14 * 60000).toISOString() },
      { id: 3, text: 'Emergency case: Chest pain, shortness of breath (P1)', type: 'alert', at: new Date(now - 25 * 60000).toISOString() },
      { id: 4, text: 'Bed G-06 marked as cleaning', type: 'bed', at: new Date(now - 90 * 60000).toISOString() },
    ],
  }
}
