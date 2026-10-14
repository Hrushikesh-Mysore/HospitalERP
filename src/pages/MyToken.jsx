import { useState } from 'react'
import { Ticket } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import { inputCls } from '../components/ui/Field'
import TokenCard from '../components/queue/TokenCard'
import StatusTimeline from '../components/ui/StatusTimeline'
import { buildTimeline } from '../lib/statusTimeline'
import { useFetch } from '../lib/useFetch'
import { useLiveSync } from '../lib/useLiveSync'
import { useRole } from '../lib/roleStore'
import { useToast } from '../lib/toastStore'
import { isInactive, statusTone, apptTone, statusLabel } from '../lib/status'
import { tokenTone, tokenLabel } from '../lib/tokens'
import { api } from '../lib/api'

const today = () => new Date().toISOString().slice(0, 10)

// Patient role: my live token, or a way to get one (check in a booked visit, or walk in).
export default function MyToken() {
  const { patientId } = useRole()
  const toast = useToast()
  const q = useFetch(`/tokens?patientId=${patientId}`)
  const appts = useFetch('/appointments')
  const me = useFetch(`/patients/${patientId}`)
  useLiveSync({ tokens: q.refetch, appointments: appts.refetch, patients: me.refetch })
  const [doctorId, setDoctorId] = useState('')

  const issue = async (body) => {
    try { const t = await api('/tokens', { method: 'POST', body }); toast(`Your token is ${t.code}`); q.refetch() }
    catch (e) { toast(e.message, 'error') }
  }

  if (q.loading) return <div className="space-y-4"><Skeleton className="h-12 w-48" /><Skeleton className="h-80" /></div>
  const mine = q.data?.mine ?? []
  const active = mine.filter((t) => ['waiting', 'called', 'in-consult'].includes(t.status))
  const past = mine.filter((t) => !active.includes(t))
  const doctors = q.data?.doctors ?? []
  const checkable = (appts.data ?? []).filter((a) => a.patientId === patientId && a.date === today() && !isInactive(a.status) && a.status !== 'completed' && !active.some((t) => t.appointmentId === a.id))

  return (
    <div className="space-y-6">
      <PageHeader title="My token" subtitle="Your place in line, live" />
      {active.map((t) => <Card key={t.id}><TokenCard token={t} /></Card>)}
      {active.length === 0 && (
        <Card>
          <EmptyState icon={Ticket} title="You don't have a token yet" text="Check in for today's visit, or join the line as a walk-in." />
          {checkable.length > 0 && (
            <div className="space-y-2">
              {checkable.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl bg-surface p-3">
                  <p className="min-w-0 flex-1 text-sm font-bold">{a.time} · {a.doctor?.name}</p>
                  <Button onClick={() => issue({ appointmentId: a.id })}>Check in</Button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 space-y-2 border-t border-line pt-4">
            <p className="text-xs font-semibold text-muted">Walk-in</p>
            <select className={inputCls} value={doctorId} onChange={(e) => setDoctorId(e.target.value)} aria-label="Doctor">
              <option value="">Select a doctor…</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.department} ({d.waiting.length} waiting)</option>)}
            </select>
            <Button className="w-full" disabled={!doctorId} onClick={() => issue({ doctorId: Number(doctorId), patientId })}>Get a token</Button>
          </div>
        </Card>
      )}
      {me.data && (
        <Card title="My status">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone={statusTone[me.data.status]}>{statusLabel(me.data.status)}</Badge>
            {(appts.data ?? []).filter((a) => a.patientId === patientId && a.date === today() && a.status !== 'cancelled').map((a) => (
              <span key={a.id} className="flex items-center gap-1 text-xs text-muted">Visit {a.time}: <Badge tone={apptTone[a.status]}>{statusLabel(a.status)}</Badge></span>
            ))}
          </div>
          <StatusTimeline entries={buildTimeline(me.data, appts.data ?? [])} limit={4} />
          <p className="mt-3 text-xs text-muted">Only your care team can change these.</p>
        </Card>
      )}
      {past.length > 0 && (
        <Card title="Earlier today">
          <ul className="space-y-2">
            {past.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-xl bg-surface p-3">
                <span className="font-bold">{t.code}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-muted">{t.doctor}</span>
                <Badge tone={tokenTone[t.status]}>{tokenLabel[t.status]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
