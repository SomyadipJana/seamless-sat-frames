import React, { useState } from 'react';
import { Globe, ExternalLink, Satellite, Radar, CloudRain, Waves, Radio } from 'lucide-react';
import { LiquidCard } from './ui/LiquidCard';

const TABS = [
  { id: 'satellite', label: 'Satellite Images', icon: Satellite, url: '/gallery/?&prod=3SIMG_%27*_L1B_STD_IR1_V%27*.jpg&date=2026-09-26&count=8' },
  { id: 'radar', label: 'RADAR', icon: Radar, url: '/gallery/?ds=dwr&prod=&date=2026-09-26&count=8' },
  { id: 'weather', label: 'Weather', icon: CloudRain, url: '/gallery/?ds=weather&prod=&date=2026-09-26&count=8' },
  { id: 'ocean', label: 'OceanState', icon: Waves, url: '/gallery/?ds=ocean&prod=&date=2026-09-26&count=8' },
  { id: 'live', label: 'LIVE', icon: Radio, url: '/live/lite/index.html' },
];

const GlobalView = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <LiquidCard index={0} className="viewer-card" height="h-[650px] mb-6">
      <div className="flex flex-col gap-4 pb-2 mb-2 w-full">
        <div className="flex justify-between items-center w-full px-1">
          <h3 className="text-[17px] font-semibold text-[var(--app-ink)]">
            Real-time geospatial data visualization
          </h3>
          <a 
            href={`https://mosdac.gov.in${activeTab.url}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            title="Open current view in new tab"
          >
            <ExternalLink size={14} className="shrink-0" /> Open
          </a>
        </div>
        
        {/* Navigation Tabs - Modern Pill-shaped buttons */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            width: '100%', 
            overflowX: 'auto',
            scrollbarWidth: 'none',
            paddingBottom: '2px'
          }}
        >
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab.id === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  borderRadius: '100px', // perfect pill shape
                  whiteSpace: 'nowrap',
                  border: isActive ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isActive ? '#eff6ff' : '#ffffff',
                  color: isActive ? '#1d4ed8' : '#475569',
                  boxShadow: isActive ? '0 2px 4px rgba(59, 130, 246, 0.1)' : '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
                <Icon size={15} style={{ flexShrink: 0, color: isActive ? '#3b82f6' : '#64748b' }} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
      
      <div className="w-full h-[calc(100%-120px)] pb-4 px-4 pt-0">
        <div className="w-full h-full rounded-xl overflow-hidden border-2 border-slate-800 bg-[#111] relative flex items-center justify-center shadow-inner">
          <iframe 
            key={activeTab.id}
            src={activeTab.url} 
            className="w-full h-full absolute inset-0 border-0 z-10 bg-[#111]"
            title={`MOSDAC ${activeTab.label}`}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
          {/* Fallback text while loading */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0 text-white/40">
             <Globe size={40} className="mb-4 animate-pulse opacity-50" />
             <p className="text-sm font-medium">Loading {activeTab.label} feed...</p>
          </div>
        </div>
      </div>
    </LiquidCard>
  );
};

export default GlobalView;
