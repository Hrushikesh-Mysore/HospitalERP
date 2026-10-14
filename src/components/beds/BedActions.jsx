import { useState } from 'react'
import Button from '../ui/Button'
import { inputCls } from '../ui/Field'
import { useToast } from '../ui/Toast'
import { api } from '../../lib/api'

export default function BedActions({ bed, patients, onDone, onClose }) {
  const [patientId, setPatientId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const eligible = patients.filter((p) => p.status !== 'admitted')

  const run = async (path, opts, msg) => {
    setBusy(true); setError('')
    try { await api(`/beds/${bed.id}${path}`, opts); toast(msg); onDone(); onClose() }
    catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="w-64 space-y-3 text-sm">
      <div><p className="font-bold">Bed {bed.label}</p><p className="text-xs capitalize text-muted">{bed.ward} · {bed.status}{bed.patient ? ` · ${bed.patient}` : ''}</p></div>
      {bed.status === 'free' && (
        <>
          <select className={inputCls} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="">Select patient…</option>
            {eligible.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Button className="w-full" disabled={!patientId || busy} onClick={() => run('/admit', { method: 'POST', body: { patientId: Number(patientId) } }, 'Patient admitted')}>Admit patient</Button>
          <Button className="w-full" variant="secondary" disabled={busy} onClick={() => run('', { method: 'PATCH', body: { status: 'cleaning' } }, 'Marked for cleaning')}>Mark cleaning</Button>
        </>
      )}
      {bed.status === 'occupied' && <Button className="w-full" variant="danger" disabled={busy} onClick={() => run('/discharge', { method: 'POST' }, 'Patient discharged')}>Discharge</Button>}
      {bed.status === 'cleaning' && <Button className="w-full" disabled={busy} onClick={() => run('', { method: 'PATCH', body: { status: 'free' } }, 'Bed is free')}>Mark clean &amp; free</Button>}
      {error && <p role="alert" className="text-xs font-medium text-danger">{error}</p>}
    </div>
  )
}
