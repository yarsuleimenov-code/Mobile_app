import { AlertTriangle, CheckCircle2, Download, FileText, Printer, Share2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader, EvidenceGallery } from '../cargo-components'
import { ZabermanLogo } from '../brand-logo'
import { normalizeOrderNumber } from '../cargoDomain'
import { isOrderPodAvailable, type OrderEbol, type OrderEbolHandoffSnapshot } from '../orderEbolDomain'
import { findOrderEbol, readOrderEbols } from '../orderEbolStore'

function formatTimestamp(value?: string) {
  if (!value) return 'Not recorded'
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function PodHandoffSection({ title, snapshot }: { title: string; snapshot: OrderEbolHandoffSnapshot }) {
  const evidence = snapshot.evidence
  if (!evidence) return null
  const contactless = snapshot.contact.status === 'contactless'
  const contactValue = contactless ? snapshot.contact.contactlessReason : snapshot.contact.signerName

  return (
    <section className="pod-handoff">
      <div className="pod-handoff-heading"><span>{title}</span><small>Locked {formatTimestamp(snapshot.lockedAt)}</small></div>
      <dl className="pod-metrics">
        <div><dt>Pieces</dt><dd>{evidence.pieceCount}</dd></div>
        <div><dt>Weight</dt><dd>{evidence.totalWeight} lb</dd></div>
        <div><dt>Volume</dt><dd>{evidence.totalVolume.toFixed(2)} cu ft</dd></div>
        <div><dt>Photos</dt><dd>{evidence.photoCount}</dd></div>
      </dl>
      <EvidenceGallery count={evidence.photoCount} photos={evidence.photos} />
      {evidence.hasDamage ? <div className="pod-exception"><AlertTriangle size={18} /><span><strong>Exception documented</strong><small>{evidence.exceptionNote}</small></span></div> : <div className="pod-no-exception"><CheckCircle2 size={18} /> No exception documented</div>}
      <div className="pod-confirmation"><UserRound size={19} /><span><strong>{title} contact{contactless ? ' · signature skipped' : ''}</strong><small>{contactValue} · {formatTimestamp(snapshot.contact.confirmedAt)}</small></span><CheckCircle2 size={19} /></div>
      <div className="pod-confirmation"><UserRound size={19} /><span><strong>Zaberman driver</strong><small>{snapshot.driver.signerName} · {formatTimestamp(snapshot.driver.confirmedAt)}</small></span><CheckCircle2 size={19} /></div>
    </section>
  )
}

export function OrderPodScreen() {
  const navigate = useNavigate()
  const { orderNumber: orderParam = '' } = useParams()
  const orderNumber = normalizeOrderNumber(orderParam)
  const [orderEbol] = useState<OrderEbol | null>(() => findOrderEbol(readOrderEbols(), orderNumber) ?? null)
  const [actionNotice, setActionNotice] = useState('')

  if (!isOrderPodAvailable(orderEbol)) {
    const hasDelivery = Boolean(orderEbol?.delivery.evidence)
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Order eBOL" subtitle={`POD · Order #${orderNumber || 'unknown'}`} />
        <main className="ebol-not-found"><FileText size={42} /><h2>POD is not available yet</h2><p>Complete and lock both Pickup and Delivery snapshots before opening the final document.</p><button type="button" className="cargo-primary" onClick={() => navigate(hasDelivery ? `/orders/${orderNumber}/ebol/delivery` : '/')}>{hasDelivery ? 'Open Delivery review' : 'Back to Home'}</button></main>
        <CargoBottomNav />
      </div>
    )
  }

  return (
    <div className="cargo-flow">
      <CargoFlowHeader title="Order eBOL" subtitle={`POD · Order #${orderNumber}`} onBack={() => navigate(`/orders/${orderNumber}/ebol/delivery`)} />
      <main className="order-pod-body">
        <div className="pod-completed-state"><CheckCircle2 size={24} /><span><strong>POD available</strong><small>Both handoff snapshots are complete and locked.</small></span></div>

        <article className="pod-paper">
          <header className="pod-paper-header"><ZabermanLogo className="document-brand-logo" /><span>ORDER eBOL<br />PROOF OF DELIVERY</span></header>
          <div className="pod-document-state"><span>COMPLETED</span><small>Final document</small></div>
          <dl className="pod-meta">
            <div><dt>Order number</dt><dd>#{orderEbol!.orderNumber}</dd></div>
            <div><dt>View</dt><dd>Completed POD</dd></div>
            <div><dt>Created</dt><dd>{formatTimestamp(orderEbol!.createdAt)}</dd></div>
            <div><dt>Completed</dt><dd>{formatTimestamp(orderEbol!.updatedAt)}</dd></div>
          </dl>

          <PodHandoffSection title="Pickup" snapshot={orderEbol!.pickup} />
          {(orderEbol!.pickupSupplements ?? []).filter((item) => item.status === 'locked')
            .map((item) => <PodHandoffSection key={item.version} title={`Pickup · version ${item.version}`} snapshot={item} />)}
          <PodHandoffSection title="Delivery" snapshot={orderEbol!.delivery} />

          <footer className="pod-paper-footer">Confirmations acknowledge review of the recorded evidence and exceptions. They do not confirm absence of damage.</footer>
        </article>

        <div className="pod-actions" aria-label="POD actions">
          <button type="button" onClick={() => setActionNotice('Order eBOL PDF ready to download.')}><Download size={19} />Download PDF</button>
          <button type="button" onClick={() => setActionNotice('Order eBOL ready to print.')}><Printer size={19} />Print</button>
          <button type="button" onClick={() => setActionNotice('Order eBOL ready to share.')}><Share2 size={19} />Share</button>
        </div>
        {actionNotice ? <p className="pod-action-notice" aria-live="polite">{actionNotice}</p> : null}
      </main>
      <CargoBottomNav />
    </div>
  )
}
