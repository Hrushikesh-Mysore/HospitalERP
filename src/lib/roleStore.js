// The React context object and useRole hook for the active role.
import { createContext, useContext } from 'react'

export const RoleContext = createContext({ role: 'Admin', setRole: () => {}, doctorId: 1, setDoctorId: () => {}, patient: null, patientId: null, setPatient: () => {} })
export const useRole = () => useContext(RoleContext)
