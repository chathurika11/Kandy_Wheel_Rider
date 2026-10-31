import { Menu, MessageCircle, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import logo from '../img/logo.jpeg'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const isScooterPage = pathname === '/' || pathname === '/vehicles'
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        {isScooterPage ? <Link className="brand" to="/" onClick={closeMenu} aria-label="Kandy WheelRider home">
          <img className="brand-logo" src={logo} alt="" />
          <span>Kandy <strong>WheelRider</strong></span>
        </Link> : <span className="brand-spacer" aria-hidden="true" />}
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={menuOpen ? 'primary-nav open' : 'primary-nav'}>
          <NavLink to="/" end onClick={closeMenu}>Scooter rentals</NavLink>
          <NavLink to="/camping-gadgets" onClick={closeMenu}>Camping gadgets</NavLink>
          <NavLink to="/tour-guides" onClick={closeMenu}>Tour guides</NavLink>
          <NavLink to="/admin" onClick={closeMenu}>Admin</NavLink>
          <a href="https://wa.me/94719275522" target="_blank" rel="noreferrer" className="nav-cta" onClick={closeMenu}><MessageCircle size={16} /> WhatsApp us</a>
        </nav>
      </div>
    </header>
  )
}
