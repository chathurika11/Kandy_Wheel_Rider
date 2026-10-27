import { ArrowLeft, CalendarDays, CheckCircle2, FileUp, LockKeyhole } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { BookedCalendar } from '../components/BookedCalendar'
import { PageLoader } from '../components/PageLoader'
import type { Vehicle } from '../types'
import { formatCurrency, getLocalDateTimeInput, getRentalQuote } from '../utils'

const initialForm = { customerName: '', contactNumber: '', email: '', nicOrPassport: '', pickupDate: '', returnDate: '', whatsappConsent: false, pickupLocation: 'Kandy town', notes: '' }

function withDefaultTime(value: string | null) {
  if (!value) return ''
  return value.length === 10 ? `${value}T09:00` : value.slice(0, 16)
}

export function Booking() {
  const { vehicleId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [form, setForm] = useState({
    ...initialForm,
    pickupDate: withDefaultTime(searchParams.get('pickup')),
    returnDate: withDefaultTime(searchParams.get('return')),
  })
  const [extraHourlyRate, setExtraHourlyRate] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [error, setError] = useState('')
  const reviewDialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    api.getVehicle(vehicleId)
      .then(({ vehicle: result }) => setVehicle(result))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false))
    api.getRentalSettings()
      .then(({ settings }) => setExtraHourlyRate(settings.extraHourlyRate))
      .catch((requestError: Error) => setError(requestError.message))
  }, [vehicleId])

  useEffect(() => {
    const dialog = reviewDialog.current
    if (!dialog) return
    if (reviewOpen && !dialog.open) dialog.showModal()
    if (!reviewOpen && dialog.open) dialog.close()
  }, [reviewOpen])

  const quote = useMemo(() => (
    vehicle && extraHourlyRate !== null
      ? getRentalQuote(form.pickupDate, form.returnDate, vehicle.dailyRate, extraHourlyRate)
      : null
  ), [extraHourlyRate, form.pickupDate, form.returnDate, vehicle])
  const dateConflict = Boolean(form.pickupDate && form.returnDate && vehicle?.bookedDates?.some(({ pickupDate, returnDate }) => (
    new Date(form.pickupDate).getTime() < new Date(returnDate).getTime()
    && new Date(form.returnDate).getTime() > new Date(pickupDate).getTime()
  )))

  function updateField<Name extends keyof typeof initialForm>(name: Name, value: typeof initialForm[Name]) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) return setError('Please attach your payment slip before submitting.')
    if (extraHourlyRate === null) return setError('The rental rate could not be loaded. Please refresh the page and try again.')
    if (!quote) return setError('Choose a return time that is at least 24 hours after pickup.')
    if (dateConflict) return setError('This scooter is already booked for some or all of those dates. Choose another rental period.')
    setError('')
    setReviewOpen(true)
  }

  async function confirmBooking() {
    if (!file || !quote || dateConflict) return
    setSubmitting(true)
    setError('')
    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      const submittedValue = key === 'pickupDate' || key === 'returnDate'
        ? new Date(value as string).toISOString()
        : String(value)
      payload.append(key, submittedValue)
    })
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
        <div className="booking-form-wrap"><p className="section-kicker">BOOK YOUR RIDE</p><h1>Almost ready to <em>roll.</em></h1><p className="form-intro">Choose your pickup and return times. Each rental day is 24 hours; extra started hours use the rate set by Kandy WheelRider.</p>
          <form className="booking-form" onSubmit={submitBooking}>
            <fieldset><legend>Rental dates and times</legend><div className="form-two-columns"><label>Pickup date & time<input required type="datetime-local" min={getLocalDateTimeInput()} value={form.pickupDate} onChange={(event) => updateField('pickupDate', event.target.value)} /></label><label>Return date & time<input required type="datetime-local" min={form.pickupDate || getLocalDateTimeInput()} value={form.returnDate} onChange={(event) => updateField('returnDate', event.target.value)} /></label></div><BookedCalendar bookedDates={vehicle.bookedDates ?? []} />{dateConflict && <p className="notice notice-error">That time range overlaps a booking. Choose another rental period.</p>}{form.pickupDate && form.returnDate && !quote && !dateConflict && <p className="notice notice-error">The rental period must be at least 24 hours.</p>}<label>Preferred pickup location<input required value={form.pickupLocation} onChange={(event) => updateField('pickupLocation', event.target.value)} placeholder="e.g. Kandy town" /></label></fieldset>
            <fieldset><legend>Your details</legend><div className="form-two-columns"><label>Full name<input required value={form.customerName} onChange={(event) => updateField('customerName', event.target.value)} placeholder="Your full name" /></label><label>WhatsApp number<input required type="tel" inputMode="tel" pattern="\+?[1-9][0-9]{7,14}" value={form.contactNumber} onChange={(event) => updateField('contactNumber', event.target.value)} placeholder="+94771234567" /><small>Include your country code so we can send booking updates.</small></label></div><div className="form-two-columns"><label>Email address<input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="you@example.com" /></label><label>NIC or passport <small>(optional)</small><input value={form.nicOrPassport} onChange={(event) => updateField('nicOrPassport', event.target.value)} placeholder="Identification number" /></label></div><label>Anything else we should know? <small>(optional)</small><textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Special pickup notes or questions" rows={3} /></label><label className="whatsapp-consent"><input required type="checkbox" checked={form.whatsappConsent} onChange={(event) => updateField('whatsappConsent', event.target.checked)} /><span>I agree to receive WhatsApp updates about this booking at the number above.</span></label></fieldset>
            <fieldset><legend>Payment proof</legend><label className={file ? 'upload-area upload-area--selected' : 'upload-area'}><input required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><FileUp size={24} /><span>{file ? file.name : 'Upload payment slip'}</span><small>JPEG, PNG, WebP, or PDF · Max 8 MB</small></label></fieldset>
            {error && <p className="notice notice-error">{error}</p>}
            <button className="button button-primary button-full" disabled={submitting || dateConflict} type="submit">{submitting ? 'Submitting request…' : 'Submit booking request'} <CheckCircle2 size={18} /></button>
            <p className="form-security"><LockKeyhole size={14} /> Your booking details and payment slip are shared only with Kandy WheelRider for reservation review.</p>
          </form>
        </div>
        <aside className="booking-summary"><p className="section-kicker">YOUR RENTAL</p><h2>{vehicle.name}</h2><p>{vehicle.brand} · {vehicle.engineCc} cc · {vehicle.transmission}</p><hr /><div><span>Daily rate</span><strong>{formatCurrency(vehicle.dailyRate)}</strong></div><div><span>Complete 24-hour periods</span><strong>{quote?.fullRentalDays ?? '—'}</strong></div><div><span>Extra started hours</span><strong>{quote?.extraHours ?? '—'}</strong></div><div><span>Extra hourly rate</span><strong>{extraHourlyRate === null ? 'Loading…' : formatCurrency(extraHourlyRate)}</strong></div><hr /><div className="summary-total"><span>Estimated total</span><strong>{quote ? formatCurrency(quote.total) : 'Select valid times'}</strong></div><p className="summary-note"><CalendarDays size={15} /> Extra time is rounded up to the next full hour. The hourly rate is set by Kandy WheelRider and fixed for this booking request.</p></aside>
      </div>
      <dialog
        ref={reviewDialog}
        className="booking-review-dialog"
        aria-labelledby="booking-review-title"
        onCancel={(event) => {
          event.preventDefault()
          if (!submitting) setReviewOpen(false)
        }}
        onClose={() => setReviewOpen(false)}
      >
        <div className="booking-review-content">
          <p className="section-kicker">PLEASE CONFIRM</p>
          <h2 id="booking-review-title">Review your booking</h2>
          <p>Check these details before sending your booking request. The request and WhatsApp notifications are sent only after you confirm.</p>
          <dl className="booking-review-details">
            <div><dt>Scooter</dt><dd>{vehicle.name}</dd></div>
            <div><dt>Pickup</dt><dd>{form.pickupDate ? new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(form.pickupDate)) : '—'}</dd></div>
            <div><dt>Return</dt><dd>{form.returnDate ? new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(form.returnDate)) : '—'}</dd></div>
            <div><dt>Customer</dt><dd>{form.customerName}</dd></div>
            <div><dt>WhatsApp</dt><dd>{form.contactNumber}</dd></div>
            <div><dt>Payment proof</dt><dd>{file?.name}</dd></div>
            <div className="booking-review-total"><dt>Estimated total</dt><dd>{formatCurrency(quote?.total ?? 0)}</dd></div>
          </dl>
          {error && <p className="notice notice-error">{error}</p>}
          <div className="booking-review-actions">
            <button className="button button-light" type="button" disabled={submitting} onClick={() => navigate(`/vehicles/${vehicle.id}`)}>Cancel booking</button>
            <button className="button button-primary" type="button" disabled={submitting} onClick={confirmBooking}>
              {submitting ? 'Confirming booking…' : 'Confirm booking'}
              {!submitting && <CheckCircle2 size={18} />}
            </button>
          </div>
        </div>
      </dialog>
    </div></main>
  )
}
