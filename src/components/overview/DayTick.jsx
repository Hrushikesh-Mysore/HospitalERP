// X-axis tick that wraps the "Today (so far)" label onto two lines.
export default function DayTick({ x, y, payload }) {
  const [first, ...rest] = String(payload.value).split(' ')
  return (
    <text x={x} y={y + 12} textAnchor="middle" fontSize={12} fill="#64748b">
      <tspan x={x}>{first}</tspan>
      {rest.length > 0 && <tspan x={x} dy={14}>{rest.join(' ')}</tspan>}
    </text>
  )
}
