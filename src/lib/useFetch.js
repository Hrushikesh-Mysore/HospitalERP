import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'

export function useFetch(path, { interval } = {}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const alive = useRef(true)

  const refetch = useCallback(async () => {
    try {
      const next = await api(path)
      if (!alive.current) return
      setData(next)
      setError(null)
    } catch (e) {
      if (alive.current) setError(e.message)
    } finally {
      if (alive.current) setLoading(false)
    }
  }, [path])

  useEffect(() => {
    alive.current = true
    const t0 = setTimeout(refetch, 0)
    const t = interval ? setInterval(refetch, interval) : null
    return () => { alive.current = false; clearTimeout(t0); if (t) clearInterval(t) }
  }, [refetch, interval])

  return { data, error, loading, refetch }
}
