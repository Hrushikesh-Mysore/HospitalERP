import { useRef, useState } from 'react'
import { Camera, FileText, Paperclip, ImageOff } from 'lucide-react'
import Button from '../ui/Button'
import DocumentViewer from './DocumentViewer'
import { useFetch } from '../../lib/useFetch'
import { useLiveSync } from '../../lib/useLiveSync'
import { useToast } from '../../lib/toastStore'
import { compressImage } from '../../lib/compressImage'
import { api } from '../../lib/api'

const categories = ['prescription', 'report', 'scan']
const MAX_BYTES = 5 * 1024 * 1024

export default function PatientDocuments({ patientId }) {
  const docs = useFetch(`/patients/${patientId}/documents`)
  useLiveSync({ documents: docs.refetch })
  const toast = useToast()
  const camera = useRef(null)
  const picker = useRef(null)
  const [category, setCategory] = useState('prescription')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(null)
  const list = docs.data ?? []

  const send = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow picking the same file again
    if (!file) return
    setBusy(true); setError('')
    try {
      const ready = file.type.startsWith('image/') ? await compressImage(file) : file
      if (ready.size > MAX_BYTES) throw new Error('File is too large (max 5 MB)')
      const form = new FormData()
      form.set('category', category)
      form.set('file', ready, ready.name)
      await api(`/patients/${patientId}/documents`, { method: 'POST', body: form })
      toast(`${category[0].toUpperCase()}${category.slice(1)} added`)
      docs.refetch()
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  const remove = async (doc) => {
    try {
      await api(`/patients/${patientId}/documents/${doc.id}`, { method: 'DELETE' })
      toast('Document deleted')
      setOpen(null)
      docs.refetch()
    } catch (err) { toast(err.message, 'error') }
  }

  return (
    <section>
      <p className="mb-2 text-sm font-bold">Documents</p>
      <div className="mb-3 flex gap-1 rounded-xl bg-surface p-1" role="group" aria-label="Document category">
        {categories.map((c) => (
          <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold capitalize ${category === c ? 'bg-card shadow-sm' : 'text-muted'}`}>{c}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => camera.current.click()}><Camera size={16} /> {busy ? 'Uploading…' : `Add ${category}`}</Button>
        <Button variant="secondary" disabled={busy} onClick={() => picker.current.click()}><Paperclip size={16} /> Choose file</Button>
      </div>
      <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={send} data-testid="camera-input" />
      <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={send} data-testid="file-input" />
      <p className="mt-2 text-xs text-muted">Photos are shrunk to 1600px before upload. Demo only: use sample images, never real patient documents.</p>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-danger">{error}</p>}

      {docs.loading ? null : list.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-surface p-3 text-sm text-muted"><ImageOff size={16} /> No documents yet.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-3 gap-2">
          {list.map((d, i) => (
            <li key={d.id}>
              <button onClick={() => setOpen(i)} aria-label={`Open ${d.category}: ${d.name}`} className="tap-auto relative block aspect-square w-full overflow-hidden rounded-xl border border-line bg-surface">
                {d.mime === 'application/pdf'
                  ? <span className="grid h-full place-items-center text-muted"><FileText size={28} /></span>
                  : <img src={d.url} alt="" loading="lazy" className="h-full w-full object-cover" />}
                <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[10px] font-semibold capitalize text-white">{d.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open !== null && <DocumentViewer docs={list} index={Math.min(open, list.length - 1)} onIndex={setOpen} onClose={() => setOpen(null)} onDelete={remove} />}
    </section>
  )
}
