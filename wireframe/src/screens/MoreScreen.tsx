import { ChevronRight, CloudCog, History, RotateCcw, Settings2, ShieldCheck, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { InterstateLink } from '../components'
import { roleLabels } from '../data'
import { useDemo } from '../store'

export function MoreScreen() {
  const { role, branch, network, syncItems } = useDemo()
  return (
    <div className="screen-pad more-screen">
      <div className="screen-title"><h1>More</h1><p>Operations and device settings</p></div>
      <div className="profile-block"><span><UserRound size={25} /></span><div><strong>{roleLabels[role]}</strong><small>{branch} · Demo user</small></div></div>
      <div className="menu-group">
        <Link to="/more/sync" className="menu-row"><span className="menu-icon"><CloudCog size={21} /></span><span><strong>Sync center</strong><small>{syncItems.length} pending · {network}</small></span><ChevronRight size={19} /></Link>
        <Link to="/more/history" className="menu-row"><span className="menu-icon"><History size={21} /></span><span><strong>Place history</strong><small>Scans, moves and corrections</small></span><ChevronRight size={19} /></Link>
        <InterstateLink />
      </div>
      <div className="menu-group">
        <Link to="/more/demo" className="menu-row"><span className="menu-icon"><Settings2 size={21} /></span><span><strong>Demo controls</strong><small>Role, branch, network and errors</small></span><ChevronRight size={19} /></Link>
        <button className="menu-row"><span className="menu-icon"><ShieldCheck size={21} /></span><span><strong>Device & permissions</strong><small>Camera, scanner and printer</small></span><ChevronRight size={19} /></button>
      </div>
      <div className="prototype-note"><RotateCcw size={18} /><span>This prototype uses local mock data. No production systems are connected.</span></div>
    </div>
  )
}
