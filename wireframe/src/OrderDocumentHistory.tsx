import { Link } from 'react-router-dom'
import { formatDocumentTime, orderDocumentVersions } from './orderDocumentDomain'
import type { OrderEbol } from './orderEbolDomain'
import { HandoffVerificationSummary } from './HandoffVerification'

export function OrderDocumentHistory({ order, currentKey }: { order: OrderEbol; currentKey?: string }) {
  const versions = orderDocumentVersions(order)
  if (!versions.length) return null
  return <section className="ebol-section document-version-history" aria-label="Document versions">
    <h2>Document versions</h2>
    {versions.map((item) => <div key={item.key}>
      <strong>{item.title}</strong>
      <small>{item.documentNumber} · {item.snapshot.evidence!.pieceCount} places · Locked {formatDocumentTime(item.snapshot.lockedAt)}</small>
      <Link aria-current={currentKey === item.key ? 'page' : undefined} to={`/orders/${order.orderNumber}/ebol/documents/${item.key}`}>View {item.title}</Link>
      {item.snapshot.verification ? <details className="handoff-history"><summary>QR & location history</summary><p>{item.snapshot.verification.driver} · {formatDocumentTime(item.snapshot.verification.checkedAt)}</p><HandoffVerificationSummary check={item.snapshot.verification} /><small>Stop: {item.snapshot.verification.stopId ?? 'Not available'}</small>{item.snapshot.verification.fix ? <small>Driver coordinates: {item.snapshot.verification.fix.latitude}, {item.snapshot.verification.fix.longitude} · Captured {new Date(item.snapshot.verification.fix.capturedAt).toLocaleString()}</small> : null}{item.snapshot.verification.target ? <small>Stop coordinates: {item.snapshot.verification.target.latitude}, {item.snapshot.verification.target.longitude}</small> : null}</details> : null}
    </div>)}
  </section>
}
