import { ArrowLeft, CalendarDays, CheckCircle2, FileUp, LockKeyhole } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { PageLoader } from '../components/PageLoader'
import type { Vehicle } from '../types'
import { formatCurrency, getRentalDays, today } from '../utils'

const initialForm = { customerName: '', contactNumber: '', email: '', nicOrPassport: '', pickupDate: '', returnDate: '', pickupLocation: 'Kandy town', notes: '' }

export function Booking() {
  const { vehicleId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [form, setForm] = useState({ ...initialForm, pickupDate: searchParams.get('pickup') ?? '', returnDate: searchParams.get('return') ?? '' })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getVehicle(vehicleId)
      .then(({ vehicle: result }) => setVehicle(result))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [vehicleId])

  const days = useMemo(() => getRentalDays(form.pickupDate, form.returnDate), [form.pickupDate, form.returnDate])
  const total = vehicle ? days * vehicle.dailyRate : 0

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) return setError('Please attach your payment slip before submitting.')
    if (!days) return setError('Choose a return date that is at least one day after pickup.')
    setSubmitting(true)
    setError('')
    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => payload.append(key, value))
    payload.append('vehicleId', vehicleId)
    payload.append('paymentSlip', file)
    try {
      const confirmation = await api.createBooking(payload)
      navigate('/booking-confirmation', { state: confirmation, replace: true })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to submit this booking.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <main className="section"><div className="container"><PageLoader /></div></main>
  if (!vehicle) return <main className="section"><div className="container"><div className="empty-state"><h2>That scooter is no longer available.</h2><p>{error}</p><Link className="button button-light" to="/vehicles">Browse scooters</Link></div></div></main>

  return (
    <main className="section booking-page"><div className="container">
      <Link className="back-link" to={`/vehicles/${vehicle.id}`}><ArrowLeft size={16} /> Back to scooter</Link>
      <div className="booking-layout">
        <div className="booking-form-wrap"><p className="section-kicker">BOOK YOUR RIDE</p><h1>Almost ready to <em>roll.</em></h1><p className="form-intro">Tell us a little about your trip and attach your payment slip. Your request will be reviewed by Kandy WheelRider.</p>
          <form className="booking-form" onSubmit={submitBooking}>
            <fieldset><legend>Rental dates</legend><div className="form-two-columns"><label>Pickup date<input required type="date" min={today()} value={form.pickupDate} onChange={(event) => updateField('pickupDate', event.target.value)} /></label><label>Return date<input required type="date" min={form.pickupDate || today()} value={form.returnDate} onChange={(event) => updateField('returnDate', event.target.value)} /></label></div><label>Preferred pickup location<input required value={form.pickupLocation} onChange={(event) => updateField('pickupLocation', event.target.value)} placeholder="e.g. Kandy town" /></label></fieldset>
            <fieldset><legend>Your details</legend><div className="form-two-columns"><label>Full name<input required value={form.customerName} onChange={(event) => updateField('customerName', event.target.value)} placeholder="Your full name" /></label><label>Contact number<input required type="tel" value={form.contactNumber} onChange={(event) => updateField('contactNumber', event.target.value)} placeholder="Your contact number" /></label></div><div className="form-two-columns"><label>Email address<input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="you@example.com" /></label><label>NIC or passport <small>(optional)</small><input value={form.nicOrPassport} onChange={(event) => updateField('nicOrPassport', event.target.value)} placeholder="Identification number" /></label></div><label>Anything else we should know? <small>(optional)</small><textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Special pickup notes or questions" rows={3} /></label></fieldset>
            <fieldset><legend>Payment proof</legend><label className={file ? 'upload-area upload-area--selected' : 'upload-area'}><input required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><FileUp size={24} /><span>{file ? file.name : 'Upload payment slip'}</span><small>JPEG, PNG, WebP, or PDF · Max 8 MB</small></label></fieldset>
            {error && <p className="notice notice-error">{error}</p>}
            <button className="button button-primary button-full" disabled={submitting} type="submit">{submitting ? 'Submitting request…' : 'Submit booking request'} <CheckCircle2 size={18} /></button>
            <p className="form-security"><LockKeyhole size={14} /> Your booking details and payment slip are shared only with Kandy WheelRider for reservation review.</p>
          </form>
        </div>
        <aside className="booking-summary"><p className="section-kicker">YOUR RENTAL</p><h2>{vehicle.name}</h2><p>{vehicle.brand} · {vehicle.engineCc} cc · {vehicle.transmission}</p><hr /><div><span>Daily rate</span><strong>{formatCurrency(vehicle.dailyRate)}</strong></div><div><span>Rental days</span><strong>{days || '—'}</strong></div><hr /><div className="summary-total"><span>Estimated total</span><strong>{days ? formatCurrency(total) : 'Select dates'}</strong></div><p className="summary-note"><CalendarDays size={15} /> The final booking status will be confirmed after the team reviews your payment proof and requested dates.</p></aside>
      </div>
    </div></main>
  )
}
