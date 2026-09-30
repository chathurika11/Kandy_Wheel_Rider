import { CalendarRange, Check, ClipboardList, ImagePlus, LogOut, Plus, ShieldCheck, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { api, assetUrl, statusLabels } from '../api'
import { PageLoader } from '../components/PageLoader'
import type { Booking, BookingStatus, Vehicle, VehicleStatus } from '../types'
import { formatCurrency, formatDate } from '../utils'

const emptyVehicle = {
  name: '', brand: '', model: '', year: String(new Date().getFullYear()), type: 'Scooter', description: '', dailyRate: '', engineCc: '', transmission: 'Automatic', seats: '2', location: 'Kandy town', status: 'AVAILABLE' as VehicleStatus, features: '',
}

export function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem('kwr-admin-token') ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle)
  const [newImages, setNewImages] = useState<File[]>([])

  async function refresh() {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const [vehicleResponse, bookingResponse] = await Promise.all([api.getAdminVehicles(token), api.getBookings(token)])
      setVehicles(vehicleResponse.vehicles)
      setBookings(bookingResponse.bookings)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to load the admin dashboard.'
      setError(message)
      if (message.includes('session has expired') || message.includes('authentication')) logout()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [token])

  async function login(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await api.login(email, password)
      localStorage.setItem('kwr-admin-token', response.token)
      setToken(response.token)
      setPassword('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  function logout() {
    localStorage.removeItem('kwr-admin-token')
    setToken('')
    setVehicles([])
    setBookings([])
  }

  async function createVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const payload = {
        name: vehicleForm.name,
        brand: vehicleForm.brand,
        model: vehicleForm.model,
        year: Number(vehicleForm.year),
        type: vehicleForm.type,
        description: vehicleForm.description,
        dailyRate: Number(vehicleForm.dailyRate),
        engineCc: Number(vehicleForm.engineCc),
        transmission: vehicleForm.transmission,
        seats: Number(vehicleForm.seats),
        location: vehicleForm.location,
        status: vehicleForm.status,
        features: vehicleForm.features.split(',').map((feature) => feature.trim()).filter(Boolean),
      }
      const { vehicle } = await api.createVehicle(token, payload)
      if (newImages.length) await api.uploadVehicleImages(token, vehicle.id, newImages)
      setVehicleForm(emptyVehicle)
      setNewImages([])
      event.currentTarget.reset()
      setNotice(newImages.length ? 'Scooter and photos added to the fleet.' : 'Scooter added. You can add photos below at any time.')
      await refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to add this scooter.')
    } finally {
      setSubmitting(false)
    }
  }

  async function setVehicleStatus(id: string, status: VehicleStatus) {
    try {
      await api.updateVehicle(token, id, { status })
      setNotice('Scooter status updated.')
      await refresh()
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to update status.') }
  }

  async function addVehiclePhotos(vehicleId: string, event: ChangeEvent<HTMLInputElement>) {
    const images = Array.from(event.target.files ?? [])
    if (!images.length) return
    try {
      await api.uploadVehicleImages(token, vehicleId, images)
      event.target.value = ''
      setNotice('Photos uploaded successfully.')
      await refresh()
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to upload photos.') }
  }

  async function removeImage(vehicleId: string, imageId: string) {
    try {
      await api.deleteVehicleImage(token, vehicleId, imageId)
      setNotice('Photo removed.')
      await refresh()
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to remove photo.') }
  }

  async function deleteVehicle(vehicle: Vehicle) {
    if (!window.confirm(`Remove ${vehicle.name} from the fleet? Vehicles with booking history cannot be deleted.`)) return
    try {
      await api.deleteVehicle(token, vehicle.id)
      setNotice('Scooter removed from the fleet.')
      await refresh()
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to remove scooter.') }
  }

  async function viewPaymentSlip(bookingId: string) {
    try {
      const paymentSlip = await api.getPaymentSlip(token, bookingId)
      const objectUrl = URL.createObjectURL(paymentSlip)
      const link = document.createElement('a')
      link.href = objectUrl
      link.target = '_blank'
      link.rel = 'noopener'
      link.click()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to open payment slip.') }
  }

  async function updateBookingStatus(id: string, status: BookingStatus) {
    try {
      await api.updateBooking(token, id, status)
      setNotice('Booking status updated.')
      await refresh()
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to update booking.') }
  }

  if (!token) return <main className="admin-login"><div className="admin-login-panel"><span className="admin-shield"><ShieldCheck size={29} /></span><p className="section-kicker">WHEELRIDER ADMIN</p><h1>Manage your fleet.</h1><p>Sign in to add vehicles and photos, review payment slips, and confirm rental bookings.</p><form onSubmit={login}><label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" /></label><label>Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" /></label>{error && <p className="notice notice-error">{error}</p>}<button className="button button-primary button-full" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in securely'}</button></form><small>Set the initial administrator email and password in the API environment file before starting the server.</small></div></main>

  return (
    <main className="admin-page"><section className="admin-header"><div className="container"><div><p className="section-kicker">ADMINISTRATION</p><h1>Fleet control centre.</h1><p>Add polished listings, keep availability current, and decide every rental request.</p></div><button className="button button-light" onClick={logout}><LogOut size={16} /> Sign out</button></div></section>
      <section className="section admin-content"><div className="container">
        {error && <p className="notice notice-error">{error}</p>}{notice && <p className="notice notice-success"><Check size={16} /> {notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></p>}
        <div className="admin-stats"><div><span>Fleet</span><strong>{vehicles.length}</strong><small>Total scooters</small></div><div><span>Available now</span><strong>{vehicles.filter((vehicle) => vehicle.status === 'AVAILABLE').length}</strong><small>Ready to book</small></div><div><span>Requests</span><strong>{bookings.filter((booking) => booking.status === 'PENDING').length}</strong><small>Awaiting review</small></div></div>
        <section className="admin-section"><div className="admin-section-title"><span><Plus size={20} /></span><div><p className="section-kicker">FLEET MANAGEMENT</p><h2>Add a new scooter</h2></div></div>
          <form className="admin-vehicle-form" onSubmit={createVehicle}>
            <div className="form-three-columns"><label>Display name<input required value={vehicleForm.name} onChange={(event) => setVehicleForm({ ...vehicleForm, name: event.target.value })} placeholder="e.g. City Explorer" /></label><label>Brand<input required value={vehicleForm.brand} onChange={(event) => setVehicleForm({ ...vehicleForm, brand: event.target.value })} placeholder="e.g. Honda" /></label><label>Model<input required value={vehicleForm.model} onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })} placeholder="Model name" /></label></div>
            <div className="form-four-columns"><label>Year<input required type="number" min="2000" value={vehicleForm.year} onChange={(event) => setVehicleForm({ ...vehicleForm, year: event.target.value })} /></label><label>Type<input required value={vehicleForm.type} onChange={(event) => setVehicleForm({ ...vehicleForm, type: event.target.value })} /></label><label>Daily rate (LKR)<input required type="number" min="1" value={vehicleForm.dailyRate} onChange={(event) => setVehicleForm({ ...vehicleForm, dailyRate: event.target.value })} /></label><label>Engine cc<input required type="number" min="1" value={vehicleForm.engineCc} onChange={(event) => setVehicleForm({ ...vehicleForm, engineCc: event.target.value })} /></label></div>
            <div className="form-four-columns"><label>Transmission<input required value={vehicleForm.transmission} onChange={(event) => setVehicleForm({ ...vehicleForm, transmission: event.target.value })} /></label><label>Seats<input required type="number" min="1" max="4" value={vehicleForm.seats} onChange={(event) => setVehicleForm({ ...vehicleForm, seats: event.target.value })} /></label><label>Pickup location<input required value={vehicleForm.location} onChange={(event) => setVehicleForm({ ...vehicleForm, location: event.target.value })} /></label><label>Initial status<select value={vehicleForm.status} onChange={(event) => setVehicleForm({ ...vehicleForm, status: event.target.value as VehicleStatus })}><option value="AVAILABLE">Available</option><option value="MAINTENANCE">Maintenance</option><option value="INACTIVE">Inactive</option></select></label></div>
            <label>Description<textarea required minLength={20} rows={3} value={vehicleForm.description} onChange={(event) => setVehicleForm({ ...vehicleForm, description: event.target.value })} placeholder="Describe the riding experience and condition." /></label><label>Features <small>Separate each feature with a comma</small><input value={vehicleForm.features} onChange={(event) => setVehicleForm({ ...vehicleForm, features: event.target.value })} placeholder="Helmet included, USB charging, Fuel efficient" /></label><label className="upload-area admin-upload"><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => setNewImages(Array.from(event.target.files ?? []))} /><ImagePlus size={22} /><span>{newImages.length ? `${newImages.length} photo${newImages.length > 1 ? 's' : ''} selected` : 'Add scooter photos'}</span><small>JPEG, PNG, or WebP · up to 8 files</small></label><button className="button button-primary" disabled={submitting} type="submit">{submitting ? 'Saving scooter…' : 'Add scooter to fleet'} <Plus size={17} /></button>
          </form>
        </section>
        <section className="admin-section"><div className="admin-section-title"><span><ImagePlus size={20} /></span><div><p className="section-kicker">YOUR SCOOTERS</p><h2>Fleet listings</h2></div></div>
          {loading ? <PageLoader /> : vehicles.length ? <div className="admin-vehicle-grid">{vehicles.map((vehicle) => <article className="admin-vehicle-card" key={vehicle.id}><div className="admin-vehicle-top"><div><p className="eyebrow">{vehicle.brand} · {vehicle.year}</p><h3>{vehicle.name}</h3><p>{formatCurrency(vehicle.dailyRate)} / day</p></div><button className="icon-button danger" title="Delete scooter" onClick={() => deleteVehicle(vehicle)}><Trash2 size={17} /></button></div><div className="admin-photo-grid">{vehicle.images.length ? vehicle.images.map((image) => <div key={image.id} className="admin-photo"><img src={assetUrl(image.url)} alt={image.alt} /><button onClick={() => removeImage(vehicle.id, image.id)} title="Remove photo"><X size={14} /></button></div>) : <div className="admin-photo-empty">No photos yet</div>}</div><div className="admin-card-actions"><label className="mini-upload"><ImagePlus size={15} /> Add photos<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => addVehiclePhotos(vehicle.id, event)} /></label><select value={vehicle.status} onChange={(event) => setVehicleStatus(vehicle.id, event.target.value as VehicleStatus)}>{(['AVAILABLE', 'MAINTENANCE', 'INACTIVE'] as VehicleStatus[]).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></div></article>)}</div> : <div className="empty-state"><ImagePlus size={28} /><h3>Your fleet is empty.</h3><p>Add the first scooter above to make it visible to customers.</p></div>}
        </section>
        <section className="admin-section"><div className="admin-section-title"><span><ClipboardList size={20} /></span><div><p className="section-kicker">RENTAL REQUESTS</p><h2>Review bookings</h2></div></div>
          {loading ? <PageLoader /> : bookings.length ? <div className="booking-table-wrap"><table className="booking-table"><thead><tr><th>Customer</th><th>Scooter & dates</th><th>Amount</th><th>Payment proof</th><th>Status</th></tr></thead><tbody>{bookings.map((booking) => <tr key={booking.id}><td><strong>{booking.customerName}</strong><span>{booking.email}</span><span>{booking.contactNumber}</span></td><td><strong>{booking.vehicle.name}</strong><span><CalendarRange size={14} /> {formatDate(booking.pickupDate)} — {formatDate(booking.returnDate)}</span><span>{booking.pickupLocation}</span></td><td>{formatCurrency(booking.totalAmount)}</td><td><button className="text-link text-button" onClick={() => viewPaymentSlip(booking.id)}>Open slip</button></td><td><select className={`status-select status-${booking.status.toLowerCase()}`} value={booking.status} onChange={(event) => updateBookingStatus(booking.id, event.target.value as BookingStatus)}>{(['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'] as BookingStatus[]).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></td></tr>)}</tbody></table></div> : <div className="empty-state"><ClipboardList size={28} /><h3>No booking requests yet.</h3><p>New customer requests and payment slips will appear here.</p></div>}
        </section>
      </div></section>
    </main>
  )
}
