import { useState } from 'react'
import { Plus, Monitor, Ticket } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import PageHeader from '../ui/PageHeader'
import IssueTokenModal from './IssueTokenModal'
import { tokenTone, tokenLabel, fmtWait } from '../../lib/tokens'

export default function ReceptionQueue({ data, onChange }) {
  const [issuing, setIssuing] = useState(false)
  const totalWaiting = data.doctors.reduce((n, d) => n + d.waiting.length, 0)
  const activeAppointmentIds = new Set(data.doctors.flatMap((d) => [d.serving, ...d.waiting]).filter((t) => t?.appointmentId).map((t) => t.appointmentId))
  const busyFirst = [...data.doctors].sort((a, b) => (b.waiting.length + (b.serving ? 1 : 0)) - (a.waiting.length + (a.serving ? 1 : 0)) || a.id - b.id)

  return (
    <div className="space-y-6">
      <PageHeader title="Queue" subtitle={`${totalWaiting} waiting across ${data.doctors.length} doctors · first come, first served`}
        action={
          <div className="flex gap-2">
            <a href="/display" target="_blank" rel="noreferrer"><Button variant="secondary" tabIndex={-1}><Monitor size={16} /> Waiting-room display</Button></a>
            <Button onClick={() => setIssuing(true)}><Plus size={16} /> Issue token</Button>
          </div>
        } />
      <div className="grid gap-4 lg:grid-cols-2">
        {busyFirst.map((d) => (
          <Card key={d.id} title={d.name} action={<Badge tone="gray">{d.department}</Badge>}>
            {d.serving ? (
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-brand-50 p-3">
                <span className="text-xl font-extrabold text-brand-700">{d.serving.code}</span>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{d.serving.name}</p>
                <Badge tone={tokenTone[d.serving.status]}>{tokenLabel[d.serving.status]}</Badge>
              </div>
            ) : <p className="mb-3 text-xs text-muted">Nobody being served right now</p>}
            {d.waiting.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted"><Ticket size={15} /> No one waiting</p>
            ) : (
              <ol className="space-y-2">
                {d.waiting.map((t) => (
                  <li key={t.id} className="rise flex items-center gap-3 rounded-xl bg-surface p-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-card text-sm font-bold">{t.position}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{t.name}</p><p className="text-xs text-muted">{t.code}{t.appointmentId ? ' · booked' : ' · walk-in'}</p></div>
                    <span className="text-xs font-semibold text-muted">{fmtWait(t.estWaitMin)}</span>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-3 text-xs text-muted">Avg consult {d.avgConsultMin} min · {d.doneCount} done today</p>
          </Card>
        ))}
      </div>
      {issuing && <IssueTokenModal lanOrigin={data.lanOrigin} doctors={data.doctors} activeAppointmentIds={activeAppointmentIds} onClose={() => setIssuing(false)} onIssued={onChange} />}
    </div>
  )
}
