import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'
import { inputCls } from '../components/ui/Field'
import { useFetch } from '../lib/useFetch'
import { useLiveSync } from '../lib/useLiveSync'
import TokenCard from '../components/queue/TokenCard'

function CodeForm({ error }) {
  const [code, setCode] = useState('')
  const navigate = useNavigate()
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) navigate(`/token/${code.trim().toUpperCase()}`) }} className="space-y-3">
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}. Check the code on your slip.</p>}
      <input className={inputCls} placeholder="Token code, e.g. D2-014" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Token code" />
      <Button type="submit" className="w-full">Track my token</Button>
    </form>
  )
}

// Patient phone view: opened from the link/QR on the token slip. No sign-in, no layout chrome.
export default function TokenStatus() {
  const { ref } = useParams()
  const q = useFetch(`/tokens/${ref ?? 'none'}`, { anon: true })
  useLiveSync({ tokens: q.refetch })
  const t = ref ? q.data : null

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-4">
      <div className="flex items-center justify-center gap-2 text-lg font-extrabold">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-on-brand"><HeartPulse size={20} /></span> MediCore
      </div>
      <div className="rounded-3xl border border-line bg-card p-6 text-center shadow-sm">
        {!ref ? (
          <div className="space-y-4"><p className="font-bold">Where am I in the queue?</p><CodeForm /></div>
        ) : q.loading ? (
          <Skeleton className="h-64" />
        ) : !t ? (
          <CodeForm error={q.error ?? 'Token not found'} />
        ) : (
          <TokenCard token={t} />
        )}
      </div>
    </div>
  )
}
