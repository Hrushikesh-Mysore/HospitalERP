import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function BedPopover({ onClose, children }) {
  const ref = useRef(null)
  const [up, setUp] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !window.matchMedia('(min-width: 640px)').matches) return
    const { bottom } = el.getBoundingClientRect()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- measured after layout, before paint
    if (bottom > window.innerHeight - 8) setUp(true)
  }, [])

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: up ? -6 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className={`absolute left-1/2 z-20 -translate-x-1/2 rounded-2xl border border-line bg-card p-4 shadow-xl max-sm:fixed max-sm:inset-x-4 max-sm:bottom-4 max-sm:top-auto max-sm:mt-0 max-sm:mb-0 max-sm:w-auto max-sm:translate-x-0 ${up ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
      <button onClick={onClose} aria-label="Close" className="absolute right-2 top-2 rounded text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-500"><X size={14} /></button>
      {children}
    </motion.div>
  )
}
