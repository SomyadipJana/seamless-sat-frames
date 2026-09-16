import React from 'react';
import { LiquidCard } from '../components/ui/LiquidCard';
import { Globe, RefreshCw } from 'lucide-react';

const SatellitesPage = () => {
  return (
    <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ marginBottom: '12px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--app-ink)', margin: 0 }}>Satellites (GOES-19)</h2>
        <p style={{ color: 'var(--app-muted)', fontSize: '14px', marginTop: '4px' }}>Real-time telemetry and imagery from the GOES-19 geostationary satellite.</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <LiquidCard className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Connection Status</span>
            <span className="metric-icon">
              <Globe size={16} />
            </span>
          </div>
          <div className="metric-value-container" style={{ color: '#10b981' }}>
            Online
          </div>
          <p className="metric-trend">Last sync: 2 minutes ago</p>
        </LiquidCard>

        <LiquidCard className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Data Ingestion Rate</span>
            <span className="metric-icon">
              <RefreshCw size={16} />
            </span>
          </div>
          <div className="metric-value-container">
            4.2 <span className="metric-unit">GB/h</span>
          </div>
          <p className="metric-trend trend-positive">+12% from average</p>
        </LiquidCard>
      </div>

      <LiquidCard className="history-card" style={{ minHeight: '400px' }}>
        <div className="history-header">
          <h4 className="history-title">Global View (Live Feed)</h4>
          <span className="history-badge">GOES-19 ABI</span>
        </div>
        <div className="history-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0' }}>
          <Globe size={48} color="var(--app-muted)" style={{ marginBottom: '16px' }} />
          <p className="history-placeholder">Live satellite feed placeholder</p>
          <p style={{ fontSize: '12px', color: 'var(--app-muted)', marginTop: '8px' }}>Waiting for stream connection...</p>
        </div>
      </LiquidCard>
    </div>
  );
};

export default SatellitesPage;
