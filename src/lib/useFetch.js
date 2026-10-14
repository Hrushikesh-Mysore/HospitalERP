import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

export function useFetch(path, { interval } = {}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setData(await api(path))
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    load()
    if (!interval) return
    const t = setInterval(load, interval)
    return () => clearInterval(t)
  }, [load, interval])

  return { data, error, loading, refetch: load }
}
