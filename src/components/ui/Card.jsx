export default function Card({ title, action, className = '', children }) {
  return (
    <section className={`rounded-2xl border border-line bg-card p-6 shadow-sm ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold">{title}</h3>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
