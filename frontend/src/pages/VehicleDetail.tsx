import { ArrowLeft, ArrowRight, CalendarDays, Camera, Check, ChevronLeft, ChevronRight, CircleGauge, MapPin, Settings2, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api, assetUrl } from '../api'
import { BookedCalendar } from '../components/BookedCalendar'
import { PageLoader } from '../components/PageLoader'
import type { Vehicle } from '../types'
import { formatCurrency } from '../utils'

export function VehicleDetail() {
  const { vehicleId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const pickup = searchParams.get('pickup') ?? ''
  const returnDate = searchParams.get('return') ?? ''

  useEffect(() => {
    api.getVehicle(vehicleId)
      .then(({ vehicle: result }) => setVehicle(result))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [vehicleId])

  if (loading) return <main className="section"><div className="container"><PageLoader /></div></main>
  if (error || !vehicle) return <main className="section"><div className="container"><div className="empty-state"><h2>We could not find that scooter.</h2><p>{error || 'It may no longer be available.'}</p><Link className="button button-light" to="/vehicles"><ArrowLeft size={17} /> Back to scooters</Link></div></div></main>

  const currentImage = vehicle.images[activeImage]
  const bookingSearch = pickup && returnDate ? `?pickup=${pickup}&return=${returnDate}` : ''
  const showImage = (nextIndex: number) => setActiveImage((nextIndex + vehicle.images.length) % vehicle.images.length)

  return (
    <main className="section detail-page"><div className="container">
      <Link to={`/vehicles${bookingSearch}`} className="back-link"><ArrowLeft size={16} /> All scooters</Link>
      <div className="detail-grid">
        <div className="gallery">
          <div className={currentImage ? 'main-photo' : 'main-photo main-photo--empty'}>
            {currentImage ? <img src={assetUrl(currentImage.url)} alt={currentImage.alt || vehicle.name} /> : <><Camera size={38} /><p>Photos will be added by the administrator.</p></>}
            {vehicle.images.length > 1 && <><button className="gallery-arrow gallery-arrow--left" onClick={() => showImage(activeImage - 1)} aria-label="Previous image"><ChevronLeft /></button><button className="gallery-arrow gallery-arrow--right" onClick={() => showImage(activeImage + 1)} aria-label="Next image"><ChevronRight /></button></>}
          </div>
          {vehicle.images.length > 1 && <div className="thumbnail-row">{vehicle.images.map((image, index) => <button key={image.id} onClick={() => setActiveImage(index)} className={index === activeImage ? 'thumbnail active' : 'thumbnail'}><img src={assetUrl(image.url)} alt="" /></button>)}</div>}
        </div>
        <div className="detail-copy">
          <p className="section-kicker">{vehicle.type.toUpperCase()} · {vehicle.brand.toUpperCase()}</p>
          <h1>{vehicle.name}</h1>
          <p className="detail-subtitle">{vehicle.model} · {vehicle.year}</p>
          <p className="detail-description">{vehicle.description}</p>
          <div className="spec-grid">
            <span><CircleGauge size={19} /><b>{vehicle.engineCc} cc</b><small>Engine</small></span>
            <span><Settings2 size={19} /><b>{vehicle.transmission}</b><small>Transmission</small></span>
            <span><UsersRound size={19} /><b>{vehicle.seats}</b><small>{vehicle.seats === 1 ? 'Rider' : 'Riders'}</small></span>
            <span><MapPin size={19} /><b>{vehicle.location}</b><small>Pickup area</small></span>
          </div>
          <BookedCalendar bookedDates={vehicle.bookedDates ?? []} />
          <div className="detail-price"><div><span>From</span><strong>{formatCurrency(vehicle.dailyRate)}</strong><span>per day</span></div><Link className="button button-primary" to={`/vehicles/${vehicle.id}/book${bookingSearch}`}>Book now <ArrowRight size={18} /></Link></div>
          <p className="booking-hint"><CalendarDays size={16} /> Select your dates on the next step, then send your booking request.</p>
        </div>
      </div>
      <section className="features-panel"><div><p className="section-kicker">WHAT’S INCLUDED</p><h2>Ready for your route.</h2></div><div className="feature-list">{vehicle.features.length ? vehicle.features.map((feature) => <span key={feature}><Check size={16} /> {feature}</span>) : <span><Check size={16} /> Feature information will be added by the administrator.</span>}</div></section>
    </div></main>
  )
}
