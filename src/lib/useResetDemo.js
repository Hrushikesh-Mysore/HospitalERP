import { api } from './api'
import { useToast } from './toastStore'

export function useResetDemo(onDone) {
  const toast = useToast()
  return async () => {
    try { await api('/demo/reset', { method: 'POST' }); toast('Demo data reset'); onDone() }
    catch (e) { toast(e.message, 'error') }
  }
}
