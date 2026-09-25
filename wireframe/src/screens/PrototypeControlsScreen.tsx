import { AlertTriangle, Camera, CheckCircle2, Gauge, MessageCircleMore, Printer, RefreshCw, RotateCcw, ScanLine, Settings2, ShieldX, Wifi, WifiOff } from 'lucide-react'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { useState } from 'react'
import { EvidenceQueuePanel } from '../PhotoEvidence'
import { installRehearsalPreset, rehearsalPresets, type RehearsalPresetId } from '../demoRehearsal'
import { roleLabels } from '../data'
import type { Role } from '../domain'
import { useCommunications } from '../communicationStore'
import {
  usePrototypeScenario,
  type DeviceKind,
  type PrototypeBranch,
  type SyncOutcome,
} from '../prototypeScenarioStore'

const roles = Object.keys(roleLabels) as Role[]
const branches: PrototypeBranch[] = ['NJ1', 'CA1', 'CA2']
const networks = [
  { value: 'online', label: 'Online', icon: Wifi },
  { value: 'offline', label: 'Offline', icon: WifiOff },
  { value: 'slow', label: 'Slow', icon: Gauge },
] as const
const outcomes: Array<{ value: SyncOutcome; label: string; icon: typeof CheckCircle2 }> = [
  { value: 'success', label: 'Success', icon: CheckCircle2 },
  { value: 'retry', label: 'Retry', icon: RefreshCw },
  { value: 'conflict', label: 'Conflict', icon: AlertTriangle },
  { value: 'rejected', label: 'Rejected', icon: ShieldX },
]
const deviceOptions: Array<{ value: DeviceKind; label: string; icon: typeof Camera }> = [
  { value: 'camera', label: 'Camera', icon: Camera },
  { value: 'scanner', label: 'Scanner', icon: ScanLine },
  { value: 'printer', label: 'Printer', icon: Printer },
]

export function PrototypeControlsScreen() {
  const [presetError, setPresetError] = useState('')
  const { threads, receiveMockReply } = useCommunications()
  const [replyOrder, setReplyOrder] = useState(threads[0]?.orderNumber ?? '')
  const {
    role, branch, network, syncOutcome, printOutcome, emailOutcome, smsOutcome, devices,
    setRole, setBranch, setNetwork, setSyncOutcome, setPrintOutcome, setEmailOutcome, setSmsOutcome, setDeviceAvailable, resetMockData,
  } = usePrototypeScenario()

  const confirmReset = () => {
    if (window.confirm('Reset all Zaberman demo data? This deletes saved drafts, signatures, documents, photos, print history and scenario settings on this device. The initial sample orders will be restored.')) resetMockData()
  }
  const openPreset = (kind: RehearsalPresetId) => {
    try {
      const path = installRehearsalPreset(kind)
      window.location.hash = path
      window.location.reload()
    } catch (error) { setPresetError(error instanceof Error ? error.message : 'Could not prepare this scenario.') }
  }

  return (
    <div className="cargo-flow">
      <CargoFlowHeader title="Prototype controls" subtitle="Managed test scenarios" />
      <main className="prototype-controls">
        <div className="dev-only-banner"><Settings2 size={20} /><span><strong>DEV ONLY</strong><small>These settings simulate environment behavior and are not production configuration.</small></span></div>

        <section className="scenario-section">
          <h2>Owner-demo rehearsal</h2>
          <p>Reset for a fresh run, then choose a scenario. Reopening preserves existing work. Presets set role, branch, connection and device availability; they do not sign new handoffs.</p>
          <button type="button" className="ebol-secondary" onClick={confirmReset}><RotateCcw size={16} /> Reset all mock data</button>
          <div className="rehearsal-presets">
            {rehearsalPresets.slice(0, 7).map((preset) => <button type="button" key={preset.id} aria-label={preset.title} onClick={() => openPreset(preset.id)}><strong>{preset.title}</strong><small>{preset.detail}</small><code>#{preset.order}</code></button>)}
          </div>
          <details className="rehearsal-extra"><summary>Optional photo volume checks</summary><div className="scenario-options scenario-options--two">{rehearsalPresets.slice(7).map((preset) => <button type="button" key={preset.id} onClick={() => openPreset(preset.id)}>{preset.title}</button>)}</div></details>
          {presetError ? <p role="alert">{presetError}</p> : null}
        </section>

        <section className="scenario-section">
          <h2>Operator context</h2>
          <div className="scenario-selects">
            <label>Role<select value={role} onChange={(event) => setRole(event.target.value as Role)}>{roles.map((item) => <option value={item} key={item}>{roleLabels[item]}</option>)}</select></label>
            <label>Branch<select value={branch} onChange={(event) => setBranch(event.target.value as PrototypeBranch)}>{branches.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
          </div>
        </section>

        <section className="scenario-section">
          <h2>Connection</h2>
          <div className="scenario-options scenario-options--three">
            {networks.map(({ value, label, icon: Icon }) => <button type="button" key={value} className={network === value ? 'is-active' : ''} aria-pressed={network === value} onClick={() => setNetwork(value)}><Icon size={19} /><span>{label}</span></button>)}
          </div>
        </section>

        <section className="scenario-section">
          <h2>Next sync result</h2>
          <div className="scenario-options scenario-options--two">
            {outcomes.map(({ value, label, icon: Icon }) => <button type="button" key={value} className={syncOutcome === value ? 'is-active' : ''} aria-pressed={syncOutcome === value} onClick={() => setSyncOutcome(value)}><Icon size={19} /><span>{label}</span></button>)}
          </div>
          <p>Run sync from the top bar or More to apply this outcome.</p>
        </section>

        <section className="scenario-section">
          <h2>Next print result</h2>
          <div className="scenario-options scenario-options--two">
            <button type="button" className={printOutcome === 'success' ? 'is-active' : ''} aria-pressed={printOutcome === 'success'} onClick={() => setPrintOutcome('success')}>Print success</button>
            <button type="button" className={printOutcome === 'error' ? 'is-active' : ''} aria-pressed={printOutcome === 'error'} onClick={() => setPrintOutcome('error')}>Print error</button>
          </div>
          <p>Applies to Print in labels and Order eBOL/POD previews. No physical print job is sent.</p>
        </section>

        <section className="scenario-section">
          <h2>Next document email result</h2>
          <div className="scenario-options scenario-options--two">
            <button type="button" className={emailOutcome === 'success' ? 'is-active' : ''} aria-pressed={emailOutcome === 'success'} onClick={() => setEmailOutcome('success')}>Email success</button>
            <button type="button" className={emailOutcome === 'error' ? 'is-active' : ''} aria-pressed={emailOutcome === 'error'} onClick={() => setEmailOutcome('error')}>Email error</button>
          </div>
          <p>Applies to the automatic Pickup document copy and Retry. Offline requests remain queued.</p>
        </section>

        <section className="scenario-section">
          <h2>Customer messages</h2>
          <div className="scenario-options scenario-options--two">
            <button type="button" className={smsOutcome === 'success' ? 'is-active' : ''} aria-pressed={smsOutcome === 'success'} onClick={() => setSmsOutcome('success')}>SMS success</button>
            <button type="button" className={smsOutcome === 'error' ? 'is-active' : ''} aria-pressed={smsOutcome === 'error'} onClick={() => setSmsOutcome('error')}>SMS error</button>
          </div>
          <div className="mock-reply-control">
            <label>Incoming reply for<select value={replyOrder} onChange={(event) => setReplyOrder(event.target.value)}>{threads.map((thread) => <option value={thread.orderNumber} key={thread.id}>#{thread.orderNumber} · {thread.customerName}</option>)}</select></label>
            <button type="button" onClick={() => receiveMockReply(replyOrder)} disabled={!replyOrder}><MessageCircleMore size={17} /> Receive reply</button>
          </div>
          <p>Outbound messages use 17178361039. Incoming replies appear unread in Messages and the related task.</p>
        </section>

        <section className="scenario-section">
          <h2>Device availability</h2>
          <div className="scenario-devices">
            {deviceOptions.map(({ value, label, icon: Icon }) => (
              <button type="button" key={value} className={devices[value] ? 'is-available' : 'is-unavailable'} aria-pressed={devices[value]} onClick={() => setDeviceAvailable(value, !devices[value])}>
                <span><Icon size={20} /><strong>{label}</strong></span><small>{devices[value] ? 'Available' : 'Unavailable'}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="scenario-reset">
          <EvidenceQueuePanel />
          <p>Use Reset all mock data above only when you want to discard this rehearsal and restore the starting dataset.</p>
        </section>
      </main>
      <CargoBottomNav />
    </div>
  )
}
