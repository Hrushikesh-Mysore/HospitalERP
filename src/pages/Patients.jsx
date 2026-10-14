import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import SlideOver from '../components/ui/SlideOver'
import { inputCls } from '../components/ui/Field'
import AddPatientModal from '../components/patients/AddPatientModal'
import PatientDetails from '../components/patients/PatientDetails'
import { statusTone } from '../lib/status'
import { useRole } from '../lib/roleStore'
import { useFetch } from '../lib/useFetch'
import { useLiveSync } from '../lib/useLiveSync'

const PAGE = 10
const wardOf = (p, beds) => beds.find((b) => b.id === p.bedId)?.ward ?? ''

export default function Patients() {
  const { role, doctorId } = useRole()
  const pts = useFetch('/patients')
  const beds = useFetch('/beds')
  const docs = useFetch('/doctors')
  useLiveSync({ patients: pts.refetch, beds: beds.refetch })
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [status, setStatus] = useState('')
  const [ward, setWard] = useState('')
  const [sort, setSort] = useState({ key: 'name', dir: 1 })
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(null)
  const [adding, setAdding] = useState(false)

  const bedList = beds.data
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    const list = (pts.data ?? []).filter((p) =>
      (role !== 'Doctor' || p.doctorId === doctorId) && (!term || p.name.toLowerCase().includes(term) || p.condition.toLowerCase().includes(term)) &&
      (!status || p.status === status) && (!ward || wardOf(p, bedList ?? []) === ward))
    const val = (p) => (sort.key === 'doctor' ? p.doctor?.name ?? '' : p[sort.key])
    return list.sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir)
  }, [pts.data, bedList, q, status, ward, sort, role, doctorId])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const cur = Math.min(page, pages - 1)
  const visible = rows.slice(cur * PAGE, cur * PAGE + PAGE)
  const reset = (fn) => (e) => { fn(e.target.value); setPage(0) }
  const toggle = (key) => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }))

  const cols = [['name', 'Patient'], ['age', 'Age'], ['condition', 'Condition'], ['doctor', 'Doctor'], ['status', 'Status']]

  return (
    <div className="space-y-6">
      <PageHeader title="Patients" subtitle={`${rows.length} patients`}
        action={<Button onClick={() => setAdding(true)}><Plus size={16} /> Add patient</Button>} />
      <Card className="!p-0">
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <div className="relative min-w-48 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className={`${inputCls} pl-9`} placeholder="Search name or condition…" value={q} onChange={reset(setQ)} />
          </div>
          <select className={`${inputCls} !w-auto`} value={status} onChange={reset(setStatus)}>
            <option value="">All statuses</option><option value="admitted">Admitted</option><option value="outpatient">Outpatient</option><option value="discharged">Discharged</option>
          </select>
          <select className={`${inputCls} !w-auto`} value={ward} onChange={reset(setWard)}>
            <option value="">All wards</option><option>General</option><option>ICU</option><option>Pediatrics</option>
          </select>
        </div>
        {pts.loading ? (
          <div className="space-y-2 p-4">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : pts.error ? (
          <EmptyState title="Couldn't load patients" text={pts.error} action={<Button onClick={pts.refetch}>Retry</Button>} />
        ) : visible.length === 0 ? (
          <EmptyState icon={Users} title="No patients match" text="Try clearing filters or register a new patient." action={<Button onClick={() => { setQ(''); setStatus(''); setWard('') }} variant="secondary">Clear filters</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  {cols.map(([k, l]) => (
                    <th key={k} className="cursor-pointer select-none px-4 py-3 font-semibold" onClick={() => toggle(k)}>
                      <span className="inline-flex items-center gap-1">{l}{sort.key === k && (sort.dir === 1 ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((p, i) => (
                  <tr key={p.id} tabIndex={0} style={{ '--i': i }} onClick={() => setSelected(p)} onKeyDown={(e) => e.key === 'Enter' && setSelected(p)} className="rise cursor-pointer border-b border-line/60 transition-colors hover:bg-brand-50/50">
                    <td className="px-4 py-3 font-semibold">{p.name}</td>
                    <td className="px-4 py-3">{p.age}</td>
                    <td className="px-4 py-3">{p.condition}</td>
                    <td className="px-4 py-3">{p.doctor?.name}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone[p.status]}>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-line p-4 text-sm text-muted">
          <span>Page {cur + 1} of {pages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={cur === 0} onClick={() => setPage(cur - 1)} aria-label="Previous page"><ChevronLeft size={16} /></Button>
            <Button variant="secondary" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} aria-label="Next page"><ChevronRight size={16} /></Button>
          </div>
        </div>
      </Card>
      <SlideOver open={!!selected} onClose={() => setSelected(null)} title="Patient details">
        {selected && <PatientDetails patient={selected} />}
      </SlideOver>
      <AddPatientModal open={adding} onClose={() => setAdding(false)} doctors={docs.data?.doctors ?? []} onCreated={pts.refetch} />
    </div>
  )
}
