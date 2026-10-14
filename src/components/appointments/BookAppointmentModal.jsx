import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Field, { inputCls } from '../ui/Field'
import { useToast } from '../../lib/toastStore'
import { api } from '../../lib/api'

export default function BookAppointmentModal({ open, onClose, date, patients, doctors, slots, booked, onBooked }) {
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [time, setTime] = useState('')
  const [reason, setReason] = useState('Consultation')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const taken = (t) => booked.some((a) => a.doctorId === Number(doctorId) && a.date === date && a.time === t && a.status !== 'cancelled')

  const submit = async (e) => {
    e.preventDefault()
    if (!patientId || !doctorId || !time) return setError('Choose a patient, doctor and time slot.')
    setBusy(true); setError('')
    try {
      await api('/appointments', { method: 'POST', body: { patientId: Number(patientId), doctorId: Number(doctorId), date, time, reason } })
      toast('Appointment booked')
      setTime('')
      onBooked()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Book appointment · ${date}`}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Patient">
          <select className={inputCls} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="">Select…</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Doctor">
          <select className={inputCls} value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setError('') }}>
            <option value="">Select…</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.department}</option>)}
          </select>
        </Field>
        <div>
          <span className="mb-1 block text-xs font-semibold text-muted">Time slot</span>
          <div className="grid grid-cols-4 gap-2">
            {slots.map((s) => (
              <button type="button" key={s} onClick={() => { setTime(s); setError('') }}
                className={`rounded-xl border px-2 py-2 text-sm font-semibold transition-colors ${time === s ? 'border-brand-600 bg-brand-600 text-on-brand' : 'border-line hover:bg-brand-50'}`}>
                {s}{doctorId && taken(s) && <span className="block text-[10px] font-medium opacity-70">booked</span>}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">Slots marked "booked" will be rejected by the server.</p>
        </div>
        <Field label="Reason"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        {error && <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Booking…' : 'Book'}</Button>
        </div>
      </form>
    </Modal>
  )
}
