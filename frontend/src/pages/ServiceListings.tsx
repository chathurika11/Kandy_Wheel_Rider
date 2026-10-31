import { ArrowRight, Camera, Compass, MessageCircle, Tent, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, assetUrl } from '../api'
import { PageLoader } from '../components/PageLoader'
import { whatsappNumber } from '../components/WhatsAppWidget'
import type { ServiceListing, ServiceListingCategory } from '../types'

const pageContent: Record<ServiceListingCategory, {
  kicker: string
  title: string
  accent: string
  description: string
  emptyTitle: string
  emptyText: string
  Icon: typeof Tent
}> = {
  CAMPING_GADGET: {
    kicker: 'GEAR UP FOR THE OUTDOORS',
    title: 'Little comforts. Big adventures.',
    accent: 'Big adventures.',
    description: 'Get ready for nights under the stars with practical camping gear, ready for your next escape around Sri Lanka.',
    emptyTitle: 'New gear is on the way.',
    emptyText: 'Message us and we’ll help you plan the camping essentials for your trip.',
    Icon: Tent,
  },
  TOUR_GUIDE: {
    kicker: 'MEET THE LOCALS',
    title: 'See more with a local by your side.',
    accent: 'a local by your side.',
    description: 'Find a friendly guide to help you discover local stories, hidden corners, and the places that make every trip memorable.',
    emptyTitle: 'Guide profiles coming soon.',
    emptyText: 'Message us and tell us what kind of experience you’re looking for.',
    Icon: Compass,
  },
}

function ListingCard({ listing, category }: { listing: ServiceListing; category: ServiceListingCategory }) {
  const image = listing.images[0]
  const inquiry = encodeURIComponent(`Hi! I'm interested in ${listing.name}${category === 'TOUR_GUIDE' ? ' guide services' : ''}. Could you share more details and availability?`)
  return (
    <article className="service-listing-card">
      <div className={`service-listing-photo${image ? '' : ' service-listing-photo--empty'}`}>
        {image ? <img src={assetUrl(image.url)} alt={image.alt || listing.name} /> : <Camera size={32} />}
        <span className="service-listing-badge">{category === 'TOUR_GUIDE' ? 'LOCAL GUIDE' : 'CAMPING GEAR'} · AVAILABLE</span>
      </div>
      <div className="service-listing-body">
        <div className="service-listing-heading"><h2>{listing.name}</h2><p><strong>LKR {listing.price.toLocaleString()}</strong><span> / {listing.priceUnit}</span></p></div>
        <p className="service-listing-description">{listing.description}</p>
        {listing.details.length > 0 && <ul className="service-listing-details">{listing.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}
        <a className="button button-whatsapp" href={`https://wa.me/${whatsappNumber}?text=${inquiry}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Ask on WhatsApp <ArrowRight size={17} /></a>
      </div>
    </article>
  )
}

export function ServiceListings({ category }: { category: ServiceListingCategory }) {
  const content = pageContent[category]
  const [listings, setListings] = useState<ServiceListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api.getListings(category)
      .then(({ listings: results }) => setListings(results))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [category])

  return (
    <main className="service-page">
      <section className="service-page-hero">
        <div className="container service-page-hero-grid">
          <div>
            <p className="section-kicker">{content.kicker}</p>
            <h1>{content.title.split(content.accent)[0]}<em>{content.accent}</em></h1>
            <p>{content.description}</p>
            <a className="button button-whatsapp" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp us <ArrowRight size={17} /></a>
          </div>
          <div className="service-page-art" aria-hidden="true">
            <span className="service-art-sun" />
            <span className="service-art-ring service-art-ring-one" />
            <span className="service-art-ring service-art-ring-two" />
            <span className="service-art-icon">{category === 'TOUR_GUIDE' ? <UsersRound size={76} /> : <content.Icon size={76} />}</span>
            <span className="service-art-caption">{category === 'TOUR_GUIDE' ? 'A DIFFERENT KIND OF DISCOVERY' : 'TAKE THE SCENIC ROUTE'}</span>
          </div>
        </div>
      </section>
      <section className="section service-listings-section">
        <div className="container">
          <div className="result-heading"><div><p className="section-kicker">{category === 'TOUR_GUIDE' ? 'LOCAL EXPERIENCES' : 'TRIP-READY ESSENTIALS'}</p><h2>{category === 'TOUR_GUIDE' ? 'Find your guide.' : 'Make camp your own.'}</h2></div><p>Ask us about current availability</p></div>
          {error && <p className="notice notice-error">{error}</p>}
          {loading ? <PageLoader /> : error ? null : listings.length ? <div className="service-listing-grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} category={category} />)}</div> : <div className="empty-state"><content.Icon size={30} /><h3>{content.emptyTitle}</h3><p>{content.emptyText}</p><a className="button button-whatsapp" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp us</a></div>}
        </div>
      </section>
    </main>
  )
}
