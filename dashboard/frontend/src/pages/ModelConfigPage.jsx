import React, { useEffect, useState } from 'react';
import { LiquidCard } from '../components/ui/LiquidCard';
import { Save, Cpu, Zap, Sliders, Database, Check } from 'lucide-react';
import { getJson, sendJson } from '../lib/api';

const DEFAULTS = {
  temporal_resolution: '15-min Interval',
  inference_precision: 'FP16 (Recommended)',
  sharpening: 45,
  prefetch_buffer: '24 Frames (Standard)',
  tensorrt: true,
};

const ModelConfigPage = () => {
  const [config, setConfig] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getJson('/api/config')
      .then((data) => setConfig((current) => ({ ...current, ...data })))
      .catch(() => {});
  }, []);

  const update = (key, value) => setConfig((current) => ({ ...current, [key]: value }));

  const save = async () => {
    const next = await sendJson('/api/config', config, 'PUT');
    setConfig((current) => ({ ...current, ...next }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="config-page-container">
      <div className="config-page-header">
        <h2 className="config-page-title">Model Configuration</h2>
        <p className="config-page-subtitle">Adjust hyperparameters and settings for the AI interpolation model.</p>
      </div>

      <div className="config-grid">
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
              <select
                className="config-select"
                value={config.temporal_resolution}
                onChange={(event) => update('temporal_resolution', event.target.value)}
              >
                <option>15-min Interval</option>
                <option>10-min Interval</option>
                <option>7.5-min Interval</option>
                <option>5-min Interval (Experimental)</option>
              </select>
              <span className="config-helper">Finer intervals require significantly more compute power.</span>
            </div>

            <div className="config-field">
              <label className="config-label">Inference Precision</label>
              <select
                className="config-select"
                value={config.inference_precision}
                onChange={(event) => update('inference_precision', event.target.value)}
              >
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
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.sharpening}
                  onChange={(event) => update('sharpening', Number(event.target.value))}
                  className="config-range"
                />
                <span className="config-range-value">{config.sharpening}%</span>
              </div>
            </div>
          </div>
        </LiquidCard>

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
              <select
                className="config-select"
                value={config.prefetch_buffer}
                onChange={(event) => update('prefetch_buffer', event.target.value)}
              >
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
                <button
                  type="button"
                  className={`config-toggle ${config.tensorrt ? 'active' : ''}`}
                  onClick={() => update('tensorrt', !config.tensorrt)}
                  aria-pressed={config.tensorrt}
                >
                  <div className="config-toggle-knob"></div>
                </button>
              </div>
            </div>
          </div>
        </LiquidCard>
      </div>

      <div className="config-actions-row">
        <button className="config-save-btn" onClick={save}>
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Saved' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default ModelConfigPage;
