import { CheckCircle2, Download, Mail, Printer, Share2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePrototypeScenario } from './prototypeScenarioStore'
import { isValidContactEmail } from './orderEbolDomain'

type DocumentAction = 'download' | 'print' | 'email' | 'share'
const actionTitles: Record<DocumentAction, string> = { download: 'Download PDF', print: 'Print', email: 'Email document', share: 'Share document' }

export function OrderDocumentActions({ documentNumber, title, contactName, contactEmail, driverName }: {
  documentNumber: string; title: string; contactName?: string; contactEmail?: string; driverName?: string
}) {
  const [action, setAction] = useState<DocumentAction | null>(null)
  const [notice, setNotice] = useState('')
  return <>
    <div className="pod-actions document-actions" aria-label="Document actions">
      <button type="button" onClick={() => { setNotice(''); setAction('download') }}><Download size={19} />Download PDF</button>
      <button type="button" onClick={() => { setNotice(''); setAction('print') }}><Printer size={19} />Print</button>
      <button type="button" onClick={() => { setNotice(''); setAction('email') }}><Mail size={19} />Email</button>
      <button type="button" onClick={() => { setNotice(''); setAction('share') }}><Share2 size={19} />Share</button>
    </div>
    {notice ? <p className="pod-action-notice" role="status">{notice}</p> : null}
    {action ? <DocumentActionDialog key={action} action={action} documentNumber={documentNumber} title={title} contactName={contactName} contactEmail={contactEmail} driverName={driverName} onClose={() => setAction(null)} onComplete={setNotice} /> : null}
  </>
}

function DocumentActionDialog({ action, documentNumber, title, contactName, contactEmail, driverName, onClose, onComplete }: {
  action: DocumentAction; documentNumber: string; title: string; contactName?: string; contactEmail?: string; driverName?: string; onClose: () => void; onComplete: (message: string) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const { devices, printOutcome } = usePrototypeScenario()
  const [recipient, setRecipient] = useState('contact')
  const [emailAddress, setEmailAddress] = useState(contactEmail ?? '')
  const [channel, setChannel] = useState('email')
  const [copies, setCopies] = useState('1')
  const [result, setResult] = useState('')
  const [failed, setFailed] = useState(false)
  useEffect(() => { dialog.current?.showModal() }, [])
  const name = recipient === 'contact' ? contactName || 'Order contact' : driverName || 'Zaberman driver'
  // This workflow records a local result; it never invokes email, sharing or printer APIs.
  const destination = channel === 'email'
    ? emailAddress.trim()
    : recipient === 'contact' ? '+1 (201) 555-0101' : '+1 (201) 555-0102'
  const unavailable = action === 'print' && !devices.printer
  const validCopies = Number.isInteger(Number(copies)) && Number(copies) >= 1 && Number(copies) <= 20
  const validEmail = channel !== 'email' || isValidContactEmail(emailAddress)
  const complete = () => {
    if (unavailable || (action === 'print' && !validCopies) || ((action === 'email' || action === 'share') && !validEmail)) return
    if (action === 'print' && printOutcome === 'error') {
      setFailed(true)
      setResult('Print failed. Check the printer connection and try again.')
      return
    }
    const message = action === 'download' ? `Download complete · ${documentNumber}.pdf`
      : action === 'print' ? `Print successful · ${copies} ${Number(copies) === 1 ? 'copy' : 'copies'} · ${documentNumber}`
      : `${action === 'email' ? 'Email sent' : 'Document shared'} · ${name} · ${destination} · ${documentNumber}`
    setFailed(false)
    setResult(message)
    onComplete(message)
  }
  const completed = Boolean(result) && !failed
  return createPortal(<dialog className="document-action-dialog" ref={dialog} onClose={onClose} aria-label={actionTitles[action]}>
    <header><h2>{actionTitles[action]}</h2><button type="button" aria-label="Close document action" onClick={() => dialog.current?.close()}><X size={22} /></button></header>
    <p className="document-action-title">{title}</p><code>{documentNumber}.pdf</code>
    {completed ? <div className="document-action-success" role="status"><CheckCircle2 size={26} /><p>{result}</p></div> : <>
      {action === 'download' ? <p>The selected document includes its cargo details, comments and confirmations.</p> : null}
      {action === 'print' ? <>
        <p>{devices.printer ? 'Printer connected' : 'Printer unavailable. You can continue and print later.'}</p>
        <label className="ebol-field">Copies<input type="number" min={1} max={20} value={copies} onChange={(event) => setCopies(event.target.value)} /></label>
      </> : null}
      {action === 'email' || action === 'share' ? <>
        {action === 'share' ? <label className="ebol-field">Channel<select value={channel} onChange={(event) => setChannel(event.target.value)}><option value="email">Email</option><option value="message">Text message</option></select></label> : null}
        <label className="ebol-field">Recipient<select value={recipient} onChange={(event) => { setRecipient(event.target.value); setEmailAddress(event.target.value === 'contact' ? contactEmail ?? '' : '') }}><option value="contact">{contactName || 'Order contact'} · Contact</option><option value="driver">{driverName || 'Zaberman driver'} · Driver</option></select></label>
        {channel === 'email' ? <label className="ebol-field">Email address<input type="email" autoComplete="email" spellCheck={false} maxLength={254} value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} placeholder="name@example.com" aria-invalid={Boolean(emailAddress) && !validEmail} /></label> : <p className="document-recipient">{destination}</p>}
        {channel === 'email' && emailAddress && !validEmail ? <p className="pickup-email-error" role="alert">Enter an email address in the correct format, like name@example.com.</p> : null}
        <label className="ebol-field">Message<textarea rows={3} maxLength={500} defaultValue={`Please find the ${title} for your records.`} /></label>
      </> : null}
      {failed ? <p className="ebol-storage-warning" role="alert">{result}</p> : null}
    </>}
    <button type="button" className="cargo-primary" disabled={!completed && (unavailable || (action === 'print' && !validCopies) || ((action === 'email' || action === 'share') && !validEmail))} onClick={completed ? () => dialog.current?.close() : complete}>
      {completed ? 'Done' : action === 'download' ? 'Download' : action === 'print' ? failed ? 'Retry print' : 'Print document' : action === 'email' ? 'Send email' : 'Share document'}
    </button>
  </dialog>, document.body)
}
