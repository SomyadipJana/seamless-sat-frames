import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Globe, Settings, Satellite, RefreshCw, Bell, Check } from 'lucide-react';

const DashboardLayout = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateSuccess, setGenerateSuccess] = useState(false);

  const handleGenerate = () => {
    if (isGenerating || generateSuccess) return;
    
    setIsGenerating(true);
    
    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setGenerateSuccess(true);
      
      // Revert back after success message
      setTimeout(() => {
        setGenerateSuccess(false);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="dashboard-container font-sans">
      {/* App Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-img" style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/logo.png" 
              alt="" 
              style={{ height: '28px', width: 'auto', filter: 'brightness(0)', objectFit: 'contain' }} 
            />
          </div>
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
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-semibold text-sm transition-all ${
              generateSuccess ? 'bg-green-600' : 'bg-[var(--app-ink)] hover:opacity-90'
            }`}
            style={generateSuccess ? { backgroundColor: '#10b981' } : {}}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                Generating...
              </>
            ) : generateSuccess ? (
              <>
                <Check size={14} />
                Success!
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                Generate Frames
              </>
            )}
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
