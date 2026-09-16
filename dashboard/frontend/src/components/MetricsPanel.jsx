import React from 'react';
import { Activity, Zap, Layers, Target } from 'lucide-react';
import { LiquidCard } from './ui/LiquidCard';
import { Skeleton } from './ui/skeleton';

const AnalyticsBlock = ({ title, value, unit, icon: Icon, trend, index }) => (
  <LiquidCard index={index} className="metric-card">
    <div className="metric-header">
      <span className="metric-title">{title}</span>
      <span className="metric-icon">
        <Icon size={16} />
      </span>
    </div>
    <div className="metric-value-container">
      {value} <span className="metric-unit">{unit}</span>
    </div>
    <p className={`metric-trend ${trend >= 0 ? 'trend-positive' : 'trend-negative'}`}>
      {trend > 0 ? '+' : ''}{trend}% from baseline
    </p>
  </LiquidCard>
);

const MetricsPanel = () => {
  return (
    <div className="metrics-panel">
      <div>
        <div className="metrics-section-header">
          <p className="metrics-section-subtitle">Evaluation Metrics</p>
          <h2 className="metrics-section-title">Performance on GOES-19</h2>
        </div>
        
        <div className="metrics-grid">
          <AnalyticsBlock 
            title="SSIM (Structure)" 
            value="0.912" 
            unit="Idx" 
            icon={Layers} 
            trend={+4.2}
            index={1} 
          />
          <AnalyticsBlock 
            title="PSNR (Noise)" 
            value="34.8" 
            unit="dB" 
            icon={Activity} 
            trend={+2.1}
            index={2} 
          />
          <AnalyticsBlock 
            title="MSE (Error)" 
            value="0.0034" 
            unit="" 
            icon={Target} 
            trend={-12.5}
            index={3} 
          />
          <AnalyticsBlock 
            title="FSIM (Features)" 
            value="0.885" 
            unit="Idx" 
            icon={Zap} 
            trend={+3.8}
            index={4} 
          />
        </div>
      </div>

      <LiquidCard index={5} className="history-card">
        <div className="history-header">
          <h4 className="history-title">Performance History</h4>
          <span className="history-badge">Last 24h</span>
        </div>
        <div className="history-content">
          <p className="history-placeholder">Interactive Chart Loading...</p>
        </div>
      </LiquidCard>
    </div>
  );
};

export default MetricsPanel;
