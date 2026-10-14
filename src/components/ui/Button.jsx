const variants = {
  primary: 'bg-brand-600 text-on-brand hover:bg-brand-700 shadow-sm',
  secondary: 'bg-card text-ink border border-line hover:bg-surface',
  ghost: 'text-muted hover:bg-surface hover:text-ink',
  danger: 'bg-danger-solid text-white hover:brightness-90',
}
export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
