import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import '../pages/satellite-workspace.css';

const iconProps = {
  width: 18, height: 18, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
};

const DashboardIcon = () => (
  <svg {...iconProps}>
    <rect x="2.75" y="2.75" width="6" height="8" rx="1.5" />
    <rect x="11.25" y="2.75" width="6" height="4.5" rx="1.5" />
    <rect x="2.75" y="13.25" width="6" height="4" rx="1.5" />
    <rect x="11.25" y="9.75" width="6" height="7.5" rx="1.5" />
  </svg>
);

const SatelliteIcon = () => (
  <svg {...iconProps}>
    <circle cx="10" cy="10" r="3.25" />
    <ellipse cx="10" cy="10" rx="7.75" ry="3.1" transform="rotate(-30 10 10)" />
    <circle cx="16.7" cy="6.1" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

const ConfigIcon = () => (
  <svg {...iconProps}>
    <path d="M2.75 5h2.5M8.75 5h8.5M2.75 10h8.5M14.75 10h2.5M2.75 15h4.5M10.75 15h6.5" />
    <circle cx="7" cy="5" r="1.75" />
    <circle cx="13" cy="10" r="1.75" />
    <circle cx="9" cy="15" r="1.75" />
  </svg>
);

const navigation = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true, title: 'Interpolation dashboard' },
  { to: '/satellites', label: 'Satellites', icon: SatelliteIcon, title: 'Satellite data feeds' },
  { to: '/config', label: 'Model config', icon: ConfigIcon, title: 'Model configuration' },
];

function Brand() {
  return (
    <NavLink to="/" className="sat-brand" aria-label="Seamless SAT Frames home">
      <img src="/logo-sidebar.png" alt="" width="560" height="155" className="sat-brand-logo" />
    </NavLink>
  );
}

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = navigation.find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to))) ?? navigation[0];

  return (
    <div className="dashboard-container font-sans">
      <aside className={`dashboard-sidebar${menuOpen ? ' is-open' : ''}`} aria-label="Sidebar">
        <div className="sat-sidebar-top">
          <Brand />
          <button type="button" className="sat-icon-btn sat-menu-close" aria-label="Close navigation" onClick={() => setMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <p className="sat-nav-label">Workspace</p>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
              <span className="sat-nav-icon"><Icon /></span>
              {label}
            </NavLink>
          ))}
        </nav>

      </aside>
      {menuOpen && <button type="button" className="sat-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <button type="button" className="sat-icon-btn sat-menu-open" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <Menu size={19} />
          </button>
          <img src="/logo-sidebar.png" alt="Seamless SAT Frames" width="560" height="155" className="sat-header-logo" />
          <div className="sat-crumbs">
            <span>Seamless SAT Frames</span>
            <span aria-hidden="true">/</span>
            <strong>{current.title}</strong>
          </div>
        </header>

        <div className="dashboard-scrollable-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
