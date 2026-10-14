import { createContext, useContext, useState } from 'react'
import { roles } from './roles'

const RoleContext = createContext({ role: 'Admin', setRole: () => {}, doctorId: 1, setDoctorId: () => {} })
export const useRole = () => useContext(RoleContext)

const read = (key, ok, fallback) => {
  try { const v = localStorage.getItem(key); return ok(v) ? v : fallback } catch { return fallback }
}
const write = (key, v) => {
  try { localStorage.setItem(key, v) } catch { /* storage unavailable */ }
}

export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(() => read('role', (r) => roles.includes(r), 'Admin'))
  const [doctorId, setDoctorState] = useState(() => Number(read('doctorId', (d) => Number(d) >= 1 && Number(d) <= 8, '1')))
  const setRole = (r) => { setRoleState(r); write('role', r) }
  const setDoctorId = (d) => { setDoctorState(Number(d)); write('doctorId', d) }
  return <RoleContext.Provider value={{ role, setRole, doctorId, setDoctorId }}>{children}</RoleContext.Provider>
}
