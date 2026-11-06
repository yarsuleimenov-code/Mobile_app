import { Camera, ImagePlus } from 'lucide-react'
import { useState } from 'react'
import { addPackingPhoto, canAddPackingPhotos, packingPhotoLimit, readPackingPhotos } from './packingPhotoStore'
import { PhotoGallery } from './PhotoEvidence'
import { usePrototypeScenario } from './prototypeScenarioStore'

export function PackingPhotos({ order }: { order: string }) {
  const { devices } = usePrototypeScenario()
  const [photos, setPhotos] = useState(() => readPackingPhotos(order))
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  if (!canAddPackingPhotos(order)) return null

  const atLimit = photos.length >= packingPhotoLimit
  const add = async (source: 'camera' | 'gallery') => {
    setSaving(true)
    setMessage('')
    setError(false)
    try {
      setPhotos(await addPackingPhoto(order, source))
      setMessage('Packing photo saved on this device.')
    } catch (failure) {
      setMessage(failure instanceof Error && !(failure instanceof DOMException) ? failure.message : 'Packing photo could not be saved. Try again.')
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return <section className="order-detail-card order-reference-card packing-photos" aria-label="Packing photos">
    <div className="reference-photo-heading">
      <h2>Packing photos</h2>
      <button type="button" className="ebol-secondary" disabled={saving} aria-expanded={editing}
        onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Add packing photos'}</button>
    </div>
    <p>Photograph the packed cargo for loading.</p>
    {editing ? <div className="photo-add-controls">
      <div className="photo-add-row">
        <button type="button" disabled={!devices.camera || saving || atLimit} onClick={() => void add('camera')}><Camera size={18} aria-hidden="true" />{devices.camera ? 'Take photo' : 'Camera unavailable'}</button>
        <button type="button" disabled={saving || atLimit} onClick={() => void add('gallery')}><ImagePlus size={18} aria-hidden="true" />Choose from gallery</button>
      </div>
      {atLimit ? <small>Maximum 100 packing photos per order.</small> : null}
    </div> : null}
    {message ? <p role={error ? 'alert' : 'status'}>{message}</p> : null}
    <PhotoGallery photos={photos} packing />
  </section>
}
