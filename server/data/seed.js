// Fake data only. Deterministic generation so resets are reproducible.
const first = ['Aarav','Isha','Kabir','Meera','Rohan','Anaya','Vivaan','Diya','Arjun','Saanvi','Neel','Tara','Dev','Riya','Karan','Nisha','Aditya','Pooja','Samir','Leela']
const last = ['Mehta','Nair','Shah','Rao','Iyer','Gupta','Verma','Kulkarni','Singh','Patel']
const conditions = ['Hypertension','Type 2 Diabetes','Asthma','Fracture','Migraine','Pneumonia','Appendicitis','Arrhythmia','Dengue','Back pain']

export const wards = ['General', 'ICU', 'Pediatrics']
export const departments = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine']

export const slots = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00']

export function buildData() {
  const doctors = [
    ['Dr. Anil Rao','Cardiology'],['Dr. Sunita Menon','Cardiology'],['Dr. Vikram Joshi','Neurology'],
    ['Dr. Priya Desai','Pediatrics'],['Dr. Farah Khan','Pediatrics'],['Dr. Manoj Pillai','Orthopedics'],
    ['Dr. Lata Bose','General Medicine'],['Dr. Rahul Sen','General Medicine'],
  ].map(([name, department], i) => ({ id: i + 1, name, department }))

  const patients = Array.from({ length: 40 }, (_, i) => ({
    id: i + 1,
    name: `${first[i % 20]} ${last[(i * 3) % 10]}`,
    age: 5 + ((i * 17) % 80),
    gender: i % 2 ? 'F' : 'M',
    phone: `555-01${String(i).padStart(2, '0')}`,
    condition: conditions[i % 10],
    doctorId: (i % 8) + 1,
    status: 'outpatient',
    bedId: null,
    vitals: { heartRate: 62 + (i * 7) % 40, bp: `${110 + (i % 5) * 6}/${70 + (i % 4) * 5}`, temp: +(36.4 + (i % 6) * 0.2).toFixed(1), spo2: 94 + (i % 6) },
    history: [{ date: '2026-09-01', event: 'Registered' }],
  }))

  const beds = []
  wards.forEach((ward, w) => {
    for (let n = 1; n <= 10; n++) beds.push({ id: w * 10 + n, ward, label: `${ward[0]}-${String(n).padStart(2, '0')}`, status: 'free', patientId: null })
  })
  const admit = (bedIdx, pid) => {
    beds[bedIdx].status = 'occupied'; beds[bedIdx].patientId = pid
    const p = patients[pid - 1]; p.status = 'admitted'; p.bedId = beds[bedIdx].id
    p.history.push({ date: '2026-10-12', event: `Admitted to ${beds[bedIdx].label}` })
  }
  ;[[0,1],[1,2],[2,3],[3,4],[4,5],[10,6],[11,7],[12,8],[20,9],[21,10],[22,11],[13,12]].forEach(([b, p]) => admit(b, p))
  beds[5].status = 'cleaning'; beds[25].status = 'cleaning'

  const statuses = ['scheduled','confirmed','completed','cancelled']
  const appointments = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    patientId: 13 + i,
    doctorId: (i % 8) + 1,
    date: `2026-10-${String(14 + (i % 3)).padStart(2, '0')}`,
    time: slots[(Math.floor(i / 8) * 3 + i) % slots.length],
    reason: 'Consultation',
    status: statuses[i % 4],
  }))
  // guarantee no seed conflicts
  const seen = new Set()
  appointments.forEach((a) => {
    let k = `${a.doctorId}|${a.date}|${a.time}`, s = slots.indexOf(a.time)
    while (seen.has(k)) { s = (s + 1) % slots.length; a.time = slots[s]; k = `${a.doctorId}|${a.date}|${a.time}` }
    seen.add(k)
  })

  const now = Date.now()
  const emergency = [
    ['Chest pain, shortness of breath', 1, 3],['Severe bleeding after accident', 1, 8],['High fever, seizure', 2, 12],
    ['Fractured wrist', 3, 20],['Abdominal pain', 3, 25],['Allergic reaction', 2, 30],['Minor burn', 4, 40],['Sprained ankle', 4, 55],
  ].map(([complaint, priority, minsAgo], i) => ({
    id: i + 1, name: `${first[(i * 5 + 2) % 20]} ${last[(i * 7) % 10]}`, age: 20 + i * 6, complaint, priority,
    arrivedAt: new Date(now - minsAgo * 60000).toISOString(), status: 'waiting', patientId: null, bedId: null,
  }))

  return { patients, doctors, beds, appointments, emergency, activity: [
    { id: 1, text: 'Aarav Mehta admitted to General bed G-01', type: 'admit', at: new Date(now - 2 * 60000).toISOString() },
    { id: 2, text: 'Dr. Anil Rao confirmed an appointment', type: 'appt', at: new Date(now - 14 * 60000).toISOString() },
    { id: 3, text: 'Emergency case: Chest pain, shortness of breath (P1)', type: 'alert', at: new Date(now - 25 * 60000).toISOString() },
    { id: 4, text: 'Bed G-06 marked as cleaning', type: 'bed', at: new Date(now - 90 * 60000).toISOString() },
  ] }
}
