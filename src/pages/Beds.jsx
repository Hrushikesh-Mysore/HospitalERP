import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Siren, X } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'
import { useToast } from '../components/ui/Toast'
import BedTile from '../components/beds/BedTile'
import BedActions from '../components/beds/BedActions'
import OccupancyBar from '../components/beds/OccupancyBar'
import { useFetch } from '../lib/useFetch'
import { api } from '../lib/api'

const wards = ['General', 'ICU', 'Pediatrics']
const legend = [['Free', 'bg-green-400'], ['Occupied', 'bg-red-400'], ['Cleaning', 'bg-amber-400']]

export default function Beds() {
  const beds = useFetch('/beds', { interval: 5000 })
  const pts = useFetch('/patients')
  const em = useFetch('/emergency')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [ward, setWard] = useState('General')
  const [open, setOpen] = useState(null)

  const assignId = Number(params.get('assign')) || null
  const assignCase = assignId ? em.data?.find((c) => c.id === assignId && c.status === 'waiting') : null

  const refreshAll = () => { beds.refetch(); pts.refetch(); em.refetch() }

  const clickBed = async (bed) => {
    if (assignCase) {
      if (bed.status !== 'free') return toast(`Bed ${bed.label} is ${bed.status}. Pick a free bed.`, 'error')
      try {
        await api(`/emergency/${assignCase.id}/assign-bed`, { method: 'POST', body: { bedId: bed.id } })
        toast(`${assignCase.name} admitted to ${bed.label}`)
        navigate('/beds', { replace: true }); refreshAll()
      } catch (e) { toast(e.message, 'error') }
      return
    }
    setOpen(open?.id === bed.id ? null : bed)
  }

  if (beds.loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-24" /><Skeleton className="h-80" /></div>
  if (beds.error && !beds.data) return <Card className="mx-auto mt-12 max-w-md text-center"><p className="mb-4 font-bold">Couldn't load beds</p><p className="mb-4 text-sm text-muted">{beds.error}</p><Button onClick={beds.refetch}>Retry</Button></Card>

  const all = beds.data
  const shown = all.filter((b) => b.ward === ward)
  const current = open && all.find((b) => b.id === open.id)

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-extrabold">Beds</h1><p className="text-sm text-muted">Click a bed to admit, discharge or mark cleaning.</p></div>
      {assignCase && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm">
          <Siren size={18} className="shrink-0 text-danger" />
          <p className="flex-1 font-semibold">Select a free bed for <b>{assignCase.name}</b> — {assignCase.complaint} (P{assignCase.priority})</p>
          <button onClick={() => navigate('/beds', { replace: true })} aria-label="Cancel assignment"><X size={18} /></button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">{wards.map((w) => <OccupancyBar key={w} ward={w} beds={all.filter((b) => b.ward === w)} />)}</div>
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-xl bg-surface p-1">
            {wards.map((w) => (
              <button key={w} onClick={() => { setWard(w); setOpen(null) }} className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${ward === w ? 'bg-white text-brand-700 shadow-sm' : 'text-muted hover:text-ink'}`}>{w}</button>
            ))}
          </div>
          <div className="flex gap-4 text-xs font-medium text-muted">
            {legend.map(([l, c]) => <span key={l} className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded ${c}`} />{l}</span>)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {shown.map((b) => (
            <div key={b.id} className="relative">
              <BedTile bed={b} active={current?.id === b.id} onClick={() => clickBed(b)} />
              <AnimatePresence>
                {current?.id === b.id && !assignCase && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 rounded-2xl border border-line bg-card p-4 shadow-xl max-sm:fixed max-sm:inset-x-4 max-sm:bottom-4 max-sm:top-auto max-sm:mt-0 max-sm:translate-x-0 max-sm:w-auto">
                    <button onClick={() => setOpen(null)} aria-label="Close" className="absolute right-2 top-2 text-muted"><X size={14} /></button>
                    <BedActions bed={current} patients={pts.data ?? []} onDone={refreshAll} onClose={() => setOpen(null)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
