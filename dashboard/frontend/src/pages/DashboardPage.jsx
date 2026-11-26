import React, { useEffect, useState } from 'react';
import { Aperture, ScanLine } from 'lucide-react';
import './satellite-workspace.css';
import ComparisonViewer from '../components/ComparisonViewer';
import MetricsPanel from '../components/MetricsPanel';
import RainfallPanel from '../components/RainfallPanel';
import UploadSection from '../components/UploadSection';

export default function DashboardPage() {
  const [source, setSource] = useState('milton');
  const [method, setMethod] = useState('linear');
  const [unetAvailable, setUnetAvailable] = useState(null);
  const [result, setResult] = useState(null);
  const [resolution, setResolution] = useState('15min');
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/config', { signal: controller.signal })
      .then((response) => response.ok ? response.json() : {})
      .then((config) => {
        setResolution((current) => current === '15min' && config.temporal_resolution?.includes('7.5') ? '7.5min' : current);
        setUnetAvailable(config.u_net_available ?? null);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  async function run(files) {
    const started = performance.now();
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch(files ? '/interpolate' : '/generate', {
        method: 'POST',
        headers: files ? undefined : { 'Content-Type': 'application/json' },
        body: files || JSON.stringify({ resolution, source, method }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.base_image) {
        throw new Error(data.error || (response.status === 413
          ? 'The combined uploads must be under 30 MB.'
          : 'Interpolation failed. Check that the Flask backend is running on port 5000.'));
      }
      setElapsed((performance.now() - started) / 1000);
      setResult(data);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sat-workspace">
      <header className="sat-page-header">
        <h1>Satellite interpolation</h1>
      </header>
      <dl className="sat-summary" aria-label="Current run">
        <div><dt>Data source</dt><dd>{source === 'milton' ? 'Hurricane Milton' : source === 'sample' ? 'GOES-18 sample' : 'Custom upload'}</dd></div>
        <div><dt>Method</dt><dd>{method === 'u-net' ? 'U-Net' : 'Linear blend'}</dd></div>
        <div><dt>Steps</dt><dd>{resolution === '7.5min' ? 'Midpoint + quarters' : 'Midpoint'}</dd></div>
        <div><dt>Status</dt><dd><span className={`sat-run-dot${busy ? ' is-busy' : result ? ' is-done' : error ? ' is-error' : ''}`} aria-hidden="true" />{busy ? 'Generating' : result ? `Complete · ${elapsed < 1 ? Math.round(elapsed * 1000) + ' ms' : elapsed.toFixed(1) + ' s'}` : error ? 'Failed' : 'Ready'}</dd></div>
      </dl>
      <div className="sat-grid">
        <UploadSection onRun={run} busy={busy} error={error} resolution={resolution} setResolution={setResolution} source={source} setSource={setSource} method={method} setMethod={setMethod} unetAvailable={unetAvailable} />
        <div className="sat-main">
          {result ? <ComparisonViewer result={result} /> : (
            <section className="sat-panel sat-preview">
              <div className="sat-panel-header">
                <div className="sat-heading-icon"><ScanLine size={19} /></div>
                <div><h2>Observation viewer</h2><p>{busy ? 'Generating sequence' : 'Thermal infrared imagery'}</p></div>
              </div>
              {source !== 'upload' ? (
                <figure>
                  <div className="sat-preview-image">
                    <img src={source === 'milton' ? '/milton-preview.webp' : '/goes-preview.webp'}
                         alt={source === 'milton' ? 'Thermal infrared image of Hurricane Milton' : 'Thermal infrared image of cloud bands'} />
                  </div>
                  <figcaption><strong>{source === 'milton' ? 'Hurricane Milton preview' : 'GOES-18 sample preview'}</strong><span>{source === 'milton' ? 'Observed midpoint at 18:16 UTC' : 'Observed midpoint at 12:10 UTC'}</span></figcaption>
                </figure>
              ) : (
                <div className="sat-preview-placeholder">
                  <Aperture size={38} aria-hidden="true" />
                  <p>Upload both endpoint observations to generate a sequence.</p>
                </div>
              )}
            </section>
          )}
        </div>
        <MetricsPanel result={result} />
      </div>
      {result && <div className="sat-nowcast"><RainfallPanel result={result} source={source === 'milton' ? 'Hurricane Milton' : source === 'sample' ? 'GOES-18 sample' : 'Custom upload'} /></div>}
    </div>
  );
}
