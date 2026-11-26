import React, { useState } from 'react';
import Select from './ui/Select';
import { CloudRain, ImagePlus, Layers, Play, Satellite, Upload } from 'lucide-react';

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
        <div><h2 id="run-settings">Run setup</h2><p>Inputs and frame spacing</p></div>
      </div>
      <form className="sat-form" onSubmit={(event) => {
        event.preventDefault();
        onRun(sample ? undefined : new FormData(event.currentTarget));
      }}>
        <fieldset disabled={busy}>
          <legend className="sat-label">Data source</legend>
          <div className="sat-segment" aria-label="Data source">
            <button type="button" aria-pressed={milton} onClick={() => setSource('milton')}><CloudRain size={15} /> Milton</button>
            <button type="button" aria-pressed={source === 'sample'} onClick={() => setSource('sample')}><Satellite size={15} /> GOES-18</button>
            <button type="button" aria-pressed={!sample} onClick={() => { if (sample) setNames({}); setSource('upload'); }}><Upload size={15} /> Upload</button>
          </div>
          {sample ? (
            <dl className="sat-source-meta">
              <div><dt>Dataset</dt><dd>{milton ? 'Hurricane Milton' : 'GOES-18 ABI Ch. 13'}</dd></div>
              <div><dt>Sensor</dt><dd>{milton ? 'GOES-16 thermal IR' : 'GOES-18 thermal IR'}</dd></div>
              <div><dt>Grid</dt><dd>{milton ? '384 × 384 px' : '512 × 512 px'}</dd></div>
              <div><dt>Window</dt><dd>{milton ? '9 Oct 2024 · 18:01–18:31 UTC' : '1 Jan 2024 · 12:00–12:20 UTC'}</dd></div>
            </dl>
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
          <div className="sat-field">
            <span id="method-label">Interpolation method</span>
            <Select name="method" value={method} onChange={setMethod} ariaLabelledBy="method-label" options={[
              { value: 'linear', label: 'Linear blend', description: 'Pixel-wise average of the endpoints' },
              { value: 'u-net', label: 'U-Net', description: unetAvailable === false ? 'Unavailable: no compatible checkpoint loaded' : 'Experimental learned interpolation', disabled: unetAvailable === false },
            ]} />
          </div>
          <div className="sat-field">
            <span id="steps-label">Interpolation steps</span>
            <Select name="resolution" value={resolution} onChange={setResolution} ariaLabelledBy="steps-label" options={[
              { value: '15min', label: 'Midpoint', description: 'One frame between observations' },
              { value: '7.5min', label: 'Midpoint and quarters', description: 'Three frames between observations' },
            ]} />
          </div>
          <button className="sat-primary" type="submit">
            <Play size={14} fill="currentColor" aria-hidden="true" /> {busy ? 'Running simulation…' : 'Run simulation'}
          </button>
        </fieldset>
        {busy && <p className="sat-hint" role="status">Processing the satellite observations.</p>}
        {error && <p className="sat-error" role="alert">{error}</p>}
      </form>
    </section>
  );
}
