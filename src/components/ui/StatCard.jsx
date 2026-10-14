import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useCountUp } from '../../lib/useCountUp'
import { soft, statCardTone } from '../../lib/status'


export default function StatCard({ label, value, delta, up, icon: Icon, tone = 'brand', index = 0 }) {
  const shown = useCountUp(value)
  const Trend = up ? TrendingUp : TrendingDown
  return (
    <motion.div whileHover={{ y: -3 }} style={{ '--i': index }} className="rise rounded-2xl border border-line bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${soft[statCardTone[tone]]}`}>{Icon && <Icon size={20} />}</div>
        {delta && (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? 'text-ok' : 'text-muted'}`}>
            <Trend size={14} /> {delta}
          </span>
        )}
      </div>
      <p className="mt-4 truncate text-3xl font-extrabold tracking-tight">{shown}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </motion.div>
  )
}
