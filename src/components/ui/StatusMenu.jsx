import { useState } from 'react'
import { ChevronDown, AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import Badge from './Badge'
import { inputCls } from './Field'
import { soft, statusLabel } from '../../lib/status'

// A status badge that turns into a dropdown when `options` is non-empty (valid next statuses only).
// options: [{ value, label?, destructive?, needsBed? }]   onApply(option, { note, bedId }) may throw to show an error.
export default function StatusMenu({ value, tone, options = [], onApply, noun, beds = [], noteMax = 200 }) {
  const [open, setOpen] = useState(false)
  const [pick, setPick] = useState(null)
  const [note, setNote] = useState('')
  const [bedId, setBedId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (options.length === 0) return <Badge tone={tone}>{statusLabel(value)}</Badge>

  const close = () => { setOpen(false); setPick(null); setNote(''); setBedId(''); setError('') }
  const apply = async () => {
    if (pick.needsBed && !bedId) return setError('Choose a free bed')
    setBusy(true); setError('')
    try { await onApply(pick, { note: note.trim() || undefined, bedId: bedId ? Number(bedId) : undefined }); close() }
    catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={`${noun} status: ${statusLabel(value)}. Change`}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ring-current/20 ${soft[tone]}`}>
        {statusLabel(value)} <ChevronDown size={13} />
      </button>
      <Modal open={open} onClose={close} title={`Change ${noun} status`}>
        <div className="space-y-4">
          <p className="text-sm text-muted">Now: <Badge tone={tone}>{statusLabel(value)}</Badge></p>
          <div className="space-y-2" role="group" aria-label="New status">
            {options.map((o) => (
              <button key={o.value} type="button" aria-pressed={pick?.value === o.value} onClick={() => { setPick(o); setError('') }}
                className={`flex w-full items-center rounded-xl border px-3 py-2.5 text-left text-sm font-semibold ${pick?.value === o.value ? 'border-brand-600 bg-brand-50' : 'border-line bg-card hover:bg-surface'} ${o.destructive ? 'text-danger' : ''}`}>
                {o.label ?? statusLabel(o.value)}
              </button>
            ))}
          </div>
          {pick?.needsBed && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">Bed (uses the normal admit flow)</span>
              <select className={inputCls} value={bedId} onChange={(e) => setBedId(e.target.value)}>
                <option value="">{beds.length ? 'Select a free bed…' : 'No free beds'}</option>
                {beds.map((b) => <option key={b.id} value={b.id}>{b.ward} · {b.label}</option>)}
              </select>
            </label>
          )}
          {pick?.destructive && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> This is final. A {pick.value} {noun} cannot be moved to another status{noun === 'appointment' ? ' and its time slot is freed' : ''}.
            </p>
          )}
          <label className="block">
            <span className="mb-1 flex justify-between text-xs font-semibold text-muted">Note (optional) <span>{note.length}/{noteMax}</span></span>
            <input className={inputCls} value={note} maxLength={noteMax} onChange={(e) => setNote(e.target.value)} placeholder="Why the change?" />
          </label>
          {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>Close</Button>
            <Button variant={pick?.destructive ? 'danger' : 'primary'} disabled={!pick || busy} onClick={apply}>
              {busy ? 'Saving…' : pick?.destructive ? `Yes, mark ${pick.value}` : 'Apply'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
