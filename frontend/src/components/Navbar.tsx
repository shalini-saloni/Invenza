import React from 'react';
import { Moon, Bell } from 'lucide-react';
import './Navbar.css';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar flex-between">
      <div className="navbar-left flex-center">
        <div className="logo flex-center">
          <img src="/invenza_logo.png" alt="Invenza" className="logo-img" />
        </div>
        <div className="nav-links">
          <button className="nav-item active">Dashboard</button>
          <button className="nav-item">Production</button>
          <button className="nav-item">Logistics</button>
          <button className="nav-item">Sales</button>
        </div>
      </div>
      
      <div className="navbar-right flex-center">
        <div className="theme-toggle flex-center">
          <span className="toggle-label">Light</span>
          <div className="toggle-btn active flex-center">
            <Moon size={14} />
            <span>Dark</span>
          </div>
        </div>
        
        <button className="icon-btn flex-center">
          <Bell size={20} />
        </button>
        
        <div className="profile-menu flex-center">
          <img 
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
            alt="Profile" 
            className="profile-pic"
          />
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
