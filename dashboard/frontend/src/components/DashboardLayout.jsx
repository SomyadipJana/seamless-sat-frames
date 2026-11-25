import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Globe, Settings, Satellite } from 'lucide-react';

const DashboardLayout = () => {
  return (
    <div className="dashboard-container font-sans">
      {/* App Sidebar */}
      <aside className="dashboard-sidebar">
        <NavLink to="/" className="sat-brand" aria-label="Seamless SAT Frames home">
          <span className="sat-brand-icon"><Satellite size={21} /></span>
          <span>Seamless SAT<span className="sat-brand-caption">Frame interpolation</span></span>
        </NavLink>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <NavLink 
            to="/" 
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            end
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          <NavLink 
            to="/satellites" 
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <Globe size={18} />
            Satellites
          </NavLink>
          <NavLink 
            to="/config" 
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <Settings size={18} />
            Model Config
          </NavLink>
        </nav>

      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main relative z-10">
        {/* Top Header */}
        <header className="dashboard-header">
          <span className="header-title">Satellite workspace</span>
          
        </header>

        {/* Scrollable Content */}
        <div className="dashboard-scrollable-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
