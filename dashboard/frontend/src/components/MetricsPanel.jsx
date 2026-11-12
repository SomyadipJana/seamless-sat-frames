import React, { useEffect, useState } from 'react';
import { Activity, Zap, Layers, Target } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LiquidCard } from './ui/LiquidCard';
import { getJson } from '../lib/api';

const ICONS = {
  ssim: Layers,
  psnr: Activity,
  mse: Target,
  fsim: Zap,
};

const FALLBACK = [
  { key: 'ssim', title: 'SSIM (Structure)', value: '0.912', unit: 'Idx', trend: 4.2 },
  { key: 'psnr', title: 'PSNR (Noise)', value: '34.8', unit: 'dB', trend: 2.1 },
  { key: 'mse', title: 'MSE (Error)', value: '0.0034', unit: '', trend: -12.5 },
  { key: 'fsim', title: 'FSIM (Features)', value: '0.885', unit: 'Idx', trend: 3.8 },
];

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
  const [metrics, setMetrics] = useState(FALLBACK);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let active = true;

    const load = () => {
      getJson('/api/metrics')
        .then((data) => {
          if (active && data.metrics?.length) setMetrics(data.metrics);
        })
        .catch(() => {});
      getJson('/api/metrics/history')
        .then((data) => {
          if (active && data.points) setHistory(data.points);
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

  return (
    <div className="metrics-panel">
      <div>
        <div className="metrics-section-header">
          <p className="metrics-section-subtitle">Evaluation Metrics</p>
          <h2 className="metrics-section-title">Performance on GOES-19</h2>
        </div>

        <div className="metrics-grid">
          {metrics.map((metric, index) => (
            <AnalyticsBlock
              key={metric.key}
              title={metric.title}
              value={metric.value}
              unit={metric.unit}
              icon={ICONS[metric.key] || Activity}
              trend={Number(metric.trend)}
              index={index + 1}
            />
          ))}
        </div>
      </div>

      <LiquidCard index={5} className="history-card">
        <div className="history-header">
          <h4 className="history-title">Performance History</h4>
          <span className="history-badge">Last 24h</span>
        </div>
        <div className="history-content" style={{ padding: 8 }}>
          {history.length === 0 ? (
            <p className="history-placeholder">Interactive Chart Loading...</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={history}>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="ssim" stroke="#2563eb" dot={false} strokeWidth={2} name="SSIM" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </LiquidCard>
    </div>
  );
};

export default MetricsPanel;
