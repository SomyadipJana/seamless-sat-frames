import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Globe, Settings, Satellite, RefreshCw, Bell } from 'lucide-react';

const DashboardLayout = () => {
  return (
    <div className="dashboard-container font-sans">
      {/* App Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Satellite size={18} />
          </div>
          <span className="sidebar-title">SeamlessSAT</span>
        </div>
        
        <nav className="sidebar-nav">
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
            Satellites (GOES-19)
          </NavLink>
          <NavLink 
            to="/config" 
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <Settings size={18} />
            Model Config
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--app-ink)] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
            <RefreshCw size={14} />
            Generate Frames
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main relative z-10">
        {/* Top Header */}
        <header className="dashboard-header">
          <h1 className="header-title">INSAT Interpolation Dashboard</h1>
          
          <div className="header-actions">
            <button className="header-icon-btn">
              <Bell size={18} />
            </button>
            <div className="header-avatar">
              SD
            </div>
          </div>
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
