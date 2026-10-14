export const roles = ['Admin', 'Doctor', 'Receptionist', 'Patient']

export const access = {
  Admin: ['/', '/patients', '/appointments', '/beds', '/emergency', '/queue'],
  Doctor: ['/', '/patients', '/appointments', '/queue'],
  Receptionist: ['/', '/patients', '/appointments', '/queue'],
  Patient: ['/book', '/my-token', '/prescriptions'],
}

// Phone bottom tab bar: the primary destinations per role. Everything else in `access` lands under "More".
export const tabs = {
  Admin: ['/', '/patients', '/queue', '/emergency'],
  Doctor: ['/', '/patients', '/appointments', '/queue'],
  Receptionist: ['/', '/patients', '/appointments', '/queue'],
  Patient: ['/book', '/my-token', '/prescriptions'],
}
