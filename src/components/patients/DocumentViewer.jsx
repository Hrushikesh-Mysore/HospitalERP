// Full-screen viewer for an uploaded image or PDF.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, ExternalLink, Trash2, X } from 'lucide-react'
import Button from '../ui/Button'

// Full-screen viewer for a patient's documents, with a confirm step before delete.
// Portaled to <body>: a transformed ancestor (the sliding sheet) would otherwise trap `position: fixed`.
export default function DocumentViewer({ docs, index, onIndex, onClose, onDelete }) {
  const doc = docs[index]
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { if (confirming) setConfirming(false); else onClose() }
      if (!confirming && e.key === 'ArrowRight' && index < docs.length - 1) onIndex(index + 1)
      if (!confirming && e.key === 'ArrowLeft' && index > 0) onIndex(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirming, index, docs.length, onIndex, onClose])

  if (!doc) return null
  const remove = async () => {
    setBusy(true)
    try { await onDelete(doc) } finally { setBusy(false); setConfirming(false) }
  }
  const nav = 'absolute top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70'

  return createPortal(
    <div role="dialog" aria-label="Document viewer" className="fixed inset-0 z-[70] flex flex-col bg-black">
      <header className="flex items-center gap-2 p-3 text-white">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{doc.name}</p>
          <p className="text-xs capitalize text-white/70">{doc.category} · {new Date(doc.uploadedAt).toLocaleDateString()} · {Math.round(doc.size / 1024)} KB</p>
        </div>
        <a href={doc.url} target="_blank" rel="noreferrer" aria-label="Open in new tab" className="grid place-items-center rounded-xl p-2 hover:bg-white/10"><ExternalLink size={20} /></a>
        <button onClick={() => setConfirming(true)} aria-label="Delete document" className="rounded-xl p-2 text-red-300 hover:bg-white/10"><Trash2 size={20} /></button>
        <button onClick={onClose} aria-label="Close viewer" autoFocus className="rounded-xl p-2 hover:bg-white/10"><X size={22} /></button>
      </header>
      <div className="relative min-h-0 flex-1">
        {doc.mime === 'application/pdf'
          ? <iframe title={doc.name} src={doc.url} className="h-full w-full bg-white" />
          : <img src={doc.url} alt={`${doc.category}: ${doc.name}`} className="h-full w-full object-contain" />}
        {index > 0 && <button onClick={() => onIndex(index - 1)} aria-label="Previous document" className={`${nav} left-2`}><ChevronLeft size={24} /></button>}
        {index < docs.length - 1 && <button onClick={() => onIndex(index + 1)} aria-label="Next document" className={`${nav} right-2`}><ChevronRight size={24} /></button>}
      </div>
      {confirming && (
        <div className="absolute inset-0 grid place-items-center bg-black/60 p-4" onClick={() => setConfirming(false)}>
          <div role="alertdialog" aria-label="Confirm delete" className="w-full max-w-sm rounded-2xl bg-card p-5 text-ink" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold">Delete this document?</p>
            <p className="mt-1 text-sm text-muted">&ldquo;{doc.name}&rdquo; will be removed permanently. This can&rsquo;t be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
              <Button variant="danger" disabled={busy} onClick={remove}>{busy ? 'Deleting…' : 'Delete'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}
