import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Check, ChevronRight, CloudOff, FileText, PackageCheck, RefreshCw, RotateCcw, ShieldAlert, Truck, Wifi } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FlowHeader, MovementLabel, SyncNotice } from '../components'
import { roleLabels } from '../data'
import type { NetworkMode, Role } from '../domain'
import { useDemo } from '../store'

export function SyncScreen() {
  const { syncItems, retrySync, network } = useDemo()
  return <div className="flow-screen"><FlowHeader title="Sync center" subtitle={`${network} · ${syncItems.length} items`} /><div className="flow-body"><SyncNotice /><div className="sync-list">{syncItems.map((item) => <div className="sync-item" key={item.id}><span className={`sync-item-icon is-${item.status}`}>{item.status === 'pending' ? <RefreshCw size={20} /> : item.status === 'conflict' ? <ShieldAlert size={20} /> : <CloudOff size={20} />}</span><div><strong>{item.title}</strong><span>{item.meta}</span><small>{item.status === 'pending' ? 'Waiting for connection' : item.status === 'retry' ? 'Temporary upload error' : 'Needs supervisor review'}</small></div><button onClick={() => retrySync(item.id)}>Retry</button></div>)}</div>{!syncItems.length ? <div className="review-hero"><span><Check size={26} /></span><h2>Everything is synced</h2><p>No pending local operations.</p></div> : null}</div></div>
}

export function DemoControlsScreen() {
  const { role, branch, network, setRole, setBranch, setNetwork, resetDemo } = useDemo()
  const roles = Object.keys(roleLabels) as Role[]
  const modes: NetworkMode[] = ['online', 'offline', 'slow', 'error']
  return <div className="flow-screen"><FlowHeader title="Demo controls" subtitle="Prototype state simulation" /><div className="flow-body demo-controls"><label>Role<select value={role} onChange={(event) => setRole(event.target.value as Role)}>{roles.map((item) => <option value={item} key={item}>{roleLabels[item]}</option>)}</select></label><label>Branch<select value={branch} onChange={(event) => setBranch(event.target.value as typeof branch)}>{['NJ1', 'CA1', 'CA2'].map((item) => <option value={item} key={item}>{item}</option>)}</select></label><fieldset><legend>Connection</legend>{modes.map((item) => <button key={item} className={network === item ? 'is-active' : ''} onClick={() => setNetwork(item)}>{item === 'online' ? <Wifi size={18} /> : <CloudOff size={18} />}{item}</button>)}</fieldset><div className="prototype-note"><AlertTriangle size={18} /><span>Role and network controls alter visible permissions and sync messages throughout the prototype.</span></div><button className="button button--secondary" onClick={resetDemo}><RotateCcw size={18} /> Reset all mock state</button></div></div>
}

export function HistoryScreen() {
  const events = [
    ['9:42 AM', 'Place ZB-8F2A-01 created', 'Pickup #12345678 · Crew 12'],
    ['9:45 AM', 'Dimensions and weight measured', '24×16×12 in · 18 lb'],
    ['9:49 AM', 'Label verified', 'Device NJ1-MOB-04'],
    ['9:58 AM', 'Pickup completed', 'Original event · synced 10:01 AM'],
  ]
  return <div className="flow-screen"><FlowHeader title="Place history" subtitle="ZB-8F2A-01 · #12345678" /><div className="flow-body history-list">{events.map(([time, title, meta], index) => <div className="history-event" key={time}><span className={index === events.length - 1 ? 'is-current' : ''}>{index === events.length - 1 ? <Check size={15} /> : <PackageCheck size={15} />}</span><time>{time}</time><div><strong>{title}</strong><small>{meta}</small></div></div>)}</div></div>
}

export function InterstateListScreen() {
  return <div className="flow-screen interstate-screen"><FlowHeader title="Interstate" subtitle="Secondary operations · NJ1" /><div className="flow-body"><div className="secondary-context"><Truck size={23} /><div><strong>Interstate only</strong><span>Trips between NJ1 and CA1/CA2 use manifests, Loading, Unloading and BOL.</span></div></div><Link to="/interstate/trips/NJ1-CA1-0820" className="interstate-trip-card"><span className="trip-direction">NJ1 <span>→</span> CA1</span><div><strong>Trip NJ1-CA1-0820</strong><span>Truck 18 · Departure 4:00 PM</span><small>18/24 places ready · 1 issue</small></div><ChevronRight size={21} /></Link><div className="interbranch-card"><MovementLabel type="interbranch_transfer" /><strong>CA1 ↔ CA2</strong><span>Loading, Unloading and document rules are not approved.</span><button disabled>Not available in prototype</button></div></div></div>
}

export function TripScreen() {
  const { role } = useDemo()
  const canUseBol = ['supervisor', 'dispatcher', 'admin'].includes(role)
  const canScan = ['warehouse', 'driver', 'supervisor'].includes(role)
  return <div className="flow-screen"><FlowHeader title="Interstate Trip" subtitle="NJ1-CA1-0820 · Truck 18" /><div className="flow-body"><div className="trip-hero"><span className="trip-direction">NJ1 <span>→</span> CA1</span><MovementLabel type="interstate" /><h2>18 of 24 places loaded</h2><div className="meter"><span style={{ width: '75%' }} /></div><p>Manifest v3 · 1,248 lb · 182 cu ft</p></div><div className="trip-actions">{canScan ? <Link to="/interstate/trips/NJ1-CA1-0820/loading"><span><ArrowUpFromLine size={23} /></span><div><strong>Continue Loading</strong><small>6 places remaining</small></div><ChevronRight /></Link> : null}{canScan ? <Link to="/interstate/trips/NJ1-CA1-0820/unloading"><span><ArrowDownToLine size={23} /></span><div><strong>Preview Unloading</strong><small>Available at CA1</small></div><ChevronRight /></Link> : null}{canUseBol ? <Link to="/interstate/trips/NJ1-CA1-0820/bol"><span><FileText size={23} /></span><div><strong>Interstate BOL</strong><small>Preflight · 1 blocking field</small></div><ChevronRight /></Link> : <div className="permission-row"><FileText size={21} /><span><strong>BOL requires supervisor or dispatcher</strong><small>Current role has no document action.</small></span></div>}</div><div className="issue-banner"><AlertTriangle size={20} /><div><strong>1 discrepancy</strong><span>Place ZB-77A1-04 reported damaged.</span></div></div></div></div>
}

export function LoadUnloadScreen({ mode }: { mode: 'loading' | 'unloading' }) {
  const [count, setCount] = useState(mode === 'loading' ? 18 : 0)
  const total = 24
  return <div className="flow-screen"><FlowHeader title={mode === 'loading' ? 'Interstate Loading' : 'Interstate Unloading'} subtitle="NJ1-CA1-0820 · Manifest v3" /><div className="flow-body"><div className="scan-loop compact-loop"><Truck size={34} /><h2>{count} of {total} places</h2><p>{mode === 'loading' ? 'Scan against the expected trip manifest.' : 'Scan against the confirmed loaded manifest.'}</p><div className="meter"><span style={{ width: `${(count / total) * 100}%` }} /></div><button className="button button--primary" onClick={() => setCount((current) => Math.min(total, current + 1))}>{count === total ? 'All places scanned' : 'Simulate valid scan'}</button></div><div className="scan-result success"><Check size={21} /><div><strong>Place accepted</strong><span>ZB-77A1-{String(count + 1).padStart(2, '0')} · Order #12345110</span></div></div><button className="issue-action"><AlertTriangle size={20} /> Report wrong trip, extra or damage</button><SyncNotice /></div><div className="sticky-action"><button className="button button--primary" disabled={count < total}>{mode === 'loading' ? 'Review & close Loading' : 'Review & close Unloading'}<ChevronRight size={20} /></button></div></div>
}

export function BolScreen() {
  const [status, setStatus] = useState<'blocked' | 'generating' | 'generated'>('blocked')
  const navigate = useNavigate()
  return <div className="flow-screen"><FlowHeader title="Interstate BOL" subtitle="Trip NJ1-CA1-0820" /><div className="flow-body">{status === 'blocked' ? <><div className="bol-state is-blocked"><AlertTriangle size={27} /><h2>Preflight needs attention</h2><p>Fix one blocking field before generation.</p></div><div className="preflight-list"><div className="is-ok"><Check size={18} /><span><strong>Manifest v3 confirmed</strong><small>24 places · 1,248 lb</small></span></div><div className="is-ok"><Check size={18} /><span><strong>Shipper and receiver</strong><small>NJ1 → CA1</small></span></div><div className="is-error"><AlertTriangle size={18} /><span><strong>Carrier contact missing</strong><small>Required BOL field</small></span><button>Open source</button></div></div><button className="button button--primary" onClick={() => { setStatus('generating'); window.setTimeout(() => setStatus('generated'), 900) }}>Use demo value & generate</button></> : status === 'generating' ? <div className="bol-state"><RefreshCw size={32} className="spin" /><h2>Generating BOL</h2><p>Queue job is reading the confirmed manifest.</p></div> : <><div className="bol-state is-generated"><Check size={30} /><h2>BOL generated</h2><p>IBOL-2026-000184 · Version 2</p></div><div className="document-preview"><FileText size={44} /><div><strong>NJ1 → CA1 Interstate BOL</strong><span>24 places · 1,248 lb</span><small>PDF · Generated just now</small></div></div><div className="document-actions"><button>Open PDF</button><button>Download</button><button>Print</button></div><button className="button button--ghost" onClick={() => navigate('/interstate/trips/NJ1-CA1-0820')}>Back to Trip</button></>}</div></div>
}
