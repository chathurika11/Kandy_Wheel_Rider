import { ArrowUpRight, Camera, Gauge, MapPin, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { assetUrl } from '../api'
import type { Vehicle } from '../types'

type VehicleCardProps = {
  vehicle: Vehicle
  pickupDate?: string
  returnDate?: string
}

export function VehicleCard({ vehicle, pickupDate, returnDate }: VehicleCardProps) {
  const search = pickupDate && returnDate ? `?pickup=${pickupDate}&return=${returnDate}` : ''
  const image = vehicle.images[0]

  return (
    <article className="vehicle-card">
      <div className={image ? 'vehicle-photo' : 'vehicle-photo vehicle-photo--empty'}>
        {image ? <img src={assetUrl(image.url)} alt={image.alt || vehicle.name} /> : <><Camera size={30} /><span>Photo added by admin</span></>}
        <span className="vehicle-type">{vehicle.type}</span>
      </div>
      <div className="vehicle-card-body">
        <div className="vehicle-card-heading">
          <div>
            <p className="eyebrow">{vehicle.brand} · {vehicle.year}</p>
            <h3>{vehicle.name}</h3>
          </div>
          <p className="vehicle-rate"><strong>LKR {vehicle.dailyRate.toLocaleString()}</strong><span>/ day</span></p>
        </div>
        <div className="vehicle-meta">
          <span><Gauge size={16} /> {vehicle.engineCc} cc</span>
          <span><UsersRound size={16} /> {vehicle.seats} {vehicle.seats === 1 ? 'rider' : 'riders'}</span>
          <span><MapPin size={16} /> {vehicle.location}</span>
        </div>
        <Link to={`/vehicles/${vehicle.id}${search}`} className="text-link">View details <ArrowUpRight size={17} /></Link>
      </div>
    </article>
  )
}
