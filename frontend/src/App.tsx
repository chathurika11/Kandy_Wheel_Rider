import { useEffect } from 'react'
import { ArrowUpRight, Facebook, MapPin, MessageCircle } from 'lucide-react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { TopBar, WhatsAppFab } from './components/WhatsAppWidget'
import { Admin } from './pages/Admin'
import { ServiceListings } from './pages/ServiceListings'
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
  return <footer className="site-footer"><div className="container footer-grid"><div><Link className="brand brand--footer" to="/"><img className="brand-logo" src={logo} alt="" /><span>Kandy <strong>WheelRider</strong></span></Link><p>Make every turn in Kandy a story worth keeping.</p></div><div><p className="footer-label">EXPLORE</p><Link to="/">Scooter rentals</Link><Link to="/camping-gadgets">Camping gadgets</Link><Link to="/tour-guides">Tour guides</Link></div><div><p className="footer-label">CONTACT</p><p><MapPin size={15} /> Kandy, Sri Lanka</p><a className="social-placeholder" href="https://wa.me/94719275522" target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp: +94 71 927 5522 <ArrowUpRight size={15} /></a></div><div><p className="footer-label">FOLLOW US</p><p>Follow the road less ordinary.</p><a className="social-placeholder" href="https://www.facebook.com/WheelRiderKandy" target="_blank" rel="noreferrer"><Facebook size={17} /> Kandy WheelRider <ArrowUpRight size={15} /></a></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Kandy WheelRider</span><span>Ride with care. Explore with curiosity.</span></div></footer>
}

export function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname === '/admin'
  return <div className="min-h-screen bg-white text-charcoal antialiased"><ScrollToTop />{!isAdmin && <TopBar />}<Header /><Routes><Route path="/" element={<Vehicles />} /><Route path="/vehicles" element={<Navigate to="/" replace />} /><Route path="/camping-gadgets" element={<ServiceListings category="CAMPING_GADGET" />} /><Route path="/tour-guides" element={<ServiceListings category="TOUR_GUIDE" />} /><Route path="/admin" element={<Admin />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>{pathname === '/' && <Footer />}{!isAdmin && <WhatsAppFab />}</div>
}
