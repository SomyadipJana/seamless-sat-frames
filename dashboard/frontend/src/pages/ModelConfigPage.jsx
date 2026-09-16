import React from 'react';
import { LiquidCard } from '../components/ui/LiquidCard';
import { Settings, Save, Cpu } from 'lucide-react';

const ModelConfigPage = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '12px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--app-ink)', margin: 0 }}>Model Configuration</h2>
        <p style={{ color: 'var(--app-muted)', fontSize: '14px', marginTop: '4px' }}>Adjust hyperparameters and settings for the AI interpolation model.</p>
      </div>

      <LiquidCard className="viewer-card">
        <div className="viewer-header" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#e0e7ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="viewer-title">Interpolation Engine</h3>
              <p className="viewer-subtitle">SeamlessSAT v2.4 Core</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--app-ink)' }}>Temporal Resolution</label>
            <select className="viewer-select" style={{ width: '100%', maxWidth: '300px' }}>
              <option>15-min Interval</option>
              <option>10-min Interval</option>
              <option>7.5-min Interval</option>
              <option>5-min Interval (Experimental)</option>
            </select>
            <span style={{ fontSize: '12px', color: 'var(--app-muted)' }}>Finer intervals require significantly more compute power.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--app-ink)' }}>Inference Precision</label>
            <select className="viewer-select" style={{ width: '100%', maxWidth: '300px' }}>
              <option>FP16 (Recommended)</option>
              <option>FP32 (High Accuracy)</option>
              <option>INT8 (Fastest)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--app-ink)' }}>Spatial Sharpening Factor</label>
            <input type="range" min="0" max="100" defaultValue="45" style={{ maxWidth: '300px' }} />
          </div>
        </div>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--app-hairline)', display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <Save size={16} />
            Save Configuration
          </button>
        </div>
      </LiquidCard>
    </div>
  );
};

export default ModelConfigPage;
