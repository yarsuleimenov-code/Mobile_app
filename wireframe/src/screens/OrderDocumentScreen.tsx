import { FileText } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { ZabermanLogo } from '../brand-logo'
import { normalizeOrderNumber } from '../cargoDomain'
import { formatDocumentTime, orderDocumentVersions } from '../orderDocumentDomain'
import { findOrderEbol, readOrderEbols } from '../orderEbolStore'
import { OrderDocumentActions } from '../OrderDocumentActions'
import { OrderDocumentHistory } from '../OrderDocumentHistory'
import { PodHandoffSection } from '../order-document-components'
import { PickupEmailDeliveryStatus } from '../PickupEmailDeliveryStatus'

export function OrderDocumentScreen() {
  const { orderNumber = '', documentKey = '' } = useParams()
  return <OrderDocumentContent key={`${orderNumber}:${documentKey}`} orderNumber={normalizeOrderNumber(orderNumber)} documentKey={documentKey} />
}

function OrderDocumentContent({ orderNumber, documentKey }: { orderNumber: string; documentKey: string }) {
  const [order] = useState(() => findOrderEbol(readOrderEbols(), orderNumber))
  const document = order ? orderDocumentVersions(order).find((item) => item.key === documentKey) : undefined
  return <div className="cargo-flow">
    <CargoFlowHeader title="Order eBOL" subtitle={document?.title ?? 'Document version'} />
    <main className="order-pod-body">
      {!document || !order ? <div className="ebol-not-found"><FileText size={42} /><h2>Document version unavailable</h2><p>Only signed versions can be opened here.</p><Link to={`/orders/${orderNumber}/ebol/pickup`}>Return to Pickup review</Link></div> : <>
        <article className="pod-paper">
          <header className="pod-paper-header"><ZabermanLogo className="document-brand-logo" /><span>ORDER eBOL</span></header>
          <div className="pod-document-state"><span>LOCKED</span><small>Signed version · read only</small></div>
          <dl className="pod-meta">
            <div><dt>Document number</dt><dd>{document.documentNumber}</dd></div>
            <div><dt>Order number</dt><dd>#{orderNumber}</dd></div>
            <div><dt>Document type</dt><dd>{document.title}</dd></div>
            <div><dt>Signed</dt><dd>{formatDocumentTime(document.snapshot.lockedAt)}</dd></div>
          </dl>
          <PodHandoffSection title={document.title} snapshot={document.snapshot} />
          <footer className="pod-paper-footer">Confirmations acknowledge review of the recorded evidence and exceptions. They do not confirm absence of damage.</footer>
        </article>
        {document.key.startsWith('pickup-') ? <PickupEmailDeliveryStatus documentNumber={document.documentNumber} request={document.snapshot.contact.emailCopyRequest} /> : null}
        <OrderDocumentActions key={document.documentNumber} documentNumber={document.documentNumber} title={document.title} contactName={document.snapshot.contact.signerName} contactEmail={document.snapshot.contact.emailCopyRequest?.recipientEmail} driverName={document.snapshot.driver.signerName} />
        <OrderDocumentHistory order={order} currentKey={document.key} />
        {order.status === 'completed' ? <Link className="ebol-secondary document-pod-link" to={`/orders/${orderNumber}/ebol/pod`}>View completed POD</Link> : null}
      </>}
    </main>
    <CargoBottomNav />
  </div>
}
