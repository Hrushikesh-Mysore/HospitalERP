// Doctor form for issuing a prescription.
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Field, { inputCls } from '../ui/Field'
import { useToast } from '../../lib/toastStore'
import { api } from '../../lib/api'

const blank = () => ({ name: '', dose: '', frequency: '', days: '' })

export default function PrescribeModal({ patient, doctorId, onClose }) {
  const toast = useToast()
  const [rows, setRows] = useState([blank()])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (i, k) => (e) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: e.target.value } : r)))

  const submit = async (e) => {
    e.preventDefault()
    const medicines = rows.map((r) => ({ name: r.name.trim(), dose: r.dose.trim(), frequency: r.frequency.trim(), days: Number(r.days) }))
    if (medicines.some((m) => m.name.length < 2 || !m.dose || !m.frequency || !(m.days >= 1))) return setError('Fill in name, dose, how often and days for each medicine')
    setBusy(true); setError('')
    try {
      await api('/prescriptions', { method: 'POST', body: { patientId: patient.id, doctorId, medicines, notes } })
      toast(`Prescription saved for ${patient.name}`)
      onClose()
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return (
    <Modal open onClose={onClose} title={`Prescribe · ${patient.name}`}>
      <form onSubmit={submit} className="space-y-4">
        {rows.map((r, i) => (
          <div key={i} className="space-y-2 rounded-xl bg-surface p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted">Medicine {i + 1}</p>
              {rows.length > 1 && <button type="button" aria-label="Remove medicine" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="rounded-lg p-1 text-muted hover:bg-card"><Trash2 size={16} /></button>}
            </div>
            <Field label="Name"><input className={inputCls} value={r.name} onChange={set(i, 'name')} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Dose"><input className={inputCls} value={r.dose} onChange={set(i, 'dose')} placeholder="500 mg" /></Field>
              <Field label="Days"><input type="number" inputMode="numeric" className={inputCls} value={r.days} onChange={set(i, 'days')} /></Field>
            </div>
            <Field label="How often"><input className={inputCls} value={r.frequency} onChange={set(i, 'frequency')} placeholder="Twice daily after meals" /></Field>
          </div>
        ))}
        {rows.length < 5 && <Button type="button" variant="secondary" onClick={() => setRows([...rows, blank()])}><Plus size={16} /> Add medicine</Button>}
        <Field label="Notes (optional)"><input className={inputCls} value={notes} maxLength={200} onChange={(e) => setNotes(e.target.value)} /></Field>
        {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save prescription'}</Button>
        </div>
      </form>
    </Modal>
  )
}
