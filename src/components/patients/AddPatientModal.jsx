import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Field, { inputCls } from '../ui/Field'
import { useToast } from '../../lib/toastStore'
import { api } from '../../lib/api'

const empty = { name: '', age: '', gender: 'F', phone: '', condition: '', doctorId: '' }

export default function AddPatientModal({ open, onClose, doctors, onCreated }) {
  const [f, setF] = useState(empty)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (f.name.trim().length < 2) errs.name = 'Enter a full name'
    if (!(Number(f.age) >= 0 && f.age !== '' && Number(f.age) <= 120)) errs.age = 'Age must be 0–120'
    if (f.phone.trim().length < 5) errs.phone = 'Enter a valid phone number'
    if (f.condition.trim().length < 2) errs.condition = 'Describe the condition'
    if (!f.doctorId) errs.doctorId = 'Pick a doctor'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const p = await api('/patients', { method: 'POST', body: { ...f, age: Number(f.age), doctorId: Number(f.doctorId) } })
      toast(`${p.name} registered`)
      setF(empty)
      onCreated()
      onClose()
    } catch (err) {
      setErrors({ form: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add patient">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Full name" error={errors.name}><input className={inputCls} value={f.name} onChange={set('name')} /></Field></div>
        <Field label="Age" error={errors.age}><input type="number" className={inputCls} value={f.age} onChange={set('age')} /></Field>
        <Field label="Gender"><select className={inputCls} value={f.gender} onChange={set('gender')}><option value="F">Female</option><option value="M">Male</option><option value="O">Other</option></select></Field>
        <Field label="Phone" error={errors.phone}><input className={inputCls} value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Doctor" error={errors.doctorId}>
          <select className={inputCls} value={f.doctorId} onChange={set('doctorId')}>
            <option value="">Select…</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.department}</option>)}
          </select>
        </Field>
        <div className="sm:col-span-2"><Field label="Condition" error={errors.condition}><input className={inputCls} value={f.condition} onChange={set('condition')} /></Field></div>
        {errors.form && <p className="text-sm font-medium text-danger sm:col-span-2">{errors.form}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Add patient'}</Button>
        </div>
      </form>
    </Modal>
  )
}
