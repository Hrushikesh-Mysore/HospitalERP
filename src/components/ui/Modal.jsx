import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useIsPhone } from '../../lib/useMediaQuery'

// Centered dialog on tablet/desktop; a bottom sheet on phones.
export default function Modal({ open, onClose, title, children }) {
  const phone = useIsPhone()
  const hidden = phone ? { y: '100%' } : { scale: 0.95, y: 12 }
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-label={title} className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-lg sm:rounded-2xl sm:p-6"
            initial={hidden} animate={{ scale: 1, y: 0 }} exit={hidden} transition={phone ? { type: 'tween', duration: 0.25 } : undefined} onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-muted hover:bg-surface"><X size={18} /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
