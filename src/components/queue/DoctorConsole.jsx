import { useEffect, useState } from 'react'
import { BellRing, Play, CheckCheck, SkipForward, Megaphone, RotateCcw, Ticket } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import { api } from '../../lib/api'
import { useToast } from '../../lib/toastStore'
import { tokenTone, tokenLabel, fmtWait, ago } from '../../lib/tokens'

export default function DoctorConsole({ doctor, onChange }) {
  const toast = useToast()
  const [now, setNow] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const act = async (path, message) => {
    setBusy(true)
    try { await api(path, { method: 'POST' }); if (message) toast(message); onChange() }
    catch (e) { toast(e.message, 'error') }
    finally { setBusy(false) }
  }
  const cur = doctor.serving
  const next = doctor.waiting[0]

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3" title="Current patient">
        {cur ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="rounded-2xl bg-brand-50 px-5 py-3 text-3xl font-extrabold tracking-wide text-brand-700">{cur.code}</span>
              <div>
                <p className="text-xl font-extrabold">{cur.name}</p>
                <p className="text-sm text-muted">{cur.status === 'called' ? `Called ${ago(cur.calledAt, now)}${cur.recalls ? ` · announced ${cur.recalls + 1}×` : ''}` : `In consult since ${ago(cur.startedAt, now)}`}</p>
              </div>
              <Badge tone={tokenTone[cur.status]}>{tokenLabel[cur.status]}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {cur.status === 'called' && <Button disabled={busy} onClick={() => act(`/tokens/${cur.id}/start`)}><Play size={16} /> Start consult</Button>}
              {cur.status === 'in-consult' && <Button disabled={busy} onClick={() => act(`/tokens/${cur.id}/finish`, `${cur.code} finished`)}><CheckCheck size={16} /> Finish</Button>}
              {cur.status === 'called' && <Button variant="secondary" disabled={busy} onClick={() => act(`/tokens/${cur.id}/recall`, `Announced ${cur.code} again`)}><Megaphone size={16} /> Recall</Button>}
              {cur.status === 'called' && <Button variant="secondary" disabled={busy} onClick={() => act(`/tokens/${cur.id}/skip`, `${cur.code} skipped`)}><SkipForward size={16} /> Skip</Button>}
            </div>
          </div>
        ) : (
          <EmptyState icon={BellRing} title={next ? 'Ready for the next patient' : 'No one is waiting'} text={next ? `${next.code} · ${next.name} is first in line.` : 'New tokens from reception appear here instantly.'}
            action={next && <Button disabled={busy} onClick={() => act(`/tokens/doctors/${doctor.id}/call-next`)}><BellRing size={16} /> Call next</Button>} />
        )}
        {cur && (
          <div className="mt-5 border-t border-line pt-4">
            <Button variant="secondary" disabled title={next ? 'Finish or skip the current patient first' : 'No one is waiting'}><BellRing size={16} /> Call next{next ? ` (${next.code})` : ''}</Button>
          </div>
        )}
      </Card>

      <div className="space-y-6 lg:col-span-2">
        <Card title={`Waiting (${doctor.waiting.length})`} action={<span className="text-xs text-muted">avg {doctor.avgConsultMin} min · {doctor.doneCount} done</span>}>
          {doctor.waiting.length === 0 ? <p className="text-sm text-muted">Queue is empty.</p> : (
            <ol className="space-y-2">
              {doctor.waiting.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-xl bg-surface p-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-card text-sm font-bold">{t.position}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{t.name}</p><p className="text-xs text-muted">{t.code}</p></div>
                  <span className="text-xs font-semibold text-muted">{fmtWait(t.estWaitMin)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
        {doctor.skipped.length > 0 && (
          <Card title="Skipped">
            <ul className="space-y-2">
              {doctor.skipped.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-xl bg-surface p-3">
                  <Ticket size={16} className="text-muted" />
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold">{t.code} · {t.name}</p>
                  <Button variant="secondary" disabled={busy} onClick={() => act(`/tokens/${t.id}/recall`, `${t.code} is back in line`)}><RotateCcw size={14} /> Recall</Button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Recalled patients return to their original place in line.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
