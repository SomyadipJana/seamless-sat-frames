import React, { useState } from 'react';
import { CloudRain, Database, ImagePlus, Layers, Play, Satellite, Upload } from 'lucide-react';

const frameFields = [
  ['frame1', 'First observation'],
  ['frame3', 'Last observation'],
  ['midpoint', 'Observed midpoint'],
];

export default function UploadSection({ onRun, busy, error, resolution, setResolution, source, setSource, method, setMethod, unetAvailable }) {
  const [names, setNames] = useState({});
  const sample = source !== 'upload';
  const milton = source === 'milton';

  return (
    <section className="sat-panel sat-setup" aria-labelledby="run-settings">
      <div className="sat-panel-header">
        <div className="sat-heading-icon"><Layers size={19} /></div>
        <div><h2 id="run-settings">Run setup</h2><p>Choose inputs and frame spacing.</p></div>
      </div>
      <form className="sat-form" onSubmit={(event) => {
        event.preventDefault();
        onRun(sample ? undefined : new FormData(event.currentTarget));
      }}>
        <fieldset disabled={busy}>
          <legend className="sat-label">Data source</legend>
          <div className="sat-segment" aria-label="Data source">
            <button type="button" aria-pressed={milton} onClick={() => setSource('milton')}><CloudRain size={16} /> Milton</button>
            <button type="button" aria-pressed={source === 'sample'} onClick={() => setSource('sample')}><Satellite size={16} /> GOES-18</button>
            <button type="button" aria-pressed={!sample} onClick={() => { if (sample) setNames({}); setSource('upload'); }}><Upload size={16} /> Upload</button>
          </div>
          {sample ? (
            <div className="sat-source">
              <Database size={18} />
              <div>
                <strong>{milton ? 'Hurricane Milton' : 'GOES-18 ABI Channel 13'}</strong>
                <p>{milton ? 'GOES-16 thermal infrared, 384 ? 384 px' : 'Thermal infrared, 512 ? 512 px'}</p>
                <p>{milton ? '9 Oct 2024, 18:01?18:31 UTC' : '1 Jan 2024, 12:00?12:20 UTC'}</p>
              </div>
            </div>
          ) : (
            <div className="sat-uploads">
              <p className="sat-hint">Use aligned thermal infrared PNG or JPEG frames from different times on the same grid and intensity scale. Large frames are scaled together.</p>
              {frameFields.map(([name, label]) => (
                <label className="sat-file" key={name}>
                  <ImagePlus size={19} />
                  <span><strong>{label}{name === 'midpoint' && <small>Optional</small>}</strong><span>{names[name] || 'Choose PNG or JPEG'}</span></span>
                  <input type="file" name={name} accept=".png,.jpg,.jpeg" required={name !== 'midpoint'} onChange={(event) => setNames({ ...names, [name]: event.target.files[0]?.name })} />
                </label>
              ))}
              {names.frame1 && names.frame1 === names.frame3 && (
                <p className="sat-hint" role="status">Both endpoint filenames match. Check that the last file comes from a later observation.</p>
              )}
              <label className="sat-field">
                <span>Endpoint gap <small>minutes</small></span>
                <input type="number" name="endpoint_gap" defaultValue="30" min="0.1" step="any" required />
              </label>
            </div>
          )}
          <label className="sat-field">
            <span>Interpolation method</span>
            <select name="method" value={method} onChange={(event) => setMethod(event.target.value)}>
              <option value="linear">Linear blend</option>
              <option value="u-net" disabled={unetAvailable === false}>U-Net (experimental)</option>
            </select>
          </label>
          <label className="sat-field">
            <span>Interpolation steps</span>
            <select name="resolution" value={resolution} onChange={(event) => setResolution(event.target.value)}>
              <option value="15min">Midpoint</option>
              <option value="7.5min">Midpoint and quarters</option>
            </select>
          </label>
          <button className="sat-primary" type="submit">
            <Play size={17} fill="currentColor" aria-hidden="true" /> {busy ? 'Generating frames…' : sample ? (milton ? 'Run Hurricane Milton' : 'Run GOES sample') : 'Interpolate frames'}
          </button>
        </fieldset>
        {busy && <p className="sat-hint" role="status">Processing the satellite observations.</p>}
        {error && <p className="sat-error" role="alert">{error}</p>}
      </form>
    </section>
  );
}
