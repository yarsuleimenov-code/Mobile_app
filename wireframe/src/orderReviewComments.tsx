import { useState } from 'react'
import { handoffSnapshot, updateHandoffComments, type HandoffComments, type HandoffTarget, type OrderEbol } from './orderEbolDomain'
import { findOrderEbol, readOrderEbols, upsertOrderEbol, writeOrderEbols } from './orderEbolStore'

export function useHandoffComments(orderEbol: OrderEbol | null, target: HandoffTarget) {
  const [comments, setComments] = useState<HandoffComments>(() => orderEbol ? handoffSnapshot(orderEbol, target)?.comments ?? { contact: '', driver: '' } : { contact: '', driver: '' })
  const [saveError, setSaveError] = useState(false)
  const changeComments = (next: HandoffComments) => {
    setComments(next)
    if (!orderEbol) { setSaveError(true); return false }
    const documents = readOrderEbols()
    const current = findOrderEbol(documents, orderEbol.orderNumber) ?? orderEbol
    const updated = updateHandoffComments(current, target, next)
    const saved = updated !== current && writeOrderEbols(upsertOrderEbol(documents, updated))
    setSaveError(!saved)
    return saved
  }
  return { comments, changeComments, saveError }
}

export function HandoffCommentEditor({ party, value, onChange, disabled = false, reported = false }: {
  party: keyof HandoffComments; value: string; onChange: (value: string) => void; disabled?: boolean; reported?: boolean
}) {
  return <div className="handoff-comment-editor">
    <label className="ebol-field">{reported ? 'Contact comment (reported)' : 'Your comment'}<textarea rows={3} maxLength={1000} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} placeholder={party === 'contact' ? 'Contact’s observations or instructions' : 'Driver’s observations or handoff notes'} /></label>
    <p>{reported ? 'Optional. Record the contact’s words before verifying the code.' : 'Optional. This comment belongs to your confirmation.'} Document damage or disagreement separately under exceptions.</p>
  </div>
}

export function ContactCommentView({ value }: { value: string }) {
  return <dl className="handoff-comments"><div><dt>Contact comment</dt><dd>{value.trim() || 'No comment recorded'}</dd></div></dl>
}

export function HandoffCommentSaveError({ visible }: { visible: boolean }) {
  return visible ? <p className="ebol-storage-warning" role="alert">Comments could not be saved. Keep this page open, check device storage and retry before confirming.</p> : null
}

export function HandoffCommentsView({ comments }: { comments?: Partial<HandoffComments> }) {
  return <dl className="handoff-comments" aria-label="Comments from both parties">
    <div><dt>Contact comment</dt><dd>{comments?.contact?.trim() || 'No comment recorded'}</dd></div>
    <div><dt>Driver comment</dt><dd>{comments?.driver?.trim() || 'No comment recorded'}</dd></div>
  </dl>
}
