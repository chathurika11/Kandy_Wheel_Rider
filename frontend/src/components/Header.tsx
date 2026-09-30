import { Menu, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link className="brand" to="/" onClick={closeMenu} aria-label="Kandy WheelRider home">
          <span className="brand-mark"><Zap size={18} fill="currentColor" /></span>
          <span>Kandy <strong>WheelRider</strong></span>
        </Link>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={menuOpen ? 'primary-nav open' : 'primary-nav'}>
          <NavLink to="/" onClick={closeMenu}>Home</NavLink>
          <NavLink to="/vehicles" onClick={closeMenu}>Our scooters</NavLink>
          <NavLink to="/admin" onClick={closeMenu}>Admin</NavLink>
          <Link to="/vehicles" className="nav-cta" onClick={closeMenu}>Find a ride</Link>
        </nav>
      </div>
    </header>
  )
}
