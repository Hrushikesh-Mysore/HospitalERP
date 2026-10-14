export const roles = ['Admin', 'Doctor', 'Receptionist']

export const access = {
  Admin: ['/', '/patients', '/appointments', '/beds', '/emergency'],
  Doctor: ['/', '/patients', '/appointments'],
  Receptionist: ['/', '/patients', '/appointments'],
}
