import { Link } from 'react-router-dom'
import { formatDocumentTime, orderDocumentVersions } from './orderDocumentDomain'
import type { OrderEbol } from './orderEbolDomain'

export function OrderDocumentHistory({ order, currentKey }: { order: OrderEbol; currentKey?: string }) {
  const versions = orderDocumentVersions(order)
  if (!versions.length) return null
  return <section className="ebol-section document-version-history" aria-label="Document versions">
    <h2>Document versions</h2>
    {versions.map((item) => <div key={item.key}>
      <strong>{item.title}</strong>
      <small>{item.documentNumber} · {item.snapshot.evidence!.pieceCount} places · Locked {formatDocumentTime(item.snapshot.lockedAt)}</small>
      <Link aria-current={currentKey === item.key ? 'page' : undefined} to={`/orders/${order.orderNumber}/ebol/documents/${item.key}`}>View {item.title}</Link>
    </div>)}
  </section>
}
