import { BedDouble } from 'lucide-react'
import { bedStatus } from '../../lib/status'

export default function BedTile({ bed, active, onClick }) {
  return (
    <button onClick={onClick} aria-label={`Bed ${bed.label} ${bed.status}`}
      className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${bedStatus[bed.status].tile} ${active ? 'ring-2 ring-brand-500 ring-offset-2' : ''}`}>
      <BedDouble size={22} />
      <span className="text-sm font-bold">{bed.label}</span>
      <span className="w-full truncate text-center text-[11px] font-medium opacity-80">{bed.patient ?? bed.status}</span>
    </button>
  )
}
