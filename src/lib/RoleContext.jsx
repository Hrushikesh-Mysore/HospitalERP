import { useEffect, useState } from 'react'
import { RoleContext } from './roleStore'
import { roles } from './roles'
import { actor } from './actor'

const read = (key, ok, fallback) => {
  try { const v = localStorage.getItem(key); return ok(v) ? v : fallback } catch { return fallback }
}
const write = (key, v) => {
  try { if (v === null) localStorage.removeItem(key); else localStorage.setItem(key, v) } catch { /* storage unavailable */ }
}
// The signed-in patient: { id, name, token }. Kept across reloads; cleared when the role is switched to Patient again.
const readPatient = () => {
  try { const p = JSON.parse(localStorage.getItem('patient')); return p && Number.isInteger(p.id) && typeof p.token === 'string' ? p : null } catch { return null }
}

export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(() => read('role', (r) => roles.includes(r), 'Admin'))
  const [doctorId, setDoctorState] = useState(() => Number(read('doctorId', (d) => Number(d) >= 1 && Number(d) <= 8, '1')))
  const [patient, setPatientState] = useState(readPatient)
  const setPatient = (p) => { setPatientState(p); write('patient', p && JSON.stringify(p)) }
  // Choosing Patient always asks "Who are you?" again
  const setRole = (r) => { if (r === 'Patient' && role !== 'Patient') setPatient(null); setRoleState(r); write('role', r) }
  const setDoctorId = (d) => { setDoctorState(Number(d)); write('doctorId', d) }
  Object.assign(actor, { role, doctorId, patientToken: patient?.token ?? null }) // in render, so requests made by children right away already carry it
  useEffect(() => {
    const ended = () => setPatient(null)
    window.addEventListener('patient-session-ended', ended)
    return () => window.removeEventListener('patient-session-ended', ended)
  }, [])
  return <RoleContext.Provider value={{ role, setRole, doctorId, setDoctorId, patient, patientId: patient?.id ?? null, setPatient }}>{children}</RoleContext.Provider>
}
