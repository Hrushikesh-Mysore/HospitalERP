export const roles = ['Admin', 'Doctor', 'Receptionist']
export const DOCTOR_ID = 1 // the signed-in doctor when role = Doctor (Dr. Anil Rao)

export const access = {
  Admin: ['/', '/patients', '/appointments', '/beds', '/emergency'],
  Doctor: ['/', '/patients', '/appointments'],
  Receptionist: ['/', '/patients', '/appointments'],
}
