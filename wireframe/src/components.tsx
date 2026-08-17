import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Barcode, Check, ChevronRight, CircleAlert, ClipboardCheck, CloudOff,
  Home, Menu, Package, RefreshCw, ScanLine, Truck, WifiOff,
} from 'lucide-react'
import { useDemo } from './store'
import type { MovementType } from './domain'

export function AppShell({ children }: { children: ReactNode }) {
  const { branch, network, syncItems } = useDemo()
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Zaberman home">ZABERMAN</NavLink>
        <div className="topbar-meta">
          <span>{branch}</span>
          <NavLink className={`sync-dot sync-dot--${network}`} to="/more/sync">
            {network === 'offline' ? <WifiOff size={16} /> : <RefreshCw size={15} />}
            <span>{network === 'online' ? (syncItems.length ? `${syncItems.length} pending` : 'Synced') : network}</span>
          </NavLink>
        </div>
      </header>
      <main className="app-content">{children}</main>
      <BottomNav />
    </div>
  )
}

function BottomNav() {
  const nav = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/tasks', label: 'Tasks', icon: ClipboardCheck },
    { to: '/scan', label: 'Scan', icon: ScanLine, scan: true },
    { to: '/more', label: 'More', icon: Menu },
  ]
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {nav.map(({ to, label, icon: Icon, end, scan }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''} ${scan ? 'nav-item--scan' : ''}`}>
          <span className="nav-icon"><Icon size={scan ? 26 : 23} strokeWidth={2} /></span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export function FlowHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  const navigate = useNavigate()
  return (
    <header className="flow-header">
      <button className="icon-button" onClick={onBack ?? (() => navigate(-1))} aria-label="Go back"><ArrowLeft size={25} /></button>
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <span className="flow-header-spacer" />
    </header>
  )
}

export function MovementLabel({ type }: { type: MovementType }) {
  const labels: Record<MovementType, string> = {
    local_standard: 'Local',
    local_same_day: 'Same Day',
    interstate: 'Interstate',
    interbranch_transfer: 'Interbranch',
  }
  return <span className={`movement movement--${type}`}>{labels[type]}</span>
}

export function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {action ? <button onClick={onAction}>{action}</button> : null}
    </div>
  )
}

export function RouteLine({ active = 1, count = 4 }: { active?: number; count?: number }) {
  return (
    <div className="route-line" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => <span key={index} className={index <= active ? 'is-active' : ''} />)}
    </div>
  )
}

export function EmptyState({ icon = 'package', title, message, action, onAction }: { icon?: 'package' | 'offline' | 'alert'; title: string; message: string; action?: string; onAction?: () => void }) {
  const Icon = icon === 'offline' ? CloudOff : icon === 'alert' ? CircleAlert : Package
  return (
    <div className="empty-state">
      <Icon size={34} />
      <h2>{title}</h2>
      <p>{message}</p>
      {action ? <button className="button button--secondary" onClick={onAction}>{action}</button> : null}
    </div>
  )
}

export function ScanButton({ label = 'Scan barcode', onClick }: { label?: string; onClick?: () => void }) {
  return <button className="scan-action" onClick={onClick}><Barcode size={24} /><span>{label}</span><ChevronRight size={19} /></button>
}

export function SyncNotice() {
  const { network, syncItems } = useDemo()
  const offline = network !== 'online'
  return (
    <div className={`sync-notice ${offline ? 'is-offline' : ''}`}>
      {offline ? <WifiOff size={20} /> : <Check size={20} />}
      <div>
        <strong>{offline ? 'Saved on device' : syncItems.length ? 'Changes queued' : 'All changes synced'}</strong>
        <span>{offline ? 'Will sync when connection is available' : syncItems.length ? `${syncItems.length} items waiting` : 'Central record is up to date'}</span>
      </div>
    </div>
  )
}

export function InterstateLink() {
  const { role } = useDemo()
  if (role === 'delivery') return null
  return (
    <NavLink to="/more/interstate" className="menu-row">
      <span className="menu-icon"><Truck size={21} /></span>
      <span><strong>Interstate operations</strong><small>Trips, loading, unloading and BOL</small></span>
      <ChevronRight size={19} />
    </NavLink>
  )
}
