// Queue page: doctor console for doctors, live queues and token issuing for reception and admin.
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import Skeleton from '../components/ui/Skeleton'
import DoctorConsole from '../components/queue/DoctorConsole'
import ReceptionQueue from '../components/queue/ReceptionQueue'
import { useFetch } from '../lib/useFetch'
import { useLiveSync } from '../lib/useLiveSync'
import { useRole } from '../lib/roleStore'

export default function Queue() {
  const { role, doctorId } = useRole()
  const q = useFetch('/tokens')
  useLiveSync({ tokens: q.refetch })

  if (q.loading) return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-64" /></div>
  if (q.error) return <Card><EmptyState title="Couldn't load the queue" text={q.error} action={<Button onClick={q.refetch}>Retry</Button>} /></Card>
  if (role !== 'Doctor') return <ReceptionQueue data={q.data} onChange={q.refetch} />

  const doctor = q.data.doctors.find((d) => d.id === doctorId)
  return (
    <div className="space-y-6">
      <PageHeader title="My Queue" subtitle={`${doctor.name} · ${doctor.waiting.length} waiting`} />
      <DoctorConsole doctor={doctor} onChange={q.refetch} />
    </div>
  )
}
