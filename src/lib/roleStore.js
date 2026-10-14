import { createContext, useContext } from 'react'

export const RoleContext = createContext({ role: 'Admin', setRole: () => {}, doctorId: 1, setDoctorId: () => {} })
export const useRole = () => useContext(RoleContext)
