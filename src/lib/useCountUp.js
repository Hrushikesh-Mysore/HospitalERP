import { useEffect, useState } from 'react'

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

// Animates 0 -> target on first mount, then eases between later values. Non-numbers pass through.
export function useCountUp(target, duration = 700) {
  const numeric = typeof target === 'number' && Number.isFinite(target)
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (!numeric || reduced()) return
    let raf, from
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      setShown((prev) => {
        from ??= prev
        return Math.round(from + (target - from) * (1 - (1 - t) ** 3))
      })
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, numeric, duration])

  return numeric && !reduced() ? shown : target
}
