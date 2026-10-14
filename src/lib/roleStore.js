import { createContext, useContext } from 'react'

export const RoleContext = createContext({ role: 'Admin', setRole: () => {}, doctorId: 1, setDoctorId: () => {}, patientId: 1, setPatientId: () => {} })
export const useRole = () => useContext(RoleContext)
