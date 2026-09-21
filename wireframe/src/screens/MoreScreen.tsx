import { BookOpen, ChevronRight, CloudCog, PackageSearch, RefreshCw, Settings2, ShieldCheck, Truck, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CargoShell } from '../cargo-components'
import { useCargo } from '../cargoStore'
import { roleLabels } from '../data'
import { usePrototypeScenario } from '../prototypeScenarioStore'

export function MoreScreen() {
  const { forceSync, pendingChanges, syncStatus } = useCargo()
  const { branch, devices, role } = usePrototypeScenario()
  const syncDisabled = syncStatus === 'offline' || syncStatus === 'syncing'
  const syncDescription = syncStatus === 'offline'
    ? `${pendingChanges} pending · offline`
    : syncStatus === 'syncing' ? 'Syncing local changes…' : `${pendingChanges} pending · ${syncStatus}`
  const availableDevices = Object.values(devices).filter(Boolean).length
  const helpUrl = '/Mobile_app/help/ru/'

  return (
    <CargoShell>
      <div className="screen-pad more-screen cargo-nav-screen">
        <div className="screen-title"><h1>More</h1><p>Operations and devices</p></div>
        <div className="profile-block"><span><UserRound size={25} /></span><div><strong>{roleLabels[role]}</strong><small>Branch {branch}</small></div></div>
        <div className="menu-group">
          <button type="button" className="menu-row" onClick={forceSync} disabled={syncDisabled}>
            <span className="menu-icon"><CloudCog size={21} /></span><span><strong>Sync now</strong><small>{syncDescription}</small></span><RefreshCw className={syncStatus === 'syncing' ? 'is-spinning' : ''} size={19} />
          </button>
          <Link to="/interstate" className="menu-row"><span className="menu-icon"><Truck size={21} /></span><span><strong>Interstate operations</strong><small>Loading, trips and BOL archive</small></span><ChevronRight size={19} /></Link>
        </div>
        <div className="menu-group">
          <a href={helpUrl} className="menu-row"><span className="menu-icon"><BookOpen size={21} /></span><span><strong>Help & Instructions</strong><small>User guide and operational help</small></span><ChevronRight size={19} /></a>
          <Link to="/places" className="menu-row"><span className="menu-icon"><PackageSearch size={21} /></span><span><strong>Cargo places</strong><small>PlaceID, status, location and history</small></span><ChevronRight size={19} /></Link>
          <Link to="/more/demo" className="menu-row"><span className="menu-icon"><Settings2 size={21} /></span><span><strong>Administration</strong><small>Role, branch, connection and devices</small></span><ChevronRight size={19} /></Link>
          <div className="menu-row"><span className="menu-icon"><ShieldCheck size={21} /></span><span><strong>Device availability</strong><small>{availableDevices} of 3 devices available</small></span><span /></div>
        </div>
      </div>
    </CargoShell>
  )
}
