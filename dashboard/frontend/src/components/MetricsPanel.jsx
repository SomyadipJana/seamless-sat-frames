import React from 'react';
import { BarChart3 } from 'lucide-react';

const rows = [
  ['ssim', 'SSIM'],
  ['psnr', 'PSNR'],
  ['mse', 'MSE'],
  ['fsim', 'FSIM'],
];

export default function MetricsPanel({ result }) {
  const scores = result?.metrics;
  const usingUnet = result?.engine === 'u-net';
  return (
    <section className="sat-panel sat-evaluation" aria-labelledby="evaluation-heading">
      <div className="sat-panel-header">
        <div className="sat-heading-icon"><BarChart3 size={19} /></div>
        <div>
          <h2 id="evaluation-heading">Midpoint evaluation</h2>
          <p>{result ? (result.engine === 'u-net' ? (result.model_profile || 'Trained U-Net') : 'Linear blend') : 'Prediction vs. linear blend'}</p>
        </div>
      </div>
      {scores ? (
        <dl className="sat-kpis">
          {rows.map(([key, title]) => (
            <div className="sat-kpi" key={key}>
              <dt>{title}</dt>
              <dd>
                {scores[key] === 'Infinity' ? '∞' : scores[key] ?? '—'}
                {key === 'psnr' && scores[key] && <small> dB</small>}
              </dd>
              {usingUnet && <dd className="sat-kpi-baseline">Linear blend {scores.baseline[key] === 'Infinity' ? '∞' : scores.baseline[key] ?? '—'}</dd>}
            </div>
          ))}
        </dl>
      ) : (
        <p className="sat-eval-empty">{result
          ? 'Add an observed midpoint to score this prediction.'
          : 'Metrics appear after a run with an observed midpoint.'}</p>
      )}
      {result?.mean_endpoint_change != null && (
        <div className="sat-endpoint">
          <span>Mean endpoint change</span>
          <strong>{result.mean_endpoint_change.toFixed(2)} / 255</strong>
        </div>
      )}
    </section>
  );
}
