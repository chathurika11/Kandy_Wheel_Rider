import { Check, ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { api, assetUrl } from '../api'
import type { ServiceListing, ServiceListingCategory, ServiceListingStatus } from '../types'
import { formatCurrency } from '../utils'

const categories: { value: ServiceListingCategory; label: string }[] = [
  { value: 'CAMPING_GADGET', label: 'Camping gadgets' },
  { value: 'TOUR_GUIDE', label: 'Tour guides' },
]

const blankDraft = {
  name: '',
  description: '',
  price: '',
  priceUnit: 'day',
  details: '',
  status: 'AVAILABLE' as ServiceListingStatus,
}

export function AdminListings({ token }: { token: string }) {
  const [category, setCategory] = useState<ServiceListingCategory>('CAMPING_GADGET')
  const [listings, setListings] = useState<ServiceListing[]>([])
  const [draft, setDraft] = useState(blankDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newImages, setNewImages] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const imageInput = useRef<HTMLInputElement>(null)

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const { listings: result } = await api.getAdminListings(token, category)
      setListings(result)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load service listings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [token, category])

  function resetForm() {
    setEditingId(null)
    setDraft(blankDraft)
    setNewImages([])
    if (imageInput.current) imageInput.current.value = ''
  }

  function editListing(listing: ServiceListing) {
    setEditingId(listing.id)
    setDraft({
      name: listing.name,
      description: listing.description,
      price: String(listing.price),
      priceUnit: listing.priceUnit,
      details: listing.details.join('\n'),
      status: listing.status,
    })
    setNewImages([])
    setError('')
    setNotice('')
    document.querySelector('.service-admin-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function saveListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const payload = {
        name: draft.name,
        description: draft.description,
        price: Number(draft.price),
        priceUnit: draft.priceUnit,
        details: draft.details.split('\n').map((detail) => detail.trim()).filter(Boolean),
        status: draft.status,
      }
      const { listing } = editingId
        ? await api.updateListing(token, editingId, payload)
        : await api.createListing(token, category, payload)
      setEditingId(listing.id)
      if (newImages.length) await api.uploadListingImages(token, listing.id, newImages)
      setNotice(editingId ? 'Listing updated.' : 'Listing added.')
      resetForm()
      await refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save this listing.')
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(listing: ServiceListing, status: ServiceListingStatus) {
    try {
      await api.updateListing(token, listing.id, { status })
      setNotice('Listing availability updated.')
      await refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update listing availability.')
    }
  }

  async function addPhotos(listingId: string, event: ChangeEvent<HTMLInputElement>) {
    const images = Array.from(event.target.files ?? [])
    if (!images.length) return
    try {
      await api.uploadListingImages(token, listingId, images)
      event.target.value = ''
      setNotice('Listing photos uploaded.')
      await refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to upload listing photos.')
    }
  }

  async function removePhoto(listingId: string, imageId: string) {
    try {
      await api.deleteListingImage(token, listingId, imageId)
      setNotice('Photo removed.')
      await refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to remove listing photo.')
    }
  }

  async function deleteListing(listing: ServiceListing) {
    if (!window.confirm(`Permanently remove "${listing.name}" and its photos?`)) return
    try {
      await api.deleteListing(token, listing.id)
      setNotice('Listing removed.')
      if (editingId === listing.id) resetForm()
      await refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to remove this listing.')
    }
  }

  return (
    <section className="admin-section service-admin-section">
      <div className="admin-section-title"><span><ImagePlus size={20} /></span><div><p className="section-kicker">SERVICE LISTINGS</p><h2>Camping &amp; guide content</h2></div></div>
      <p>Add gear and guide profiles for customers to browse. Contact and rental requests are handled through WhatsApp.</p>
      <div className="service-admin-tabs" role="tablist" aria-label="Listing category">
        {categories.map((item) => <button key={item.value} type="button" role="tab" aria-selected={category === item.value} className={category === item.value ? 'is-active' : ''} onClick={() => { resetForm(); setCategory(item.value); setError(''); setNotice('') }}>{item.label}</button>)}
      </div>
      {error && <p className="notice notice-error">{error}</p>}
      {notice && <p className="notice notice-success"><Check size={16} /> {notice}</p>}
      <form className="admin-vehicle-form service-listing-form" onSubmit={saveListing}>
        <div className="admin-section-title"><span>{editingId ? <Pencil size={19} /> : <Plus size={20} />}</span><div><p className="section-kicker">{editingId ? 'UPDATE CONTENT' : 'NEW CONTENT'}</p><h3>{editingId ? 'Edit listing' : `Add ${category === 'TOUR_GUIDE' ? 'a tour guide' : 'camping gear'}`}</h3></div></div>
        <div className="form-two-columns"><label>{category === 'TOUR_GUIDE' ? 'Guide name or title' : 'Gadget name'}<input required maxLength={100} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label>Price (LKR)<input required type="number" min="1" max="10000000" step="1" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} /></label></div>
        <div className="form-two-columns"><label>Description<textarea required minLength={10} maxLength={2000} rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label><div className="form-two-columns service-listing-extra-fields"><label>Price unit<select value={draft.priceUnit} onChange={(event) => setDraft({ ...draft, priceUnit: event.target.value })}><option value="day">per day</option><option value="hour">per hour</option><option value="trip">per trip</option><option value="rental">per rental</option></select></label><label>Availability<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ServiceListingStatus })}><option value="AVAILABLE">Available</option><option value="UNAVAILABLE">Unavailable</option></select></label><label className="service-listing-details-input">{category === 'TOUR_GUIDE' ? 'Languages, experience, specialties (one per line)' : 'Specifications and included items (one per line)'}<textarea rows={3} value={draft.details} onChange={(event) => setDraft({ ...draft, details: event.target.value })} /></label></div></div>
        <label className="mini-upload service-listing-upload"><ImagePlus size={16} /> {newImages.length ? `${newImages.length} photo(s) selected` : editingId ? 'Add listing photos' : 'Choose photos (optional)'}<input ref={imageInput} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => setNewImages(Array.from(event.target.files ?? []))} /></label>
        <div className="service-admin-form-actions"><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add listing'}</button>{editingId && <button className="button button-light" type="button" onClick={resetForm} disabled={saving}><X size={16} /> Cancel edit</button>}</div>
      </form>
      <div className="service-admin-list">
        <h3>{categories.find((item) => item.value === category)?.label} on the website</h3>
        {loading ? <p>Loading listings…</p> : listings.length ? <div className="service-admin-grid">{listings.map((listing) => <article className="admin-vehicle-card service-admin-card" key={listing.id}>
          <div className="admin-vehicle-top"><div><p className="eyebrow">{listing.status === 'AVAILABLE' ? 'AVAILABLE' : 'HIDDEN FROM CUSTOMERS'}</p><h3>{listing.name}</h3><p>{formatCurrency(listing.price)} / {listing.priceUnit}</p></div><div className="admin-vehicle-actions"><button className="icon-button" type="button" title={`Edit ${listing.name}`} onClick={() => editListing(listing)}><Pencil size={16} /></button><button className="icon-button danger" type="button" title={`Delete ${listing.name}`} onClick={() => deleteListing(listing)}><Trash2 size={17} /></button></div></div>
          <p>{listing.description}</p>
          <div className="admin-photo-grid">{listing.images.length ? listing.images.map((image) => <div key={image.id} className="admin-photo"><img src={assetUrl(image.url)} alt={image.alt} /><button type="button" onClick={() => removePhoto(listing.id, image.id)} title="Remove photo"><X size={14} /></button></div>) : <div className="admin-photo-empty">No photos yet</div>}</div>
          <div className="admin-card-actions"><label className="mini-upload"><ImagePlus size={15} /> Add photos<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => addPhotos(listing.id, event)} /></label><select aria-label={`Availability for ${listing.name}`} value={listing.status} onChange={(event) => updateStatus(listing, event.target.value as ServiceListingStatus)}><option value="AVAILABLE">Available</option><option value="UNAVAILABLE">Unavailable</option></select></div>
        </article>)}</div> : <div className="empty-state"><ImagePlus size={24} /><h3>No listings yet.</h3><p>Add your first {category === 'TOUR_GUIDE' ? 'guide profile' : 'camping gadget'} above.</p></div>}
      </div>
    </section>
  )
}
