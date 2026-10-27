import { useEffect } from 'react'
import { ArrowUpRight, Facebook, MapPin, MessageCircle } from 'lucide-react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { Admin } from './pages/Admin'
import { Booking } from './pages/Booking'
import { Confirmation } from './pages/Confirmation'
import { Home } from './pages/Home'
import { VehicleDetail } from './pages/VehicleDetail'
import { Vehicles } from './pages/Vehicles'
import logo from './img/logo.jpeg'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Footer() {
  return <footer className="site-footer"><div className="container footer-grid"><div><Link className="brand brand--footer" to="/"><img className="brand-logo" src={logo} alt="" /><span>Kandy <strong>WheelRider</strong></span></Link><p>Make every turn in Kandy a story worth keeping.</p></div><div><p className="footer-label">EXPLORE</p><Link to="/vehicles">Our scooters</Link><Link to="/vehicles">Check availability</Link><Link to="/admin">Admin login</Link></div><div><p className="footer-label">CONTACT</p><p><MapPin size={15} /> Kandy, Sri Lanka</p><a className="social-placeholder" href="https://wa.me/94719275522" target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp: +94 71 927 5522 <ArrowUpRight size={15} /></a></div><div><p className="footer-label">FOLLOW US</p><p>Follow the road less ordinary.</p><a className="social-placeholder" href="https://www.facebook.com/WheelRiderKandy" target="_blank" rel="noreferrer"><Facebook size={17} /> Kandy WheelRider <ArrowUpRight size={15} /></a></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Kandy WheelRider</span><span>Ride with care. Explore with curiosity.</span></div></footer>
}

export function App() {
  return <div className="min-h-screen bg-white text-charcoal antialiased"><ScrollToTop /><Header /><Routes><Route path="/" element={<Home />} /><Route path="/vehicles" element={<Vehicles />} /><Route path="/vehicles/:vehicleId" element={<VehicleDetail />} /><Route path="/vehicles/:vehicleId/book" element={<Booking />} /><Route path="/booking-confirmation" element={<Confirmation />} /><Route path="/admin" element={<Admin />} /><Route path="*" element={<Home />} /></Routes><Footer /></div>
}
