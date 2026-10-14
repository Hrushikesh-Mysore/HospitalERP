// One list of status changes for a patient: their own status changes plus their appointments', newest first.
export function buildTimeline(patient, appointments = []) {
  const own = (patient.statusHistory ?? []).map((h) => ({ ...h, source: 'Patient' }))
  const fromAppts = appointments.filter((a) => a.patientId === patient.id)
    .flatMap((a) => (a.statusHistory ?? []).map((h) => ({ ...h, source: `Appointment ${a.date} ${a.time}` })))
  return [...own, ...fromAppts].sort((a, b) => b.at.localeCompare(a.at))
}
