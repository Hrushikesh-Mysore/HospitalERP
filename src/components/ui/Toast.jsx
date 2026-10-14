import { useCallback, useState } from 'react'
import { ToastContext } from '../../lib/toastStore'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  // opts: { action: { label, onClick }, duration } - an action toast lingers for `duration` ms (default 3500)
  const push = useCallback((message, type = 'success', opts = {}) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, type, action: opts.action }])
    setTimeout(() => dismiss(id), opts.duration ?? 3500)
  }, [dismiss])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} layout initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} className="flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-3 text-sm font-medium shadow-lg">
              {t.type === 'success' ? <CheckCircle2 size={18} className="text-ok" /> : <AlertCircle size={18} className="text-danger" />}
              {t.message}
              {t.action && <button onClick={() => { dismiss(t.id); t.action.onClick() }} className="ml-2 rounded-lg bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700 hover:bg-brand-100">{t.action.label}</button>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
