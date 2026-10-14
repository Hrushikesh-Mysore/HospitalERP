import { BedDouble } from 'lucide-react'

export const bedStyle = {
  free: 'border-green-200 bg-green-50 text-ok hover:bg-green-100',
  occupied: 'border-red-200 bg-red-50 text-danger hover:bg-red-100',
  cleaning: 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100',
}

export default function BedTile({ bed, active, onClick }) {
  return (
    <button onClick={onClick} aria-label={`Bed ${bed.label} ${bed.status}`}
      className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 transition-all hover:-translate-y-0.5 hover:shadow-md ${bedStyle[bed.status]} ${active ? 'ring-2 ring-brand-500 ring-offset-2' : ''}`}>
      <BedDouble size={22} />
      <span className="text-sm font-bold">{bed.label}</span>
      <span className="w-full truncate text-center text-[11px] font-medium opacity-80">{bed.patient ?? bed.status}</span>
    </button>
  )
}
