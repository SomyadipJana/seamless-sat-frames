import React, { useEffect, useState } from 'react';
import { LiquidCard } from '../components/ui/LiquidCard';
import { Globe, RefreshCw } from 'lucide-react';
import { getJson } from '../lib/api';

const SatellitesPage = () => {
  const [satellite, setSatellite] = useState({
    status: 'Online',
    last_sync: '2 minutes ago',
    ingestion_gb_per_hour: 4.2,
    ingestion_trend: 12,
    instrument: 'GOES-19 ABI',
    feed: null,
  });

  useEffect(() => {
    let active = true;
    const load = () => {
      getJson('/api/satellite')
        .then((data) => {
          if (active) setSatellite((current) => ({ ...current, ...data }));
        })
        .catch(() => {});
    };
    load();
    window.addEventListener('frames-updated', load);
    return () => {
      active = false;
      window.removeEventListener('frames-updated', load);
    };
  }, []);

  const trend = Number(satellite.ingestion_trend);

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
            {satellite.status}
          </div>
          <p className="metric-trend">Last sync: {satellite.last_sync}</p>
        </LiquidCard>

        <LiquidCard className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Data Ingestion Rate</span>
            <span className="metric-icon">
              <RefreshCw size={16} />
            </span>
          </div>
          <div className="metric-value-container">
            {satellite.ingestion_gb_per_hour} <span className="metric-unit">GB/h</span>
          </div>
          <p className={`metric-trend ${trend >= 0 ? 'trend-positive' : 'trend-negative'}`}>
            {trend > 0 ? '+' : ''}{trend}% from average
          </p>
        </LiquidCard>
      </div>

      <LiquidCard className="history-card" style={{ minHeight: '400px' }}>
        <div className="history-header">
          <h4 className="history-title">Global View (Live Feed)</h4>
          <span className="history-badge">{satellite.instrument}</span>
        </div>
        <div className="history-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
          {satellite.feed ? (
            <img src={satellite.feed} alt="GOES-19 ABI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <Globe size={48} color="var(--app-muted)" style={{ marginBottom: '16px' }} />
              <p className="history-placeholder">Live satellite feed placeholder</p>
              <p style={{ fontSize: '12px', color: 'var(--app-muted)', marginTop: '8px' }}>Waiting for stream connection...</p>
            </>
          )}
        </div>
      </LiquidCard>
    </div>
  );
};

export default SatellitesPage;
