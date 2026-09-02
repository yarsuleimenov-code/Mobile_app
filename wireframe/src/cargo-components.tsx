import type { ReactNode } from 'react'
import { ArrowLeft, Check, ClipboardCheck, Cloud, Home, ImagePlus, Menu, RefreshCw, ScanLine, WifiOff } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCargo } from './cargoStore'
import { usePrototypeScenario } from './prototypeScenarioStore'
import { ZabermanLogo } from './brand-logo'
import { PhotoGallery } from './PhotoEvidence'
import type { EvidencePhoto } from './photoEvidenceDomain'

export function CargoShell({ children }: { children: ReactNode }) {
  const { forceSync, pendingChanges, syncStatus } = useCargo()
  const { branch } = usePrototypeScenario()
  const SyncIcon = syncStatus === 'offline' ? WifiOff : Cloud
  const syncLabel = syncStatus === 'offline'
    ? (pendingChanges ? `Offline · ${pendingChanges}` : 'Offline')
    : syncStatus === 'pending'
      ? `${pendingChanges} pending`
      : syncStatus === 'syncing'
        ? 'Syncing…'
        : syncStatus === 'retry'
          ? 'Retry needed'
          : syncStatus === 'conflict'
            ? 'Conflict'
            : syncStatus === 'rejected' ? 'Rejected' : 'Synced'
  const syncDisabled = syncStatus === 'offline' || syncStatus === 'syncing'

  return (
    <div className="cargo-shell">
      <header className="cargo-topbar">
        <Link to="/" className="cargo-brand" aria-label="Zaberman home"><ZabermanLogo className="cargo-brand-logo" alt="" /></Link>
        <div className="cargo-meta">
          <strong>{branch}</strong>
          <div className={`cargo-sync cargo-sync--${syncStatus}`}>
            <span><SyncIcon size={14} /> {syncLabel}</span>
            <button type="button" onClick={forceSync} disabled={syncDisabled} aria-label={syncStatus === 'offline' ? 'Connect to the internet to sync data' : 'Sync data now'} title={syncStatus === 'offline' ? 'Connect to the internet to sync data' : 'Sync data now'}>
              <span className={syncStatus === 'syncing' ? 'is-spinning' : ''}><RefreshCw size={15} /></span>
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <CargoBottomNav />
    </div>
  )
}

export function CargoFlowHeader({ title, subtitle, showBack = true, onBack }: { title: string; subtitle?: string; showBack?: boolean; onBack?: () => void }) {
  const navigate = useNavigate()
  return (
    <header className="cargo-flow-header">
      {showBack ? <button type="button" onClick={onBack ?? (() => window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))} aria-label="Go back"><ArrowLeft /></button> : <span />}
      <div><h1>{title}</h1>{subtitle ? <p>{subtitle}</p> : null}</div>
      <span />
    </header>
  )
}

export function CargoBottomNav() {
  const items = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/tasks', label: 'Tasks', icon: ClipboardCheck },
    { to: '/scan', label: 'Scan', icon: ScanLine },
    { to: '/more', label: 'More', icon: Menu },
  ]
  return (
    <nav className="cargo-bottom-nav" aria-label="Primary navigation">
      {items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'is-active' : ''}><Icon size={23} /><span>{label}</span></NavLink>)}
    </nav>
  )
}

export function EvidenceGallery({ count, photos, editable = false, addDisabled = false, onAdd, onRemove }: { count: number; photos?: EvidencePhoto[]; editable?: boolean; addDisabled?: boolean; onAdd?: () => void; onRemove?: () => void }) {
  if (photos) return <PhotoGallery photos={photos} />
  return (
    <div className="evidence-gallery" aria-label={`${count} cargo photos`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`evidence-photo evidence-photo--${(index % 4) + 1}`} role="img" aria-label={`Cargo photo ${index + 1}`}>
          {editable ? <button type="button" aria-label={`Remove cargo photo ${index + 1}`} onClick={onRemove}>×</button> : null}
        </div>
      ))}
      {editable ? <button type="button" className="add-photo" onClick={onAdd} disabled={addDisabled}><ImagePlus size={24} /><span>{addDisabled ? 'Camera unavailable' : 'Add photo'}</span></button> : null}
    </div>
  )
}

export function SuccessState({ title, message, action }: { title: string; message: string; action: ReactNode }) {
  return (
    <div className="cargo-success">
      <span><Check size={36} /></span>
      <h2>{title}</h2>
      <p>{message}</p>
      {action}
    </div>
  )
}
