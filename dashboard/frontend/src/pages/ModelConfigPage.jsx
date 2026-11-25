import React, { useEffect, useState } from 'react';
import { LiquidCard } from '../components/ui/LiquidCard';

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
    <div className="config-page-container">
      <div className="config-page-header">
        <h2 className="config-page-title">Model configuration</h2>
        {engine && <p className="config-page-subtitle">{engine}</p>}
      </div>
      <LiquidCard index={0} className="config-card">
        <form className="grid gap-4" onSubmit={save}>
          <fieldset className="grid gap-4" disabled={saving || resolution === null}>
            <label className="grid w-fit gap-2">
              Default interpolation steps
              <select className="config-select" value={resolution ?? '15-min Interval'} onChange={(event) => setResolution(event.target.value)}>
                <option value="15-min Interval">Midpoint</option>
                <option value="7.5-min Interval">Midpoint and quarters</option>
              </select>
            </label>
            <button className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white" type="submit">Save default</button>
          </fieldset>
          {message && <p role="status">{message}</p>}
        </form>
      </LiquidCard>
    </div>
  );
}
