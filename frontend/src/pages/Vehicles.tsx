import { CalendarDays, RotateCcw, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { PageLoader } from '../components/PageLoader'
import { VehicleCard } from '../components/VehicleCard'
import type { Vehicle } from '../types'
import { today } from '../utils'

export function Vehicles() {
  const [searchParams, setSearchParams] = useSearchParams()
  const pickupFromUrl = searchParams.get('pickup') ?? ''
  const returnFromUrl = searchParams.get('return') ?? ''
  const [pickup, setPickup] = useState(pickupFromUrl)
  const [returnDate, setReturnDate] = useState(returnFromUrl)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setPickup(pickupFromUrl)
    setReturnDate(returnFromUrl)
    setLoading(true)
    setError('')
    api.getVehicles(pickupFromUrl || undefined, returnFromUrl || undefined)
      .then(({ vehicles: results }) => setVehicles(results))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [pickupFromUrl, returnFromUrl])

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    if (!pickup || !returnDate) {
      setError('Select both rental dates to search by availability.')
      return
    }
    if (returnDate <= pickup) {
      setError('Return date must be after the pickup date.')
      return
    }
    setSearchParams({ pickup, return: returnDate })
  }

  function resetSearch() {
    setPickup('')
    setReturnDate('')
    setSearchParams({})
  }

  const filtered = Boolean(pickupFromUrl && returnFromUrl)

  return (
    <main>
      <section className="page-hero page-hero--compact"><div className="container"><p className="section-kicker">OUR FLEET</p><h1>Find a scooter that fits <em>your plans.</em></h1><p>Every ride is listed with its rate, specs, and current availability.</p></div></section>
      <section className="section vehicles-page"><div className="container">
        <form className="availability-form availability-form--page" onSubmit={submitSearch}>
          <div className="availability-heading"><CalendarDays size={21} /><span>Check date availability</span></div>
          <label>Pickup date<input type="date" min={today()} value={pickup} onChange={(event) => setPickup(event.target.value)} /></label>
          <label>Return date<input type="date" min={pickup || today()} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} /></label>
          <button className="button button-primary" type="submit"><Search size={17} /> Search</button>
          {filtered && <button className="button button-light" type="button" onClick={resetSearch}><RotateCcw size={16} /> Reset</button>}
        </form>
        <div className="result-heading"><div><p className="section-kicker">{filtered ? 'MATCHING YOUR DATES' : 'READY WHEN YOU ARE'}</p><h2>{filtered ? 'Available scooters' : 'All available scooters'}</h2></div>{filtered && <p>{pickupFromUrl} to {returnFromUrl}</p>}</div>
        {error && <p className="notice notice-error">{error}</p>}
        {loading ? <PageLoader /> : error ? null : vehicles.length ? <div className="vehicle-grid">{vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} pickupDate={pickupFromUrl} returnDate={returnFromUrl} />)}</div> : <div className="empty-state"><CalendarDays size={28} /><h3>No scooters are free for these dates.</h3><p>Try a different pickup or return date, or browse our fleet without a date filter.</p>{filtered && <button className="button button-light" onClick={resetSearch}>Show all scooters</button>}</div>}
      </div></section>
    </main>
  )
}
