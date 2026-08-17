import { Check, ChevronRight, Circle, MapPin, Navigation, PackageCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FlowHeader, MovementLabel } from '../components'

const stops = [
  { type: 'pickup', order: '12345678', time: '9:30 AM', address: '100 Market St, Newark', status: 'done' },
  { type: 'pickup', order: '12345680', time: '11:15 AM', address: '422 Broad St, Elizabeth', status: 'current' },
  { type: 'dropoff', order: '12345678', time: '1:00 PM', address: '88 Harbor Way, Bayonne', status: 'ready' },
  { type: 'dropoff', order: '12345681', time: '2:30 PM', address: '300 Secaucus Rd, Secaucus', status: 'ready' },
]

export function SameDayScreen() {
  return (
    <div className="flow-screen route-screen">
      <FlowHeader title="Same Day route" subtitle="Route SD-2408 · NJ1" />
      <div className="route-overview"><div><MovementLabel type="local_same_day" /><h2>3 of 6 stops</h2><p>Crew 12 · Van 08</p></div><span><Navigation size={29} /></span></div>
      <div className="route-stats"><div><Truck size={20} /><span>In transit</span></div><div><PackageCheck size={20} /><span>5 places</span></div><div><MapPin size={20} /><span>18.4 mi left</span></div></div>
      <div className="route-stops">
        {stops.map((stop, index) => (
          <Link key={`${stop.order}-${stop.type}`} to={stop.type === 'pickup' ? '/pickup/PU-101' : '/dropoff/DO-104'} className={`route-stop route-stop--${stop.status}`}>
            <span className="route-stop-line">{stop.status === 'done' ? <Check size={15} /> : stop.status === 'current' ? <Navigation size={15} /> : <Circle size={12} />}</span>
            <span className="route-stop-count">{index + 1}</span>
            <span className="route-stop-main"><strong>{stop.type === 'pickup' ? 'Pickup' : 'Dropoff'} #{stop.order}</strong><span>{stop.address}</span><small>{stop.time}{stop.status === 'current' ? ' · Next stop' : ''}</small></span>
            <ChevronRight size={20} />
          </Link>
        ))}
      </div>
      <div className="route-note"><strong>Local transport only</strong><span>No interstate manifest, loading, unloading or BOL is required.</span></div>
    </div>
  )
}
