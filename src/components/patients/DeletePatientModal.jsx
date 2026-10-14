// Delete confirmation that lists what will be cancelled.
import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { api } from '../../lib/api'

const when = (a) => `${a.date} ${a.time} · ${a.doctor}`

export default function DeletePatientModal({ patient, onClose, onDeleted }) {
  const [impact, setImpact] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const admitted = patient?.status === 'admitted'

  useEffect(() => {
    if (!patient) return
    let alive = true
    api(`/patients/${patient.id}/impact`).then((d) => alive && setImpact(d)).catch((e) => alive && setError(e.message))
    return () => { alive = false; setImpact(null); setError('') }
  }, [patient])

  const confirm = async () => {
    setBusy(true)
    try { onDeleted(patient, await api(`/patients/${patient.id}`, { method: 'DELETE' })) }
    catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  const items = impact ? [
    ...impact.cancel.map((a) => `Cancel appointment ${when(a)}`),
    ...impact.noShow.map((a) => `Mark past appointment ${when(a)} as no-show`),
    ...impact.cases.map((c) => `Remove emergency case "${c.complaint}" (P${c.priority}) from the waiting queue`),
  ] : []

  return (
    <Modal open={!!patient} onClose={onClose} title="Delete patient record?">
      {patient && (
        <div className="space-y-4">
          <p className="text-sm">You are about to delete <strong>{patient.name}</strong>. You can undo for 5 seconds afterwards.</p>
          {admitted ? (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger"><AlertTriangle size={16} className="mt-0.5 shrink-0" />Discharge first: this patient is still admitted to a bed.</p>
          ) : impact && (
            <div className="rounded-xl bg-surface p-3 text-sm">
              <p className="mb-1 font-semibold">This will:</p>
              {items.length ? <ul className="list-disc space-y-1 pl-5">{items.map((t) => <li key={t}>{t}</li>)}</ul> : <p className="text-muted">Not change any appointments or queues.</p>}
            </div>
          )}
          {error && !admitted && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Keep patient</Button>
            <Button variant="danger" onClick={confirm} disabled={busy || admitted || !impact}>{busy ? 'Deleting…' : 'Delete patient'}</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
