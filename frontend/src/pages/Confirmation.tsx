import { ArrowRight, CheckCircle2, MailCheck, ShieldCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import type { BookingConfirmation } from '../types'
import { formatCurrency, formatDate } from '../utils'

export function Confirmation() {
  const location = useLocation()
  const confirmation = location.state as BookingConfirmation | null
  if (!confirmation) return <main className="section"><div className="container"><div className="empty-state"><h1>Ready to book your next ride?</h1><p>Choose a scooter to get started.</p><Link to="/vehicles" className="button button-primary">Browse scooters <ArrowRight size={18} /></Link></div></div></main>

  const { booking, bookingReference } = confirmation
  return (
    <main className="section confirmation-page"><div className="container confirmation-card"><span className="confirmation-icon"><CheckCircle2 size={38} /></span><p className="section-kicker">REQUEST RECEIVED</p><h1>Your wheels are one step <em>closer.</em></h1><p>Thank you, {booking.customerName}. Your booking request and payment slip have been received for review.</p><div className="reference-box"><span>Booking reference</span><strong>{bookingReference}</strong></div><div className="confirmation-details"><div><span>Scooter</span><strong>{booking.vehicle.name}</strong></div><div><span>Rental period</span><strong>{formatDate(booking.pickupDate)} — {formatDate(booking.returnDate)}</strong></div><div><span>Estimated total</span><strong>{formatCurrency(booking.totalAmount)}</strong></div></div><div className="confirmation-next"><div><MailCheck size={21} /><span><strong>What happens next?</strong> The WheelRider team will review your requested dates and payment proof, then contact you using the details you shared.</span></div><div><ShieldCheck size={21} /><span><strong>Keep your reference handy.</strong> Quote this number if you need to follow up about your reservation.</span></div></div><Link to="/vehicles" className="button button-primary">Explore more scooters <ArrowRight size={18} /></Link></div></main>
  )
}
