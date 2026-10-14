export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      {Icon && <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon size={22} /></span>}
      <p className="font-bold">{title}</p>
      {text && <p className="mb-4 mt-1 max-w-xs text-sm text-muted">{text}</p>}
      {action}
    </div>
  )
}
