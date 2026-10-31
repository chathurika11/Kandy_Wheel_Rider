import { ArrowRight, BadgeCheck, Bike, Fuel, HardHat, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, assetUrl } from '../api'
import { PageLoader } from '../components/PageLoader'
import { VehicleCard } from '../components/VehicleCard'
import { whatsappLink } from '../components/WhatsAppWidget'
import type { Vehicle } from '../types'

export function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getVehicles()
      .then(({ vehicles: results }) => setVehicles(results))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main>
      <section className="fleet-hero"><div className="container fleet-hero-grid"><div><p className="section-kicker"><Bike size={16} /> KANDY, YOUR WAY</p><h1>Find your freedom<br />on <em>two wheels.</em></h1><p>Explore Kandy at your own pace. Browse our scooters, compare the details, then message us on WhatsApp to ask about your trip.</p><a className="button button-whatsapp" href={whatsappLink} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Chat with us <ArrowRight size={17} /></a></div><div className="fleet-hero-art" aria-hidden="true">{vehicles[0]?.images[0] && <img className="fleet-hero-photo" src={assetUrl(vehicles[0].images[0].url)} alt="" />}<span className="fleet-sun" /><span className="fleet-road" /><span className="fleet-road-line" /><span className="fleet-hero-caption">YOUR NEXT RIDE STARTS HERE</span></div></div></section>
      <section className="trust-strip"><div className="container trust-strip-grid">
        <article><BadgeCheck size={22} /><div><strong>Well-serviced scooters</strong><span>Every ride checked before handover</span></div></article>
        <article><HardHat size={22} /><div><strong>Helmets included</strong><span>Two helmets with every rental</span></div></article>
        <article><Fuel size={22} /><div><strong>Fuel-efficient models</strong><span>Ride further around Kandy</span></div></article>
        <article><MessageCircle size={22} /><div><strong>Instant WhatsApp help</strong><span>Reservations confirmed in minutes</span></div></article>
      </div></section>
      <section className="section vehicles-page"><div className="container">
        <div className="result-heading"><div><p className="section-kicker">THE WHEELRIDER FLEET</p><h2>Choose your ride.</h2></div><p>Availability confirmed directly over WhatsApp</p></div>
        {error && <p className="notice notice-error">{error}</p>}
        {loading ? <PageLoader /> : error ? null : vehicles.length ? <div className="vehicle-grid">{vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}</div> : <div className="empty-state"><Bike size={28} /><h3>Our fleet is getting ready.</h3><p>Message us on WhatsApp and we’ll help you find a ride.</p><a href={whatsappLink} target="_blank" rel="noreferrer" className="button button-whatsapp"><MessageCircle size={17} /> WhatsApp us</a></div>}
      </div></section>
    </main>
  )
}
