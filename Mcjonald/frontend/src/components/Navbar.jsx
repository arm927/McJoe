
import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

export default function Navbar({
  cartCount = 0,
  user = null,
  onLogout
}) {
  const [open, setOpen] = useState(false);

  const isStaff =
    user?.role === 'Admin' ||
    user?.role === 'Employee';

  const links = [
    { to: '/', label: 'Home', end: true },
    { to: '/menu', label: 'Menu' },

    ...(user?.role === 'Customer'
      ? [
          { to: '/cart', label: 'Cart' },
          { to: '/orders', label: 'My Orders' }
        ]
      : []),

    ...(isStaff
      ? [
          { to: '/orders', label: 'Manage Orders' },
          { to: '/manage-menu', label: 'Manage Menu' }
        ]
      : [])
  ];

  const closeMenu = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="container nav-inner">

        {/* Logo */}
        <Link
          to="/"
          className="brand"
          onClick={closeMenu}
        >
          <span className="brand-mark">☕</span>
          <span>
            McJoe
            <small>a cafe</small>
          </span>
        </Link>

        {/* Mobile navigation button */}
        <button
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>

        {/* Navigation links */}
        <nav className={`nav-links ${open ? 'open' : ''}`}>

          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={closeMenu}
            >
              {link.label}

              {link.to === '/cart' && cartCount > 0 && (
                <span className="cart-badge">
                  {cartCount}
                </span>
              )}
            </NavLink>
          ))}

          {/* Logged out */}
          {!user ? (
            <>
              <NavLink
                to="/login"
                onClick={closeMenu}
              >
                Log in
              </NavLink>

              <Link
                className="btn btn-primary nav-auth"
                to="/signup"
                onClick={closeMenu}
              >
                Sign up
              </Link>
            </>
          ) : (
            /* Logged in */
            <div className="nav-account">

              <span className="nav-user">
                {user.name} · {user.role}
              </span>

              <button
                className="nav-logout"
                onClick={() => {
                  closeMenu();
                  onLogout?.();
                }}
              >
                Log out
              </button>

            </div>
          )}

        </nav>
      </div>
    </header>
  );
}
