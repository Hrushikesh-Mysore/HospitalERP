import { soft } from '../../lib/status'

export default function Badge({ tone = 'gray', children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${soft[tone]}`}>{children}</span>
}
