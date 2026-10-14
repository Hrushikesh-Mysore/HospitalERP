const tones = {
  green: 'bg-green-50 text-ok',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-danger',
  blue: 'bg-blue-50 text-info',
  gray: 'bg-slate-100 text-muted',
}
export default function Badge({ tone = 'gray', children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}
