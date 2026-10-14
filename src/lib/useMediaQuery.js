import { useSyncExternalStore } from 'react'

export function useMediaQuery(query) {
  const subscribe = (fn) => {
    const m = window.matchMedia(query)
    m.addEventListener('change', fn)
    return () => m.removeEventListener('change', fn)
  }
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}

export const useIsPhone = () => useMediaQuery('(max-width: 639px)')
