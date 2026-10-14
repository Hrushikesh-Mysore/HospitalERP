import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Field, { inputCls } from '../ui/Field'
import { useFetch } from '../../lib/useFetch'
import { api } from '../../lib/api'
import { isInactive } from '../../lib/status'
import { fmtWait, trackUrl } from '../../lib/tokens'

const today = () => new Date().toISOString().slice(0, 10)

export default function IssueTokenModal({ lanOrigin, doctors, activeAppointmentIds, onClose, onIssued }) {
  const appts = useFetch('/appointments')
  const pts = useFetch('/patients')
  const [tab, setTab] = useState('appt')
  const [f, setF] = useState({ doctorId: '', patientId: '', name: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [issued, setIssued] = useState(null)
  const [copied, setCopied] = useState(false)

  const open = (appts.data ?? [])
    .filter((a) => a.date === today() && !isInactive(a.status) && a.status !== 'completed' && !activeAppointmentIds.has(a.id))
    .sort((a, b) => a.time.localeCompare(b.time))

  const issue = async (body) => {
    setBusy(true); setError('')
    try { const t = await api('/tokens', { method: 'POST', body }); setIssued(t); onIssued() }
    catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }
  const submitWalkIn = (e) => {
    e.preventDefault()
    if (!f.doctorId) return setError('Pick a doctor')
    if (!f.patientId && f.name.trim().length < 2) return setError('Pick a patient or enter a name')
    issue({ doctorId: Number(f.doctorId), ...(f.patientId ? { patientId: Number(f.patientId) } : { name: f.name.trim() }) })
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(trackUrl(issued.code, lanOrigin)); setCopied(true) } catch { setError('Copy failed - select the link and copy it manually') }
  }
  const tabCls = (on) => `flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${on ? 'bg-card shadow-sm' : 'text-muted'}`

  return (
    <Modal open onClose={onClose} title={issued ? 'Token issued' : 'Issue token'}>
      {issued ? (
        <div className="space-y-4 text-center">
          <p className="text-5xl font-extrabold tracking-wide text-brand-700">{issued.code}</p>
          <p className="text-sm"><b>{issued.name}</b> · {issued.doctor}</p>
          <p className="text-sm text-muted">Position {issued.position} · {fmtWait(issued.estWaitMin)}</p>
          <div className="rounded-xl bg-surface p-3 text-left">
            <p className="mb-1 text-xs font-semibold text-muted">Patient phone link</p>
            <div className="flex items-center gap-2">
              <a href={trackUrl(issued.code, lanOrigin)} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm font-semibold text-brand-700 underline">{trackUrl(issued.code, lanOrigin)}</a>
              <Button variant="secondary" onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy'}</Button>
            </div>
          </div>
          {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
          <div className="flex justify-center gap-2">
            <Button variant="secondary" onClick={() => { setIssued(null); setCopied(false); setF({ doctorId: '', patientId: '', name: '' }) }}>Issue another</Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-1 rounded-xl bg-surface p-1">
            <button className={tabCls(tab === 'appt')} onClick={() => { setTab('appt'); setError('') }}>Booked appointment</button>
            <button className={tabCls(tab === 'walkin')} onClick={() => { setTab('walkin'); setError('') }}>Walk-in</button>
          </div>
          {tab === 'appt' ? (
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {appts.loading ? <p className="text-sm text-muted">Loading…</p> : open.length === 0 ? <p className="py-6 text-center text-sm text-muted">No open appointments left to check in today.</p> : open.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl bg-surface p-3">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{a.time} · {a.patient}</p><p className="truncate text-xs text-muted">{a.doctor?.name}</p></div>
                  <Button disabled={busy} onClick={() => issue({ appointmentId: a.id })}>Check in</Button>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={submitWalkIn} className="space-y-3">
              <Field label="Doctor">
                <select className={inputCls} value={f.doctorId} onChange={(e) => setF({ ...f, doctorId: e.target.value })}>
                  <option value="">Select…</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.department}</option>)}
                </select>
              </Field>
              <Field label="Patient">
                <select className={inputCls} value={f.patientId} onChange={(e) => setF({ ...f, patientId: e.target.value })}>
                  <option value="">Not registered - enter name below</option>
                  {(pts.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              {!f.patientId && <Field label="Walk-in name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>}
              <div className="flex justify-end"><Button type="submit" disabled={busy}>{busy ? 'Issuing…' : 'Issue token'}</Button></div>
            </form>
          )}
          {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
        </div>
      )}
    </Modal>
  )
}
