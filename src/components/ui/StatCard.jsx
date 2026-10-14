import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

const tones = { brand: 'bg-brand-50 text-brand-600', info: 'bg-blue-50 text-info', warn: 'bg-amber-50 text-warn', ok: 'bg-green-50 text-ok' }

export default function StatCard({ label, value, delta, up, icon: Icon, tone = 'brand' }) {
  const Trend = up ? TrendingUp : TrendingDown
  return (
    <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-line bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>{Icon && <Icon size={20} />}</div>
        {delta && (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? 'text-ok' : 'text-muted'}`}>
            <Trend size={14} /> {delta}
          </span>
        )}
      </div>
      <p className="mt-4 truncate text-3xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </motion.div>
  )
}
