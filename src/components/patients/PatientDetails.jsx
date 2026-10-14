import { Heart, Activity, Thermometer, Droplets, Pencil, Trash2, Pill } from 'lucide-react'
import Button from '../ui/Button'
import PrescriptionCard from './PrescriptionCard'
import PatientDocuments from './PatientDocuments'
import { useFetch } from '../../lib/useFetch'
import { useLiveSync } from '../../lib/useLiveSync'
import StatusMenu from '../ui/StatusMenu'
import StatusTimeline from '../ui/StatusTimeline'
import { statusTone } from '../../lib/status'
import { buildTimeline } from '../../lib/statusTimeline'
import { api } from '../../lib/api'
import { useToast } from '../../lib/toastStore'

export default function PatientDetails({ patient: p, onEdit, onDelete, onPrescribe, canEditStatus, onChanged }) {
  const rx = useFetch(`/prescriptions?patientId=${p.id}`)
  const appts = useFetch('/appointments')
  const beds = useFetch('/beds')
  const rules = useFetch('/status-rules')
  const toast = useToast()
  useLiveSync({ prescriptions: rx.refetch, appointments: appts.refetch, beds: beds.refetch })

  // Next statuses come from the server. Admitting / discharging go through the normal bed flow, never a plain status edit.
  const options = !canEditStatus || !rules.data ? [] : [
    ...rules.data.patient[p.status].map((value) => ({ value })),
    ...(p.status === 'admitted' ? [{ value: 'discharged', label: 'Discharge from bed…' }] : [{ value: 'admitted', label: 'Admit to bed…', needsBed: true }]),
  ]
  const applyStatus = async (option, { note, bedId }) => {
    if (option.value === 'admitted') await api(`/beds/${bedId}/admit`, { method: 'POST', body: { patientId: p.id, note } })
    else if (option.value === 'discharged') await api(`/beds/${p.bedId}/discharge`, { method: 'POST', body: { note } })
    else await api(`/patients/${p.id}/status`, { method: 'PATCH', body: { status: option.value, note } })
    toast(`${p.name} is now ${option.value}`)
    onChanged?.()
  }
  const timeline = buildTimeline(p, appts.data ?? [])
  const vitals = [
    { label: 'Heart rate', value: `${p.vitals.heartRate} bpm`, icon: Heart },
    { label: 'Blood pressure', value: p.vitals.bp, icon: Activity },
    { label: 'Temperature', value: `${p.vitals.temp} °C`, icon: Thermometer },
    { label: 'SpO₂', value: `${p.vitals.spo2}%`, icon: Droplets },
  ]
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xl font-extrabold">{p.name}</p>
        <p className="text-sm text-muted">{p.age} yrs · {p.gender} · {p.phone}</p>
        <div className="mt-2"><StatusMenu noun="patient" value={p.status} tone={statusTone[p.status]} options={options} onApply={applyStatus} noteMax={rules.data?.noteMax}
          beds={(beds.data ?? []).filter((b) => b.status === 'free')} /></div>
        {(onEdit || onDelete || onPrescribe) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {onPrescribe && <Button onClick={onPrescribe}><Pill size={14} /> Prescribe</Button>}
            {onEdit && <Button variant="secondary" onClick={onEdit}><Pencil size={14} /> Edit</Button>}
            {onDelete && <Button variant="secondary" onClick={onDelete} className="!text-danger"><Trash2 size={14} /> Delete</Button>}
          </div>
        )}
      </div>
      <div className="rounded-2xl bg-surface p-4 text-sm">
        <p className="text-xs font-semibold text-muted">Condition</p><p className="font-semibold">{p.condition}</p>
        <p className="mt-3 text-xs font-semibold text-muted">Assigned doctor</p>
        <p className="font-semibold">{p.doctor?.name} <span className="font-normal text-muted">· {p.doctor?.department}</span></p>
      </div>
      <div>
        <p className="mb-2 text-sm font-bold">Vitals</p>
        <div className="grid grid-cols-2 gap-3">
          {vitals.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-line p-3">
              <Icon size={16} className="text-brand-600" />
              <p className="mt-1 text-lg font-bold">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>
      {rx.data?.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-bold">Prescriptions</p>
          <div className="space-y-3">{rx.data.slice(0, 3).map((x) => <PrescriptionCard key={x.id} rx={x} />)}</div>
        </div>
      )}
      <div>
        <p className="mb-3 text-sm font-bold">Status changes</p>
        <StatusTimeline entries={timeline} />
      </div>
      <PatientDocuments patientId={p.id} />
      <div>
        <p className="mb-3 text-sm font-bold">History</p>
        <ol className="space-y-4 border-l-2 border-brand-100 pl-4">
          {[...p.history].reverse().map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[22px] top-1 h-3 w-3 rounded-full border-2 border-card bg-brand-500" />
              <p className="text-sm font-semibold">{h.event}</p>
              <p className="text-xs text-muted">{h.date}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
