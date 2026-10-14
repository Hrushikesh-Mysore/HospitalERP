import { createContext, useContext, useState } from 'react'
import { roles } from './roles'

const RoleContext = createContext({ role: 'Admin', setRole: () => {} })
export const useRole = () => useContext(RoleContext)

const read = () => {
  try { const r = localStorage.getItem('role'); return roles.includes(r) ? r : 'Admin' } catch { return 'Admin' }
}

export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(read)
  const setRole = (r) => {
    setRoleState(r)
    try { localStorage.setItem('role', r) } catch { /* storage unavailable */ }
  }
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>
}
