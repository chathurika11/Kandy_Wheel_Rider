import { ArrowRight, CalendarDays, CheckCircle2, Clock3, MapPinned, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { PageLoader } from '../components/PageLoader'
import { VehicleCard } from '../components/VehicleCard'
import type { Vehicle } from '../types'
import { today } from '../utils'

export function Home() {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pickup, setPickup] = useState('')
  const [returnDate, setReturnDate] = useState('')

  useEffect(() => {
    api.getVehicles()
      .then(({ vehicles: availableVehicles }) => setVehicles(availableVehicles.slice(0, 3)))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  function searchAvailability(event: FormEvent) {
    event.preventDefault()
    if ((pickup && !returnDate) || (!pickup && returnDate)) {
      setError('Select both pickup and return dates to check availability.')
      return
    }
    const dates = pickup && returnDate ? `?pickup=${pickup}&return=${returnDate}` : ''
    navigate(`/vehicles${dates}`)
  }

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="section-kicker"><Sparkles size={15} /> Explore Kandy at your pace</p>
            <h1>Your Kandy adventure starts on <em>two wheels.</em></h1>
            <p className="hero-intro">Flexible scooter rental for temple trails, lakeside sunsets, and every spontaneous turn in between.</p>
            <div className="hero-actions">
              <Link to="/vehicles" className="button button-primary">Browse scooters <ArrowRight size={18} /></Link>
              <a href="#how-it-works" className="button button-ghost">How it works</a>
            </div>
          </div>
          <div className="hero-art" aria-label="Kandy WheelRider scooter rental">
            <div className="sun-disc" />
            <div className="hill hill-one" />
            <div className="hill hill-two" />
            <div className="route-line" />
            <div className="scooter-illustration">
              <span className="scooter-handle" /><span className="scooter-body" /><span className="scooter-seat" />
              <span className="scooter-wheel wheel-back" /><span className="scooter-wheel wheel-front" />
            </div>
            <p className="art-label">READY FOR THE ROAD</p>
          </div>
        </div>
        <div className="container booking-search-wrap">
          <form className="availability-form" onSubmit={searchAvailability}>
            <div className="availability-heading"><CalendarDays size={21} /><span>Find your wheels</span></div>
            <label>Pickup date<input required type="date" min={today()} value={pickup} onChange={(event) => setPickup(event.target.value)} /></label>
            <label>Return date<input required type="date" min={pickup || today()} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} /></label>
            <button className="button button-primary" type="submit">Check availability <ArrowRight size={18} /></button>
          </form>
        </div>
      </section>

      <section className="section intro-section">
        <div className="container split-heading">
          <div><p className="section-kicker">THE WHEELRIDER WAY</p><h2>Simple booking. More freedom.</h2></div>
          <p>Skip the crowded tours and see the city your way. Reserve a well-kept scooter online, upload your payment slip, and we’ll take care of the rest.</p>
        </div>
        <div className="container benefits-grid">
          <article><span className="feature-icon"><MapPinned size={24} /></span><h3>Made for Kandy</h3><p>Easy pickup options for city explorations, hill country getaways, and every route in between.</p></article>
          <article><span className="feature-icon"><ShieldCheck size={24} /></span><h3>Clear & reliable</h3><p>See the full scooter specifications, daily rate, and availability before you make a request.</p></article>
          <article><span className="feature-icon"><Clock3 size={24} /></span><h3>Quick to reserve</h3><p>Choose dates, share the essentials, upload payment proof, and receive a booking reference instantly.</p></article>
        </div>
      </section>

      <section className="section scooters-section">
        <div className="container section-topline"><div><p className="section-kicker">AVAILABLE TO RIDE</p><h2>Pick your perfect companion.</h2></div><Link to="/vehicles" className="text-link">View all scooters <ArrowRight size={17} /></Link></div>
        <div className="container">
          {loading ? <PageLoader /> : error && !vehicles.length ? <p className="notice notice-error">{error}</p> : vehicles.length ? <div className="vehicle-grid">{vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}</div> : <div className="empty-state"><CheckCircle2 size={27} /><h3>Our fleet is being prepared.</h3><p>Check back soon, or ask an administrator to add the first scooter.</p></div>}
        </div>
      </section>

      <section id="how-it-works" className="section how-section">
        <div className="container split-heading"><div><p className="section-kicker">HOW IT WORKS</p><h2>Hit the road in four easy steps.</h2></div><p>Everything you need to request a scooter is right here—no back-and-forth required.</p></div>
        <div className="container steps-grid">
          {[
            ['01', 'Choose a scooter', 'Compare available rides, features, and daily rates.'],
            ['02', 'Select your dates', 'See what is available for the days you need it.'],
            ['03', 'Share booking details', 'Tell us who is riding and where you would like to collect it.'],
            ['04', 'Upload payment proof', 'Send your payment slip and receive a request reference.'],
          ].map(([number, heading, copy]) => <article key={number}><span>{number}</span><h3>{heading}</h3><p>{copy}</p></article>)}
        </div>
      </section>
    </>
  )
}
