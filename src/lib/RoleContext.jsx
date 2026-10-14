import { useState } from 'react'
import { RoleContext } from './roleStore'
import { roles } from './roles'
import { actor } from './actor'

const read = (key, ok, fallback) => {
  try { const v = localStorage.getItem(key); return ok(v) ? v : fallback } catch { return fallback }
}
const write = (key, v) => {
  try { localStorage.setItem(key, v) } catch { /* storage unavailable */ }
}

export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(() => read('role', (r) => roles.includes(r), 'Admin'))
  const [doctorId, setDoctorState] = useState(() => Number(read('doctorId', (d) => Number(d) >= 1 && Number(d) <= 8, '1')))
  const [patientId, setPatientState] = useState(() => Number(read('patientId', (d) => Number(d) >= 1, '1')))
  const setRole = (r) => { setRoleState(r); write('role', r) }
  const setDoctorId = (d) => { setDoctorState(Number(d)); write('doctorId', d) }
  Object.assign(actor, { role, doctorId, patientId }) // in render, so requests made by children right away already carry it
  const setPatientId = (p) => { setPatientState(Number(p)); write('patientId', p) }
  return <RoleContext.Provider value={{ role, setRole, doctorId, setDoctorId, patientId, setPatientId }}>{children}</RoleContext.Provider>
}
