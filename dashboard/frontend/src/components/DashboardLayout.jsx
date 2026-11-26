import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import '../pages/satellite-workspace.css';

const iconProps = {
  width: 18, height: 18, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
};

const DashboardIcon = () => (
  <svg {...iconProps}>
    <rect x="2.75" y="2.75" width="6" height="6" rx="1.75" />
    <rect x="11.25" y="2.75" width="6" height="6" rx="1.75" />
    <rect x="2.75" y="11.25" width="6" height="6" rx="1.75" />
    <rect x="11.25" y="11.25" width="6" height="6" rx="1.75" />
  </svg>
);

const SatelliteIcon = () => (
  <svg {...iconProps}>
    <g transform="rotate(-45 10 10)">
      <rect x="8" y="7.5" width="4" height="5" rx="1" />
      <rect x="1.75" y="8" width="4.5" height="4" rx="0.75" />
      <rect x="13.75" y="8" width="4.5" height="4" rx="0.75" />
      <path d="M4 8v4M16 8v4M6.25 10H8M12 10h1.75M10 12.5v1.75M7.75 16.25a2.25 2.25 0 0 0 4.5 0" />
    </g>
  </svg>
);

const ConfigIcon = () => (
  <svg {...iconProps}>
    <path d="M3 5.5h3M10 5.5h7M3 10h8M15 10h2M3 14.5h2M9 14.5h8" />
    <circle cx="8" cy="5.5" r="2" />
    <circle cx="13" cy="10" r="2" />
    <circle cx="7" cy="14.5" r="2" />
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
              <Icon />
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
