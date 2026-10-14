import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Siren } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import CaseCard from '../components/emergency/CaseCard'
import AddCaseModal from '../components/emergency/AddCaseModal'
import { useFetch } from '../lib/useFetch'
import { useLiveSync } from '../lib/useLiveSync'

export default function Emergency() {
  const { data, error, loading, refetch } = useFetch('/emergency')
  useLiveSync({ emergency: refetch })
  const [now, setNow] = useState(() => Date.now())
  const [adding, setAdding] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const waiting = data?.filter((c) => c.status === 'waiting') ?? []
  const done = data?.filter((c) => c.status !== 'waiting') ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Emergency" subtitle={`${waiting.length} waiting`}
        action={<Button onClick={() => setAdding(true)}><Plus size={16} /> Add emergency case</Button>} />
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : error && !data ? (
        <Card><EmptyState title="Couldn't load the queue" text={error} action={<Button onClick={refetch}>Retry</Button>} /></Card>
      ) : waiting.length === 0 ? (
        <Card><EmptyState icon={Siren} title="No one is waiting" text="The triage queue is clear." action={<Button onClick={() => setAdding(true)}><Plus size={16} /> Add emergency case</Button>} /></Card>
      ) : (
        <ul className="space-y-3">{waiting.map((c) => <CaseCard key={c.id} c={c} now={now} onAssign={(x) => navigate(`/beds?assign=${x.id}`)} />)}</ul>
      )}
      {done.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-muted">Admitted from emergency</h2>
          <ul className="space-y-3 opacity-80">{done.map((c) => <CaseCard key={c.id} c={c} now={now} onAssign={() => {}} />)}</ul>
        </div>
      )}
      <AddCaseModal open={adding} onClose={() => setAdding(false)} onCreated={refetch} />
    </div>
  )
}
