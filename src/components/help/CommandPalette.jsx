import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, Stethoscope } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../../lib/api'

export default function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [sel, setSel] = useState(0)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    ref.current?.focus()
    Promise.all([api('/patients'), api('/doctors')]).then(([p, d]) => {
      setItems([
        ...p.map((x) => ({ key: `p${x.id}`, type: 'Patient', label: x.name, sub: x.condition, to: `/patients?q=${encodeURIComponent(x.name)}` })),
        ...d.doctors.map((x) => ({ key: `d${x.id}`, type: 'Doctor', label: x.name, sub: x.department, to: '/appointments' })),
      ])
    }).catch(() => setItems([]))
  }, [open])

  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    return items.filter((i) => !t || i.label.toLowerCase().includes(t) || i.sub.toLowerCase().includes(t)).slice(0, 8)
  }, [items, q])

  const close = () => { setQ(''); setSel(0); onClose() }
  const go = (i) => { navigate(i.to); close() }
  const onKey = (e) => {
    if (e.key === 'Escape') close()
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter' && results[sel]) go(results[sel])
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] grid place-items-start bg-slate-900/40 p-4 pt-[15vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div initial={{ y: -10 }} animate={{ y: 0 }} className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-line px-4">
              <Search size={18} className="text-muted" />
              <input ref={ref} value={q} onChange={(e) => { setQ(e.target.value); setSel(0) }} onKeyDown={onKey} placeholder="Search patients and doctors…" className="w-full py-4 text-sm outline-none" />
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && <li className="p-6 text-center text-sm text-muted">No results for “{q}”</li>}
              {results.map((r, n) => (
                <li key={r.key}>
                  <button onMouseEnter={() => setSel(n)} onClick={() => go(r)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${n === sel ? 'bg-brand-50' : ''}`}>
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface text-brand-600">{r.type === 'Patient' ? <User size={16} /> : <Stethoscope size={16} />}</span>
                    <span className="flex-1"><span className="block text-sm font-semibold">{r.label}</span><span className="block text-xs text-muted">{r.sub}</span></span>
                    <span className="text-xs text-muted">{r.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
