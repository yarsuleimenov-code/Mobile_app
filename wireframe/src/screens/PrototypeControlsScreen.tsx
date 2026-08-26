import { AlertTriangle, Camera, CheckCircle2, Gauge, Printer, RefreshCw, RotateCcw, ScanLine, Settings2, ShieldX, Wifi, WifiOff } from 'lucide-react'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { roleLabels } from '../data'
import type { Role } from '../domain'
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
  const {
    role, branch, network, syncOutcome, devices,
    setRole, setBranch, setNetwork, setSyncOutcome, setDeviceAvailable, resetMockData,
  } = usePrototypeScenario()

  const confirmReset = () => {
    if (window.confirm('Reset all Zaberman mock data and prototype scenarios?')) resetMockData()
  }

  return (
    <div className="cargo-flow">
      <CargoFlowHeader title="Prototype controls" subtitle="Managed test scenarios" />
      <main className="prototype-controls">
        <div className="dev-only-banner"><Settings2 size={20} /><span><strong>DEV ONLY</strong><small>These settings simulate environment behavior and are not production configuration.</small></span></div>

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
          <h2>Mock data</h2>
          <p>Removes cargo records, eBOLs, route state, interstate drafts and all scenario settings.</p>
          <button type="button" onClick={confirmReset}><RotateCcw size={19} /> Reset all mock data</button>
        </section>
      </main>
      <CargoBottomNav />
    </div>
  )
}
