import { Check, History, ImagePlus, LogOut, Pencil, Plus, ShieldCheck, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { api, assetUrl, statusLabels } from '../api'
import { AdminListings } from '../components/AdminListings'
import { PageLoader } from '../components/PageLoader'
import type { AdminAuditEntry, Vehicle, VehicleStatus } from '../types'
import { formatCurrency } from '../utils'

const emptyVehicle = {
  name: '', brand: '', model: '', year: String(new Date().getFullYear()), type: 'Scooter', description: '', dailyRate: '', engineCc: '', transmission: 'Automatic', seats: '2', location: 'Kandy town', status: 'AVAILABLE' as VehicleStatus, features: '',
}

export function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem('kwr-admin-token') ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [auditEntries, setAuditEntries] = useState<AdminAuditEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle)
  const [newImages, setNewImages] = useState<File[]>([])
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null)

  async function refresh() {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const [vehicleResponse, auditResponse] = await Promise.all([
        api.getAdminVehicles(token),
        api.getAdminAuditLogs(token),
      ])
      setVehicles(vehicleResponse.vehicles)
      setAuditEntries(auditResponse.entries)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to load the admin dashboard.'
      setError(message)
      if (message.includes('session has expired') || message.includes('authentication')) clearSession()
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

  function clearSession() {
    localStorage.removeItem('kwr-admin-token')
    setToken('')
    setVehicles([])
    setAuditEntries([])
  }

  async function logout() {
    try {
      await api.logout(token)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to record administrator sign-out.')
    } finally {
      clearSession()
    }
  }

  async function saveVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
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
      const { vehicle } = editingVehicleId
        ? await api.updateVehicle(token, editingVehicleId, payload)
        : await api.createVehicle(token, payload)
      if (newImages.length) await api.uploadVehicleImages(token, vehicle.id, newImages)
      const wasEditing = Boolean(editingVehicleId)
      setEditingVehicleId(null)
      setVehicleForm(emptyVehicle)
      setNewImages([])
      formElement.reset()
      setNotice(wasEditing ? 'Scooter details updated.' : newImages.length ? 'Scooter and photos added to the fleet.' : 'Scooter added. You can add photos below at any time.')
      await refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save this scooter.')
    } finally {
      setSubmitting(false)
    }
  }

  function editVehicle(vehicle: Vehicle) {
    setEditingVehicleId(vehicle.id)
    setVehicleForm({
      name: vehicle.name,
      brand: vehicle.brand,
      model: vehicle.model,
      year: String(vehicle.year),
      type: vehicle.type,
      description: vehicle.description,
      dailyRate: String(vehicle.dailyRate),
      engineCc: String(vehicle.engineCc),
      transmission: vehicle.transmission,
      seats: String(vehicle.seats),
      location: vehicle.location,
      status: vehicle.status,
      features: vehicle.features.join(', '),
    })
    setNewImages([])
    setError('')
    setNotice('')
    document.querySelector('.admin-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingVehicleId(null)
    setVehicleForm(emptyVehicle)
    setNewImages([])
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
    if (!window.confirm(`Remove ${vehicle.name} from the fleet?`)) return
    try {
      await api.deleteVehicle(token, vehicle.id)
      setNotice('Scooter removed from the fleet.')
      await refresh()
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to remove scooter.') }
  }

  if (!token) return <main className="admin-login"><div className="admin-login-panel"><span className="admin-shield"><ShieldCheck size={29} /></span><p className="section-kicker">WHEELRIDER ADMIN</p><h1>Manage your fleet.</h1><p>Sign in to add and update scooters, camping gadgets, and tour guides shown on the customer pages.</p><form onSubmit={login}><label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" /></label><label>Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" /></label>{error && <p className="notice notice-error">{error}</p>}<button className="button button-primary button-full" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in securely'}</button></form><small>Set the initial administrator email and password in the API environment file before starting the server.</small></div></main>

  return (
    <main className="admin-page"><section className="admin-header"><div className="container"><div><p className="section-kicker">ADMINISTRATION</p><h1>Content control centre.</h1><p>Add polished listings and keep availability current across scooters, camping gadgets, and tour guides.</p></div><button className="button button-light" onClick={logout}><LogOut size={16} /> Sign out</button></div></section>
      <section className="section admin-content"><div className="container">
        {error && <p className="notice notice-error">{error}</p>}{notice && <p className="notice notice-success"><Check size={16} /> {notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></p>}
        <div className="admin-stats"><div><span>Fleet</span><strong>{vehicles.length}</strong><small>Total scooters</small></div><div><span>Available now</span><strong>{vehicles.filter((vehicle) => vehicle.status === 'AVAILABLE').length}</strong><small>Ready for inquiries</small></div><div><span>In maintenance</span><strong>{vehicles.filter((vehicle) => vehicle.status === 'MAINTENANCE').length}</strong><small>Temporarily off the road</small></div></div>
        <AdminListings token={token} />
        <section className="admin-section"><div className="admin-section-title"><span>{editingVehicleId ? <Pencil size={20} /> : <Plus size={20} />}</span><div><p className="section-kicker">SCOOTER MANAGEMENT</p><h2>{editingVehicleId ? 'Edit scooter details' : 'Add a new scooter'}</h2></div></div>
          <form className="admin-vehicle-form" onSubmit={saveVehicle}>
            <div className="form-three-columns"><label>Display name<input required value={vehicleForm.name} onChange={(event) => setVehicleForm({ ...vehicleForm, name: event.target.value })} placeholder="e.g. City Explorer" /></label><label>Brand<input required value={vehicleForm.brand} onChange={(event) => setVehicleForm({ ...vehicleForm, brand: event.target.value })} placeholder="e.g. Honda" /></label><label>Model<input required value={vehicleForm.model} onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })} placeholder="Model name" /></label></div>
            <div className="form-four-columns"><label>Year<input required type="number" min="2000" value={vehicleForm.year} onChange={(event) => setVehicleForm({ ...vehicleForm, year: event.target.value })} /></label><label>Type<input required value={vehicleForm.type} onChange={(event) => setVehicleForm({ ...vehicleForm, type: event.target.value })} /></label><label>Daily rate (LKR)<input required type="number" min="1" value={vehicleForm.dailyRate} onChange={(event) => setVehicleForm({ ...vehicleForm, dailyRate: event.target.value })} /></label><label>Engine cc<input required type="number" min="1" value={vehicleForm.engineCc} onChange={(event) => setVehicleForm({ ...vehicleForm, engineCc: event.target.value })} /></label></div>
            <div className="form-four-columns"><label>Transmission<input required value={vehicleForm.transmission} onChange={(event) => setVehicleForm({ ...vehicleForm, transmission: event.target.value })} /></label><label>Seats<input required type="number" min="1" max="4" value={vehicleForm.seats} onChange={(event) => setVehicleForm({ ...vehicleForm, seats: event.target.value })} /></label><label>Pickup location<input required value={vehicleForm.location} onChange={(event) => setVehicleForm({ ...vehicleForm, location: event.target.value })} /></label><label>Initial status<select value={vehicleForm.status} onChange={(event) => setVehicleForm({ ...vehicleForm, status: event.target.value as VehicleStatus })}><option value="AVAILABLE">Available</option><option value="MAINTENANCE">Maintenance</option><option value="INACTIVE">Inactive</option></select></label></div>
            <label>Description<textarea required minLength={20} rows={3} value={vehicleForm.description} onChange={(event) => setVehicleForm({ ...vehicleForm, description: event.target.value })} placeholder="Describe the riding experience and condition." /></label><label>Features <small>Separate each feature with a comma</small><input value={vehicleForm.features} onChange={(event) => setVehicleForm({ ...vehicleForm, features: event.target.value })} placeholder="Helmet included, USB charging, Fuel efficient" /></label><label className="upload-area admin-upload"><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => setNewImages(Array.from(event.target.files ?? []))} /><ImagePlus size={22} /><span>{newImages.length ? `${newImages.length} photo${newImages.length > 1 ? 's' : ''} selected` : 'Add scooter photos'}</span><small>JPEG, PNG, or WebP · up to 8 files</small></label><div className="admin-form-actions"><button className="button button-primary" disabled={submitting} type="submit">{submitting ? 'Saving scooter…' : editingVehicleId ? 'Save changes' : 'Add scooter to fleet'} {editingVehicleId ? <Check size={17} /> : <Plus size={17} />}</button>{editingVehicleId && <button className="button button-light" type="button" onClick={cancelEdit}>Cancel</button>}</div>
          </form>
        </section>
        <section className="admin-section"><div className="admin-section-title"><span><ImagePlus size={20} /></span><div><p className="section-kicker">YOUR SCOOTERS</p><h2>Fleet listings</h2></div></div>
          {loading ? <PageLoader /> : vehicles.length ? <div className="admin-vehicle-grid">{vehicles.map((vehicle) => <article className="admin-vehicle-card" key={vehicle.id}><div className="admin-vehicle-top"><div><p className="eyebrow">{vehicle.brand} · {vehicle.year}</p><h3>{vehicle.name}</h3><p>{formatCurrency(vehicle.dailyRate)} / day</p></div><div className="admin-vehicle-actions"><button className="icon-button" title={`Edit ${vehicle.name}`} onClick={() => editVehicle(vehicle)}><Pencil size={16} /></button><button className="icon-button danger" title="Delete scooter" onClick={() => deleteVehicle(vehicle)}><Trash2 size={17} /></button></div></div><div className="admin-photo-grid">{vehicle.images.length ? vehicle.images.map((image) => <div key={image.id} className="admin-photo"><img src={assetUrl(image.url)} alt={image.alt} /><button onClick={() => removeImage(vehicle.id, image.id)} title="Remove photo"><X size={14} /></button></div>) : <div className="admin-photo-empty">No photos yet</div>}</div><div className="admin-card-actions"><label className="mini-upload"><ImagePlus size={15} /> Add photos<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => addVehiclePhotos(vehicle.id, event)} /></label><select value={vehicle.status} onChange={(event) => setVehicleStatus(vehicle.id, event.target.value as VehicleStatus)}>{(['AVAILABLE', 'MAINTENANCE', 'INACTIVE'] as VehicleStatus[]).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></div></article>)}</div> : <div className="empty-state"><ImagePlus size={28} /><h3>Your fleet is empty.</h3><p>Add the first scooter above to make it visible to customers.</p></div>}
        </section>
        <section className="admin-section"><div className="admin-section-title"><span><History size={20} /></span><div><p className="section-kicker">ADMIN ACTIVITY</p><h2>Audit log</h2></div></div>
          {loading ? <PageLoader /> : auditEntries.length ? <div className="booking-table-wrap"><table className="booking-table admin-audit-table"><thead><tr><th>Administrator</th><th>Action</th><th>Details</th><th>Date and time</th></tr></thead><tbody>{auditEntries.map((entry) => <tr key={entry.id}><td>{entry.adminEmail}</td><td><strong>{entry.action.split('_').join(' ')}</strong></td><td>{entry.details || '—'}</td><td>{new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.createdAt))}</td></tr>)}</tbody></table></div> : <div className="empty-state"><History size={28} /><h3>No admin activity yet.</h3><p>Sign-ins and management changes will be recorded here.</p></div>}
        </section>
      </div></section>
    </main>
  )
}
