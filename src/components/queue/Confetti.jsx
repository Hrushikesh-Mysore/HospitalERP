import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const colors = ['bg-brand-500', 'bg-ok', 'bg-warn', 'bg-info', 'bg-danger']

const makeBits = (count) => Array.from({ length: count }, (_, i) => {
  const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
  const dist = 90 + Math.random() * 130
  return { i, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 40, r: Math.random() * 540 - 270, w: 6 + Math.random() * 6, delay: Math.random() * 0.12, c: colors[i % colors.length] }
})

// One-shot burst from the centre of the nearest relative parent. Pointer-transparent, gone after ~1.6s.
export default function Confetti({ count = 36 }) {
  const reduce = useReducedMotion()
  const [bits] = useState(() => makeBits(count))
  if (reduce) return null
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      {bits.map((b) => (
        <motion.span key={b.i} className={`absolute left-1/2 top-1/3 block rounded-sm ${b.c}`} style={{ width: b.w, height: b.w * 0.55 }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 160], opacity: [1, 1, 0], scale: 1, rotate: b.r }}
          transition={{ duration: 1.5, delay: b.delay, ease: 'easeOut', times: [0, 0.45, 1] }} />
      ))}
    </div>
  )
}
