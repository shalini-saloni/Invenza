import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Layout: React.FC = () => {
  const { logout, token } = useAuth();
  const navigate = useNavigate();
  const [userInitials, setUserInitials] = useState('U');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
          handleLogout();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data.full_name) {
            setUserInitials(data.full_name.trim().charAt(0).toUpperCase());
          } else {
            setUserInitials(data.email[0].toUpperCase());
          }
          if (data.profile_picture) {
            setProfilePic(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${data.profile_picture}`);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileNav = () => setMobileNavOpen(false);

  const navItems = [
    { to: '/', label: 'Home', end: true },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/forecast', label: 'Forecast' },
    { to: '/insights', label: 'Insights' },
    { to: '/inventory', label: 'Inventory' },
  ];

  return (
    <div className="app-container">
      <nav className="navbar flex-between">
        <div className="navbar-left flex-center">
          <div className="logo flex-center" onClick={() => navigate('/')}>
            <img src="/invenza_logo.png" alt="Invenza" className="logo-img" />
          </div>
          <div className="nav-links">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                end={item.end}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
        
        <div className="navbar-right flex-center">

          
          <button className="icon-btn flex-center">
            <Bell size={20} />
          </button>
          
          <button className="icon-btn flex-center" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>

          <div className="profile-menu flex-center" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <div className="profile-avatar flex-center">
              {!profilePic || imgError ? (
                userInitials
              ) : (
                <img 
                  src={profilePic} 
                  alt={userInitials} 
                  onError={() => setImgError(true)}
                />
              )}
            </div>
          </div>

          {/* Hamburger for mobile */}
          <button className="hamburger-btn" onClick={() => setMobileNavOpen(true)}>
            <Menu size={22} />
          </button>
        </div>
      </nav>

      {/* Mobile Nav Overlay */}
      <div className={`mobile-nav-overlay ${mobileNavOpen ? 'open' : ''}`} onClick={closeMobileNav} />
      <div className={`mobile-nav ${mobileNavOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <div className="logo flex-center" onClick={() => { navigate('/'); closeMobileNav(); }}>
            <img src="/invenza_logo.png" alt="Invenza" className="logo-img" />
          </div>
          <button className="icon-btn flex-center" onClick={closeMobileNav}>
            <X size={18} />
          </button>
        </div>

        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.end}
            onClick={closeMobileNav}
          >
            {item.label}
          </NavLink>
        ))}
        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={closeMobileNav}
        >
          Profile
        </NavLink>

        <div className="mobile-nav-actions">

          <button className="nav-item" onClick={() => { handleLogout(); closeMobileNav(); }} style={{ color: '#ef4444' }}>
            <LogOut size={16} style={{ marginRight: '8px', display: 'inline' }} />
            Sign Out
          </button>
        </div>
      </div>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
