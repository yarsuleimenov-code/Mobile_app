import { X } from 'lucide-react'
import { useRef, useState } from 'react'
import type { OrderReferencePhoto } from './orderReferenceData'

export function ReferencePhotoGallery({ photos }: { photos: OrderReferencePhoto[] }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [selected, setSelected] = useState<OrderReferencePhoto | null>(null)

  if (!photos.length) return <p>No reference photos yet.</p>

  return <>
    <div className="reference-photo-grid">
      {photos.map((photo) => (
        <button type="button" key={photo.src} aria-label={`View ${photo.caption} reference photo`} aria-haspopup="dialog" onClick={() => {
          setSelected(photo)
          dialog.current?.showModal()
        }}>
          <img src={photo.src} alt="" loading="lazy" />
          <span>{photo.caption}</span>
        </button>
      ))}
    </div>
    <dialog className="photo-preview reference-photo-preview" ref={dialog} onClose={() => setSelected(null)} aria-label="Reference photo preview">
      <header>
        <strong>{selected?.caption}</strong>
        <button type="button" aria-label="Close photo preview" onClick={() => dialog.current?.close()}><X size={22} /></button>
      </header>
      {selected ? <img src={selected.src} alt={selected.caption} /> : null}
    </dialog>
  </>
}
