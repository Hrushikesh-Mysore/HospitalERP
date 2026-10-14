export const roles = ['Admin', 'Doctor', 'Receptionist']

export const access = {
  Admin: ['/', '/patients', '/appointments', '/beds', '/emergency', '/queue'],
  Doctor: ['/', '/patients', '/appointments', '/queue'],
  Receptionist: ['/', '/patients', '/appointments', '/queue'],
}
