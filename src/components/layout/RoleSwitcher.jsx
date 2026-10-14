// Role dropdown plus the doctor picker or signed-in patient name.
import { useRole } from '../../lib/roleStore'
import { useFetch } from '../../lib/useFetch'
import { roles } from '../../lib/roles'

const pick = 'w-32 rounded-xl border border-brand-200 bg-brand-50 px-2 py-2 text-sm font-semibold text-brand-700 outline-none focus:border-brand-500 sm:w-auto sm:px-3'

function DoctorPicker() {
  const { doctorId, setDoctorId } = useRole()
  const docs = useFetch('/doctors')
  return (
    <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} aria-label="View as doctor" className={pick}>
      {(docs.data?.doctors ?? [{ id: doctorId, name: `Doctor ${doctorId}` }]).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
    </select>
  )
}

function PatientChip() {
  const { patient, setPatient } = useRole()
  if (!patient) return null
  return (
    <span className="flex items-center gap-1 text-sm">
      <b className="max-w-28 truncate sm:max-w-40">{patient.name}</b>
      <button onClick={() => setPatient(null)} className="tap-auto rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 underline">Not you?</button>
    </span>
  )
}

// role select plus the "who am I" picker for Doctor / Patient
export default function RoleSwitcher({ className = '' }) {
  const { role, setRole } = useRole()
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {role === 'Doctor' && <DoctorPicker />}
      {role === 'Patient' && <PatientChip />}
      <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Switch role"
        className="w-28 rounded-xl border border-line bg-card px-2 py-2 text-sm font-semibold outline-none sm:w-auto sm:px-3 focus:border-brand-500">
        {roles.map((r) => <option key={r}>{r}</option>)}
      </select>
    </div>
  )
}
