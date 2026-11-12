import React from 'react';
import { LiquidCard } from '../components/ui/LiquidCard';
import { Globe, RefreshCw } from 'lucide-react';
import GlobalView from '../components/GlobalView';

const SatellitesPage = () => {
  return (
    <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ marginBottom: '0px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--app-ink)', margin: 0 }}>Satellites</h2>
        <p style={{ color: 'var(--app-muted)', fontSize: '14px', marginTop: '4px' }}>Real-time telemetry and imagery from geostationary satellites.</p>
      </div>
      
      <GlobalView />
    </div>
  );
};

export default SatellitesPage;
