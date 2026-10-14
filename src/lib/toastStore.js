// The toast context and useToast hook.
import { createContext, useContext } from 'react'

export const ToastContext = createContext(() => {})
export const useToast = () => useContext(ToastContext)
