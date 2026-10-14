import { Pill } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import Skeleton from '../components/ui/Skeleton'
import PatientDocuments from '../components/patients/PatientDocuments'
import PrescriptionCard from '../components/patients/PrescriptionCard'
import { useFetch } from '../lib/useFetch'
import { useLiveSync } from '../lib/useLiveSync'
import { useRole } from '../lib/roleStore'

export default function Prescriptions() {
  const { patientId } = useRole()
  const rx = useFetch(`/prescriptions?patientId=${patientId}`)
  useLiveSync({ prescriptions: rx.refetch })
  return (
    <div className="space-y-6">
      <PageHeader title="My records" subtitle="Prescriptions and documents, newest first" />
      {rx.loading ? <Skeleton className="h-40" /> : rx.error ? (
        <Card><EmptyState title="Couldn't load prescriptions" text={rx.error} action={<Button onClick={rx.refetch}>Retry</Button>} /></Card>
      ) : rx.data.length === 0 ? (
        <Card><EmptyState icon={Pill} title="No prescriptions yet" text="Anything your doctor prescribes appears here." /></Card>
      ) : (
        <div className="space-y-3">{rx.data.map((p) => <PrescriptionCard key={p.id} rx={p} />)}</div>
      )}
      <Card title="Paper prescriptions & reports"><PatientDocuments patientId={patientId} /></Card>
    </div>
  )
}
