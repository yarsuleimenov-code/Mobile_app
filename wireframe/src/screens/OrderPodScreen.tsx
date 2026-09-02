import { CheckCircle2, FileText } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { ZabermanLogo } from '../brand-logo'
import { normalizeOrderNumber } from '../cargoDomain'
import { isOrderPodAvailable, type OrderEbol } from '../orderEbolDomain'
import { findOrderEbol, readOrderEbols } from '../orderEbolStore'
import { PodHandoffSection } from '../order-document-components'
import { OrderDocumentActions } from '../OrderDocumentActions'
import { OrderDocumentHistory } from '../OrderDocumentHistory'

function formatTimestamp(value?: string) {
  if (!value) return 'Not recorded'
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}


export function OrderPodScreen() {
  const { orderNumber } = useParams()
  return <OrderPodContent key={orderNumber} />
}

function OrderPodContent() {
  const navigate = useNavigate()
  const { orderNumber: orderParam = '' } = useParams()
  const orderNumber = normalizeOrderNumber(orderParam)
  const [orderEbol] = useState<OrderEbol | null>(() => findOrderEbol(readOrderEbols(), orderNumber) ?? null)


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
            <div><dt>Document number</dt><dd>{orderNumber}-POD</dd></div>
            <div><dt>Created</dt><dd>{formatTimestamp(orderEbol!.createdAt)}</dd></div>
            <div><dt>Completed</dt><dd>{formatTimestamp(orderEbol!.updatedAt)}</dd></div>
          </dl>

          <PodHandoffSection title="Pickup" snapshot={orderEbol!.pickup} />
          {(orderEbol!.pickupSupplements ?? []).filter((item) => item.status === 'locked')
            .map((item) => <PodHandoffSection key={item.version} title={`Pickup · version ${item.version}`} snapshot={item} />)}
          <PodHandoffSection title="Delivery" snapshot={orderEbol!.delivery} />

          <footer className="pod-paper-footer">Confirmations acknowledge review of the recorded evidence and exceptions. They do not confirm absence of damage.</footer>
        </article>

        <OrderDocumentActions key={orderNumber} documentNumber={`${orderNumber}-POD`} title="Completed POD" contactName={orderEbol!.delivery.contact.signerName} driverName={orderEbol!.delivery.driver.signerName} />
        <OrderDocumentHistory order={orderEbol!} />
      </main>
      <CargoBottomNav />
    </div>
  )
}
