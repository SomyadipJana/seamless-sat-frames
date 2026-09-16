import React from 'react';
import { LiquidCard } from '../components/ui/LiquidCard';
import { Save, Cpu, Zap, Sliders, Database } from 'lucide-react';

const ModelConfigPage = () => {
  return (
    <div className="config-page-container">
      <div className="config-page-header">
        <h2 className="config-page-title">Model Configuration</h2>
        <p className="config-page-subtitle">Adjust hyperparameters and settings for the AI interpolation model.</p>
      </div>

      <div className="config-grid">
        {/* Core Engine Card */}
        <LiquidCard className="config-card">
          <div className="config-card-header">
            <div className="config-icon-wrapper blue-glow">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="config-card-title">Interpolation Engine</h3>
              <p className="config-card-subtitle">SeamlessSAT v2.4 Core</p>
            </div>
          </div>

          <div className="config-form-group">
            <div className="config-field">
              <label className="config-label">
                Temporal Resolution
                <span className="config-badge">Critical</span>
              </label>
              <select className="config-select">
                <option>15-min Interval</option>
                <option>10-min Interval</option>
                <option>7.5-min Interval</option>
                <option>5-min Interval (Experimental)</option>
              </select>
              <span className="config-helper">Finer intervals require significantly more compute power.</span>
            </div>

            <div className="config-field">
              <label className="config-label">Inference Precision</label>
              <select className="config-select">
                <option>FP16 (Recommended)</option>
                <option>FP32 (High Accuracy)</option>
                <option>INT8 (Fastest)</option>
              </select>
            </div>

            <div className="config-field">
              <label className="config-label">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={14} /> Spatial Sharpening Factor
                </div>
              </label>
              <div className="config-slider-container">
                <input type="range" min="0" max="100" defaultValue="45" className="config-range" />
                <span className="config-range-value">45%</span>
              </div>
            </div>
          </div>
        </LiquidCard>

        {/* Caching & Data Card */}
        <LiquidCard className="config-card">
          <div className="config-card-header">
            <div className="config-icon-wrapper purple-glow">
              <Database size={20} />
            </div>
            <div>
              <h3 className="config-card-title">Data Pipeline</h3>
              <p className="config-card-subtitle">Cache and stream settings</p>
            </div>
          </div>

          <div className="config-form-group">
             <div className="config-field">
              <label className="config-label">Pre-fetch Buffer Size</label>
              <select className="config-select">
                <option>24 Frames (Standard)</option>
                <option>48 Frames (High VRAM)</option>
                <option>12 Frames (Low VRAM)</option>
              </select>
            </div>
            
            <div className="config-field">
              <label className="config-label">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} /> Hardware Acceleration
                </div>
              </label>
              <div className="config-toggle-row">
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--app-ink)' }}>Use TensorRT</span>
                <div className="config-toggle active">
                  <div className="config-toggle-knob"></div>
                </div>
              </div>
            </div>
          </div>
        </LiquidCard>
      </div>

      <div className="config-actions-row">
        <button className="config-save-btn">
          <Save size={16} />
          Save Configuration
        </button>
      </div>
    </div>
  );
};

export default ModelConfigPage;
