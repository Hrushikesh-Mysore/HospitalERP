export const kpis = [
  { label: 'Total Patients', value: 1284, delta: '+4.2%', up: true, icon: 'users', tone: 'brand' },
  { label: 'Admitted Today', value: 36, delta: '+8', up: true, icon: 'bed', tone: 'info' },
  { label: 'Appointments', value: 52, delta: '-3', up: false, icon: 'calendar', tone: 'warn' },
  { label: 'Beds Available', value: 18, delta: '60% occupied', up: false, icon: 'activity', tone: 'ok' },
]
export const weeklyAdmissions = [
  { day: 'Mon', admissions: 24 }, { day: 'Tue', admissions: 31 }, { day: 'Wed', admissions: 28 },
  { day: 'Thu', admissions: 39 }, { day: 'Fri', admissions: 35 }, { day: 'Sat', admissions: 22 }, { day: 'Sun', admissions: 18 },
]
export const deptAppointments = [
  { dept: 'Cardiology', count: 14 }, { dept: 'Neurology', count: 9 }, { dept: 'Pediatrics', count: 12 },
  { dept: 'Orthopedics', count: 8 }, { dept: 'General', count: 17 },
]
export const activity = [
  { id: 1, text: 'Aarav Mehta admitted to Ward A, Bed 4', time: '2 min ago', type: 'admit' },
  { id: 2, text: 'Dr. Rao confirmed appointment with Isha Nair', time: '14 min ago', type: 'appt' },
  { id: 3, text: 'Critical emergency case triaged: chest pain', time: '25 min ago', type: 'alert' },
  { id: 4, text: 'Kabir Shah discharged from Ward B', time: '1 hr ago', type: 'discharge' },
  { id: 5, text: 'Bed C-07 marked as cleaning', time: '2 hr ago', type: 'bed' },
]
