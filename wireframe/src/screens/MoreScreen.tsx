import { ChevronRight, CloudCog, RefreshCw, RotateCcw, ShieldCheck, Truck, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CargoShell } from '../cargo-components'
import { useCargo } from '../cargoStore'

export function MoreScreen() {
  const { forceSync, pendingChanges, syncStatus } = useCargo()
  const syncDisabled = syncStatus === 'offline' || syncStatus === 'syncing'
  const syncDescription = syncStatus === 'offline'
    ? `${pendingChanges} pending · offline`
    : syncStatus === 'syncing' ? 'Syncing local changes…' : `${pendingChanges} pending · ${syncStatus}`

  return (
    <CargoShell>
      <div className="screen-pad more-screen cargo-nav-screen">
        <div className="screen-title"><h1>More</h1><p>Operations and device settings</p></div>
        <div className="profile-block"><span><UserRound size={25} /></span><div><strong>Delivery crew</strong><small>NJ1 · Demo user</small></div></div>
        <div className="menu-group">
          <button type="button" className="menu-row" onClick={forceSync} disabled={syncDisabled}>
            <span className="menu-icon"><CloudCog size={21} /></span><span><strong>Sync now</strong><small>{syncDescription}</small></span><RefreshCw className={syncStatus === 'syncing' ? 'is-spinning' : ''} size={19} />
          </button>
          <Link to="/interstate" className="menu-row"><span className="menu-icon"><Truck size={21} /></span><span><strong>Interstate operations</strong><small>Loading, trips and BOL archive</small></span><ChevronRight size={19} /></Link>
        </div>
        <div className="menu-group">
          <div className="menu-row"><span className="menu-icon"><ShieldCheck size={21} /></span><span><strong>Device & permissions</strong><small>Camera, scanner and printer · prototype status only</small></span><span /></div>
        </div>
        <div className="prototype-note"><RotateCcw size={18} /><span>This prototype uses local mock data. No production systems are connected.</span></div>
      </div>
    </CargoShell>
  )
}
