import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useIsPhone } from '../../lib/useMediaQuery'

// Side panel on tablet/desktop; a bottom sheet on phones.
export default function SlideOver({ open, onClose, title, children }) {
  const phone = useIsPhone()
  const hidden = phone ? { y: '100%' } : { x: '100%' }
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 bg-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.aside role="dialog" aria-label={title}
            className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:inset-x-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none sm:p-6"
            initial={hidden} animate={{ x: 0, y: 0 }} exit={hidden} transition={{ type: 'tween', duration: 0.25 }} onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-muted hover:bg-surface"><X size={18} /></button>
            </div>
            {children}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
