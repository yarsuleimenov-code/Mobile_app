import { CheckCircle2, CircleAlert, Mail, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  findDocumentEmailDelivery, readDocumentEmailDeliveries, resolveDocumentEmailDelivery,
  upsertDocumentEmailDelivery, writeDocumentEmailDeliveries,
} from './documentEmailStore'
import { usePrototypeScenario } from './prototypeScenarioStore'

export function PickupEmailDeliveryStatus({ documentNumber, request }: {
  documentNumber: string
  request?: { recipientEmail: string; requestedAt: string }
}) {
  const { network, emailOutcome } = usePrototypeScenario()
  const [delivery, setDelivery] = useState(() => request
    ? findDocumentEmailDelivery(readDocumentEmailDeliveries(), documentNumber, request.recipientEmail)
    : undefined)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    if (!request || network === 'offline') return
    const current = findDocumentEmailDelivery(readDocumentEmailDeliveries(), documentNumber, request.recipientEmail)
    if (current?.status !== 'queued') return
    const next = resolveDocumentEmailDelivery(
      documentNumber, request.recipientEmail, request.requestedAt, network, emailOutcome, current,
    )
    if (writeDocumentEmailDeliveries(upsertDocumentEmailDelivery(readDocumentEmailDeliveries(), next))) {
      setDelivery(next)
      setSaveError(false)
    } else {
      setSaveError(true)
    }
  }, [documentNumber, request, network, emailOutcome])

  if (!request) return null

  const status = delivery?.status ?? 'queued'
  const retry = () => {
    const next = resolveDocumentEmailDelivery(
      documentNumber, request.recipientEmail, request.requestedAt, network, emailOutcome, delivery,
    )
    if (!writeDocumentEmailDeliveries(upsertDocumentEmailDelivery(readDocumentEmailDeliveries(), next))) {
      setSaveError(true)
      return
    }
    setDelivery(next)
    setSaveError(false)
  }

  return <section className={`pickup-email-status pickup-email-status--${status}`} role="status">
    {status === 'sent' ? <CheckCircle2 size={21} /> : status === 'failed' ? <CircleAlert size={21} /> : <Mail size={21} />}
    <span><strong>{status === 'sent' ? 'Email sent' : status === 'failed' ? 'Email not sent' : 'Email waiting to send'}</strong>
      <small>{request.recipientEmail} · {documentNumber}</small>
      {status === 'queued' ? <small>Will send when a connection is available.</small> : null}
      {saveError ? <small>Could not save the email status. Try again.</small> : null}
    </span>
    {status !== 'sent' ? <button type="button" disabled={network === 'offline'} onClick={retry}><RefreshCw size={15} /> Retry</button> : null}
  </section>
}
