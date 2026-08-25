import JsBarcode from 'jsbarcode'
import { Barcode, FileText, Printer } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { ZabermanLogo } from '../brand-logo'
import { normalizeOrderNumber } from '../cargoDomain'
import { useCargo } from '../cargoStore'
import { createPlaceLabels } from '../placeLabelsDomain'

function PlaceBarcode({ value }: { value: string }) {
  const barcodeRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!barcodeRef.current) return
    JsBarcode(barcodeRef.current, value, {
      format: 'CODE128',
      width: 1.45,
      height: 54,
      margin: 0,
      marginLeft: 15,
      marginRight: 15,
      displayValue: false,
    })
  }, [value])

  return <svg ref={barcodeRef} role="img" aria-label={`Code 128 barcode for ${value}`} />
}

export function PlaceLabelsScreen() {
  const navigate = useNavigate()
  const { orderNumber: orderParam = '' } = useParams()
  const orderNumber = normalizeOrderNumber(orderParam)
  const { findRecord } = useCargo()
  const record = findRecord(orderNumber)
  const labels = useMemo(() => record ? createPlaceLabels(record) : [], [record])
  const printLabels = () => window.print()

  if (!record) {
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Place labels" subtitle={`Order #${orderNumber || 'unknown'}`} />
        <div className="place-labels-empty"><Barcode size={44} /><h2>Pickup record not found</h2><p>Save the Pickup before generating its place labels.</p><button type="button" className="cargo-primary" onClick={() => navigate('/pickup')}>Open Pickup</button></div>
        <CargoBottomNav />
      </div>
    )
  }

  return (
    <div className="cargo-flow place-labels-flow">
      <CargoFlowHeader title="Place labels" subtitle={`Order #${orderNumber} · ${labels.length} labels`} />
      <main className="place-labels-body">
        <section className="place-labels-summary">
          <Barcode size={26} />
          <span><strong>{labels.length} labels ready</strong><small>Print at the truck after Pickup. Reprinting keeps the same Place IDs.</small></span>
        </section>

        <div className="place-label-actions">
          <button type="button" className="cargo-primary" onClick={printLabels}><Printer size={20} /> Print / reprint labels</button>
        </div>

        <section className="place-label-sheet" aria-label={`Labels for order ${orderNumber}`}>
          {labels.map((label) => (
            <article className="place-label" key={label.placeId}>
              <header><ZabermanLogo className="place-label-brand-logo" /><span>Place {String(label.placeNumber).padStart(2, '0')} of {label.totalPlaces}</span></header>
              <div className="place-label-order"><span>Order</span><strong>#{label.orderNumber}</strong></div>
              {label.orderTitle ? <p className="place-label-title" title={label.orderTitle}>{label.orderTitle}</p> : null}
              <dl><div className="place-label-route"><dt>Destination</dt><dd>TO {label.destinationBranch}</dd><small>FROM {label.originBranch}</small></div><div><dt>Dimensions</dt><dd>{label.dimensions}</dd></div></dl>
              <PlaceBarcode value={label.placeId} />
              <div className="place-label-id"><span>Place ID</span><code>{label.placeId}</code></div>
            </article>
          ))}
        </section>

        <div className="place-label-prototype-note"><FileText size={18} /><p>Prototype scope: browser printing and Code 128 labels. Printer pairing and phone camera access are intentionally deferred.</p></div>
      </main>
      <CargoBottomNav />
    </div>
  )
}
