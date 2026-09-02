import { useState } from 'react'
import { handoffSnapshot, updateHandoffComments, type HandoffComments, type HandoffTarget, type OrderEbol } from './orderEbolDomain'
import { findOrderEbol, readOrderEbols, upsertOrderEbol, writeOrderEbols } from './orderEbolStore'

export function useHandoffComments(orderEbol: OrderEbol | null, target: HandoffTarget) {
  const [comments, setComments] = useState<HandoffComments>(() => orderEbol ? handoffSnapshot(orderEbol, target)?.comments ?? { contact: '', driver: '' } : { contact: '', driver: '' })
  const [saveError, setSaveError] = useState(false)
  const changeComments = (next: HandoffComments) => {
    setComments(next)
    if (!orderEbol) return
    const documents = readOrderEbols()
    const current = findOrderEbol(documents, orderEbol.orderNumber) ?? orderEbol
    const updated = updateHandoffComments(current, target, next)
    setSaveError(updated === current || !writeOrderEbols(upsertOrderEbol(documents, updated)))
  }
  return { comments, changeComments, saveError }
}

export function HandoffCommentsEditor({ comments, onChange, saveError }: {
  comments: HandoffComments; onChange: (comments: HandoffComments) => void; saveError: boolean
}) {
  return <section className="ebol-section handoff-comments-editor">
    <h2>Comments from both parties</h2>
    <p>Optional. Comments belong to this document version. Document damage or disagreement separately under exceptions.</p>
    <label className="ebol-field">Contact comment<textarea rows={3} maxLength={1000} value={comments.contact} onChange={(event) => onChange({ ...comments, contact: event.target.value })} placeholder="Contact’s observations or instructions" /></label>
    <label className="ebol-field">Driver comment<textarea rows={3} maxLength={1000} value={comments.driver} onChange={(event) => onChange({ ...comments, driver: event.target.value })} placeholder="Driver’s observations or handoff notes" /></label>
    {saveError ? <p className="ebol-storage-warning" role="alert">Comments could not be saved. Keep this page open and check device storage before leaving.</p> : null}
  </section>
}

export function HandoffCommentsView({ comments }: { comments?: Partial<HandoffComments> }) {
  return <dl className="handoff-comments" aria-label="Comments from both parties">
    <div><dt>Contact comment</dt><dd>{comments?.contact?.trim() || 'No comment recorded'}</dd></div>
    <div><dt>Driver comment</dt><dd>{comments?.driver?.trim() || 'No comment recorded'}</dd></div>
  </dl>
}
