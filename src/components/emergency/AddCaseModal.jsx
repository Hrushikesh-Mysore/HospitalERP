// Form for adding an emergency case with a triage priority.
import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Field, { inputCls } from '../ui/Field'
import { useToast } from '../../lib/toastStore'
import { api } from '../../lib/api'
import { triage } from '../../lib/status'

const empty = { name: '', age: '', complaint: '', priority: 3 }

export default function AddCaseModal({ open, onClose, onCreated }) {
  const [f, setF] = useState(empty)
  const [error, setError] = useState('')
  const toast = useToast()
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (f.name.trim().length < 2 || f.complaint.trim().length < 2 || f.age === '') return setError('Name, age and complaint are required.')
    try {
      await api('/emergency', { method: 'POST', body: { ...f, age: Number(f.age), priority: Number(f.priority) } })
      toast('Emergency case added'); setF(empty); setError(''); onCreated(); onClose()
    } catch (err) { setError(err.message) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add emergency case">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Patient name"><input className={inputCls} value={f.name} onChange={set('name')} /></Field>
        <Field label="Age"><input type="number" className={inputCls} value={f.age} onChange={set('age')} /></Field>
        <Field label="Complaint"><input className={inputCls} value={f.complaint} onChange={set('complaint')} /></Field>
        <Field label="Triage priority">
          <select className={inputCls} value={f.priority} onChange={set('priority')}>
            {Object.entries(triage).map(([k, t]) => <option key={k} value={k}>P{k} · {t.label}</option>)}
          </select>
        </Field>
        {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Add case</Button></div>
      </form>
    </Modal>
  )
}
