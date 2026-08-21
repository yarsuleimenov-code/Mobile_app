import { Camera, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader, EvidenceGallery, SuccessState } from '../cargo-components'
import {
  calculatePieces, calculateVolume, defaultDimensionGroups, normalizeOrderNumber,
  type CargoRecord, type DimensionGroup,
} from '../cargoDomain'
import { useCargo } from '../cargoStore'

export function PickupCaptureScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { savePickup } = useCargo()
  const [saved, setSaved] = useState(false)
  const [orderNumber, setOrderNumber] = useState(params.get('order') ?? '11155599')
  const [pickupDate, setPickupDate] = useState(() => {
    const routeDate = params.get('date')
    if (!routeDate) return '2026-07-26'
    const [month, day, year] = routeDate.split('/')
    return `${year}-${month}-${day}`
  })
  const [responsible, setResponsible] = useState('John Doe')
  const [packaging, setPackaging] = useState('Customer')
  const [orderComment, setOrderComment] = useState('commentSize\norderComment')
  const [weight, setWeight] = useState(123)
  const [photoCount, setPhotoCount] = useState(4)
  const [groups, setGroups] = useState<DimensionGroup[]>(defaultDimensionGroups.map((group) => ({ ...group })))
  const pieces = useMemo(() => calculatePieces(groups), [groups])
  const volume = useMemo(() => calculateVolume(groups), [groups])

  const updateGroup = (id: string, field: keyof Omit<DimensionGroup, 'id'>, value: string) => {
    setGroups((current) => current.map((group) => group.id === id ? { ...group, [field]: Number(value) || 0 } : group))
  }

  const addGroup = () => setGroups((current) => [...current, { id: `group-${Date.now()}`, quantity: 1, length: 0, width: 0, height: 0 }])
  const removeGroup = (id: string) => setGroups((current) => current.filter((group) => group.id !== id))

  const submit = () => {
    const [year, month, day] = pickupDate.split('-')
    const record: CargoRecord = {
      orderNumber: normalizeOrderNumber(orderNumber), title: 'Pickup cargo', pickupDate: `${month}/${day}/${year}`,
      originBranch: 'NJ1', destinationBranch: 'CA1',
      totalWeight: weight, dimensionGroups: groups, packaging, orderComment, responsible,
      photoCount, status: 'pickup_recorded',
    }
    savePickup(record)
    setSaved(true)
  }

  if (saved) return (
    <div className="cargo-flow"><CargoFlowHeader title="Pickup" /><SuccessState title="Pickup recorded" message={`Order #${normalizeOrderNumber(orderNumber)} and ${photoCount} photos are saved.`} action={<button type="button" className="cargo-primary" onClick={() => navigate('/')}>Back to Home</button>} /><CargoBottomNav /></div>
  )

  return (
    <div className="cargo-flow">
      <CargoFlowHeader title="Pickup" subtitle={params.get('order') ? `Spoke order #${params.get('order')}` : undefined} />
      <form className="pickup-form" onSubmit={(event) => { event.preventDefault(); submit() }}>
        <div className="two-column-fields">
          <label>Order #<input inputMode="numeric" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} /></label>
          <label>Pickup date<input type="date" value={pickupDate} onChange={(event) => setPickupDate(event.target.value)} /></label>
        </div>
        <label>Responsible manager<select value={responsible} onChange={(event) => setResponsible(event.target.value)}><option>John Doe</option><option>Maria Lopez</option><option>Daniel Kim</option></select></label>
        <label>Packaging<select value={packaging} onChange={(event) => setPackaging(event.target.value)}><option>Customer</option><option>Zaberman</option><option>Mixed</option></select></label>
        <label>Order comment<textarea rows={2} value={orderComment} onChange={(event) => setOrderComment(event.target.value)} /></label>

        <section className="cargo-totals">
          <label><span>Pieces</span><span><input aria-label="Pieces" value={pieces} readOnly /> pcs</span></label>
          <label><span>Total weight</span><span><input aria-label="Total weight" type="number" value={weight} onChange={(event) => setWeight(Number(event.target.value) || 0)} /> lb</span></label>
        </section>

        <section className="dimension-section">
          <div className="form-section-title"><h2>Dimensions</h2><span>inches</span></div>
          <div className="dimension-head"><span>Qty</span><span>L</span><span>W</span><span>H</span><span /></div>
          {groups.map((group) => (
            <div className="dimension-row" key={group.id}>
              {(['quantity', 'length', 'width', 'height'] as const).map((field) => <input key={field} aria-label={`${field} for ${group.id}`} inputMode="numeric" type="number" min="0" value={group[field]} onChange={(event) => updateGroup(group.id, field, event.target.value)} />)}
              <button type="button" onClick={() => removeGroup(group.id)} aria-label="Remove dimension group"><Trash2 size={18} /></button>
            </div>
          ))}
          <button type="button" className="add-dimension" onClick={addGroup}><Plus size={18} /> Add dimension group</button>
          <div className="volume-total"><span>Total volume</span><strong>{volume.toFixed(2)} cu ft</strong></div>
        </section>

        <section className="photo-section">
          <div className="form-section-title"><h2>Cargo photos</h2><span>{photoCount} photos</span></div>
          <p>Photograph the complete shipment and packing condition.</p>
          <EvidenceGallery count={photoCount} editable onAdd={() => setPhotoCount((count) => count + 1)} onRemove={() => setPhotoCount((count) => Math.max(0, count - 1))} />
          <button type="button" className="camera-action" onClick={() => setPhotoCount((count) => count + 1)}><Camera size={20} /> Take another photo</button>
        </section>

        <div className="flow-action"><button className="cargo-primary" type="submit" disabled={!normalizeOrderNumber(orderNumber) || !photoCount}>Save Pickup</button></div>
      </form>
      <CargoBottomNav />
    </div>
  )
}
