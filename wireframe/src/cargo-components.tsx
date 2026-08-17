import type { ReactNode } from 'react'
import { ArrowDown, ArrowLeft, ArrowUp, Check, Cloud, Home, ImagePlus, Truck } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

export function CargoShell({ children }: { children: ReactNode }) {
  return (
    <div className="cargo-shell">
      <header className="cargo-topbar">
        <Link to="/" className="cargo-brand" aria-label="Zaberman home">ZABERM<span>A</span>N</Link>
        <div className="cargo-meta"><strong>NJ1</strong><span><Cloud size={14} /> Synced</span></div>
      </header>
      <main>{children}</main>
      <CargoBottomNav />
    </div>
  )
}

export function CargoFlowHeader({ title, subtitle, showBack = true }: { title: string; subtitle?: string; showBack?: boolean }) {
  const navigate = useNavigate()
  return (
    <header className="cargo-flow-header">
      {showBack ? <button type="button" onClick={() => navigate(-1)} aria-label="Go back"><ArrowLeft /></button> : <span />}
      <div><h1>{title}</h1>{subtitle ? <p>{subtitle}</p> : null}</div>
      <span />
    </header>
  )
}

export function CargoBottomNav() {
  const items = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/pickup', label: 'Pickup', icon: ArrowUp },
    { to: '/dropoff', label: 'Dropoff', icon: ArrowDown },
    { to: '/interstate', label: 'Interstate', icon: Truck },
  ]
  return (
    <nav className="cargo-bottom-nav" aria-label="Primary navigation">
      {items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'is-active' : ''}><Icon size={23} /><span>{label}</span></NavLink>)}
    </nav>
  )
}

export function EvidenceGallery({ count, editable = false, onAdd, onRemove }: { count: number; editable?: boolean; onAdd?: () => void; onRemove?: () => void }) {
  return (
    <div className="evidence-gallery" aria-label={`${count} cargo photos`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`evidence-photo evidence-photo--${(index % 4) + 1}`} role="img" aria-label={`Cargo photo ${index + 1}`}>
          {editable ? <button type="button" aria-label={`Remove cargo photo ${index + 1}`} onClick={onRemove}>×</button> : null}
        </div>
      ))}
      {editable ? <button type="button" className="add-photo" onClick={onAdd}><ImagePlus size={24} /><span>Add photo</span></button> : null}
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
