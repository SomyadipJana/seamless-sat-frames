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
        <table className="sat-scores">
          <thead><tr><th scope="col">Metric</th><th scope="col">{usingUnet ? 'U-Net' : 'Linear blend'}</th>{usingUnet && <th scope="col">Linear blend</th>}</tr></thead>
          <tbody>
            {rows.map(([key, title]) => (
              <tr key={key}>
                <th scope="row">{title}</th>
                <td>{scores[key] === 'Infinity' ? '?' : scores[key] ?? '—'}{key === 'psnr' && scores[key] && ' dB'}</td>
                {usingUnet && <td>{scores.baseline[key] === 'Infinity' ? '?' : scores.baseline[key] ?? '—'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
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
