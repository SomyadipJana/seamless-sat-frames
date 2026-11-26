import React, { useEffect, useState } from 'react';
import { Cpu, SlidersHorizontal } from 'lucide-react';
import Select from '../components/ui/Select';

export default function ModelConfigPage() {
  const [resolution, setResolution] = useState(null);
  const [engine, setEngine] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/config', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Could not load settings.');
        return response.json();
      })
      .then((config) => {
        setResolution(config.temporal_resolution);
        setEngine(config.u_net_available ? 'Linear blend default. U-Net available in Run setup.' : 'Linear blend default.');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setMessage('Could not load settings. Check the Flask backend.');
      });
    return () => controller.abort();
  }, []);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temporal_resolution: resolution }),
      });
      if (!response.ok) throw new Error('Could not save settings.');
      setMessage('Default saved.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sat-workspace">
      <header className="sat-page-header">
        <h1>Model configuration</h1>
      </header>
      <div className="sat-config-grid">
        <section className="sat-panel" aria-labelledby="defaults-heading">
          <div className="sat-panel-header">
            <div className="sat-heading-icon"><SlidersHorizontal size={18} /></div>
            <div><h2 id="defaults-heading">Run defaults</h2><p>Stored on the interpolation server.</p></div>
          </div>
          <form className="sat-form" onSubmit={save}>
            <fieldset disabled={saving || resolution === null}>
              <div className="sat-field">
                <span id="default-steps-label">Default interpolation steps</span>
                <Select value={resolution ?? '15-min Interval'} onChange={setResolution} ariaLabelledBy="default-steps-label" options={[
                  { value: '15-min Interval', label: 'Midpoint', description: 'One frame between observations' },
                  { value: '7.5-min Interval', label: 'Midpoint and quarters', description: 'Three frames between observations' },
                ]} />
              </div>
              <button className="sat-primary sat-fit" type="submit">{saving ? 'Saving…' : 'Save default'}</button>
            </fieldset>
            {message && <p className="sat-hint" role="status">{message}</p>}
          </form>
        </section>
        <section className="sat-panel" aria-labelledby="engine-heading">
          <div className="sat-panel-header">
            <div className="sat-heading-icon"><Cpu size={18} /></div>
            <div><h2 id="engine-heading">Interpolation engines</h2><p>{engine || 'Selected per run in Run setup.'}</p></div>
          </div>
          <ul className="sat-engine-list">
            <li><strong>Linear blend</strong><span>Pixel-wise temporal average of the endpoint observations. Always available.</span></li>
            <li><strong>U-Net <small>Experimental</small></strong><span>Learned midpoint prediction from the trained checkpoint, scored against the linear blend.</span></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
