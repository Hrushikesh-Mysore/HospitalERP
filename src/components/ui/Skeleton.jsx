export default function Skeleton({ className = 'h-24 w-full' }) {
  return <div className={`animate-pulse rounded-xl bg-skeleton ${className}`} />
}
