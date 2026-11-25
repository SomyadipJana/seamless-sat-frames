import React from 'react';
import GlobalView from '../components/GlobalView';

export default function SatellitesPage() {
  return (
    <div className="sat-workspace">
      <header className="sat-page-header">
        <h1>Satellites</h1>
        <p>Latest available satellite imagery, radar observations, and forecasts.</p>
      </header>
      <GlobalView />
    </div>
  );
}
