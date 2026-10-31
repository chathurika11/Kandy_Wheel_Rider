import { Camera, Fuel, Gauge, MapPin, MessageCircle, Settings2, UsersRound } from 'lucide-react'
import { assetUrl } from '../api'
import { whatsappLink } from './WhatsAppWidget'
import type { Vehicle } from '../types'

const availabilityLabels: Record<Vehicle['status'], string> = {
  AVAILABLE: 'Available now',
  MAINTENANCE: 'In maintenance',
  INACTIVE: 'Not renting',
}

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const image = vehicle.images[0]
  const inquiry = encodeURIComponent(`Hi Kandy WheelRider, I'm interested in renting the ${vehicle.name} (${vehicle.brand} ${vehicle.model}). Please share availability and details.`)

  return (
    <article className="vehicle-card">
      <div className={image ? 'vehicle-photo' : 'vehicle-photo vehicle-photo--empty'}>
        {image ? <img src={assetUrl(image.url)} alt={image.alt || vehicle.name} /> : <><Camera size={30} /><span>Photo added by admin</span></>}
        <span className="vehicle-type">{vehicle.type}</span>
        <span className={`vehicle-availability vehicle-availability--${vehicle.status.toLowerCase()}`}>{availabilityLabels[vehicle.status]}</span>
      </div>
      <div className="vehicle-card-body">
        <div className="vehicle-card-heading">
          <div>
            <p className="eyebrow">{vehicle.brand} {vehicle.model} · {vehicle.year}</p>
            <h3>{vehicle.name}</h3>
          </div>
          <p className="vehicle-rate"><span>Per day</span><strong>LKR {vehicle.dailyRate.toLocaleString()}</strong></p>
        </div>
        <ul className="vehicle-spec-table">
          <li><span><Gauge size={15} /> Engine</span><strong>{vehicle.engineCc} cc</strong></li>
          <li><span><Settings2 size={15} /> Transmission</span><strong>{vehicle.transmission}</strong></li>
          <li><span><UsersRound size={15} /> Seats</span><strong>{vehicle.seats} {vehicle.seats === 1 ? 'rider' : 'riders'}</strong></li>
          <li><span><Fuel size={15} /> Model year</span><strong>{vehicle.year}</strong></li>
          <li><span><MapPin size={15} /> Pickup</span><strong>{vehicle.location}</strong></li>
        </ul>
        <p className="vehicle-description">{vehicle.description}</p>
        {vehicle.features.length > 0 && <ul className="vehicle-feature-list">{vehicle.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>}
        <a href={`${whatsappLink}?text=${inquiry}`} target="_blank" rel="noreferrer" className="button button-whatsapp vehicle-inquiry"><MessageCircle size={17} /> Ask about this scooter</a>
      </div>
    </article>
  )
}
