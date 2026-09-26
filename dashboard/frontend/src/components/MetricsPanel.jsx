import React from 'react';
import { Activity, Zap, Layers, Target } from 'lucide-react';
import { LiquidCard } from './ui/LiquidCard';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

const generateMockData = (trend) => {
  return Array.from({ length: 15 }, (_, i) => ({
    value: 50 + (trend > 0 ? i * 2 : -i * 2) + Math.random() * 10
  }));
};

const ssimData = generateMockData(1);
const psnrData = generateMockData(1);
const mseData = generateMockData(-1);
const fsimData = generateMockData(1);

const AnalyticsBlock = ({ title, value, unit, icon: Icon, index, chartData, color }) => (
  <LiquidCard index={index} className="metric-card flex flex-col justify-between h-[150px]">
    <div className="metric-header mb-1">
      <span className="metric-title">{title}</span>
      <span className="metric-icon">
        <Icon size={16} />
      </span>
    </div>
    <div className="metric-value-container mb-1 z-10 relative">
      {value} <span className="metric-unit">{unit}</span>
    </div>
    <div className="w-full h-12 mt-auto relative -mx-2 opacity-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2.5} 
            dot={false} 
            isAnimationActive={true} 
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
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
            index={1} 
            chartData={ssimData}
            color="#2563eb"
          />
          <AnalyticsBlock 
            title="PSNR (Noise)" 
            value="34.8" 
            unit="dB" 
            icon={Activity} 
            index={2} 
            chartData={psnrData}
            color="#0ea5e9"
          />
          <AnalyticsBlock 
            title="MSE (Error)" 
            value="0.0034" 
            unit="" 
            icon={Target} 
            index={3} 
            chartData={mseData}
            color="#ef4444"
          />
          <AnalyticsBlock 
            title="FSIM (Features)" 
            value="0.885" 
            unit="Idx" 
            icon={Zap} 
            index={4} 
            chartData={fsimData}
            color="#8b5cf6"
          />
        </div>
      </div>

      <LiquidCard index={5} className="history-card">
        <div className="history-header">
          <h4 className="history-title">Performance History</h4>
          <span className="history-badge">Last 24h</span>
        </div>
        <div className="history-content relative h-32 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ssimData}>
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#2563eb" 
                strokeWidth={3} 
                dot={false} 
                isAnimationActive={true} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </LiquidCard>
    </div>
  );
};

export default MetricsPanel;
