import Card from '../components/ui/Card'

export default function Placeholder({ title }) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">{title}</h1>
      <Card><p className="text-muted">Coming in a later phase.</p></Card>
    </div>
  )
}
