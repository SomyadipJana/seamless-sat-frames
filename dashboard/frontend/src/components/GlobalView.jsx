import React, { useEffect, useState } from 'react';
import { CloudRain, ExternalLink, Globe, Radar, Radio, RefreshCw, Satellite, Waves } from 'lucide-react';
import './mosdac-feed.css';

const origin = 'https://mosdac.gov.in';
const feeds = [
  { id: 'satellite', label: 'Satellite images', icon: Satellite, product: 'INSAT-3DS · Full-disk infrared', source: '/gallery/index.html?prod=3SIMG_%27%2A_L1B_STD_IR1_V%27%2A.jpg', maxAge: 120 },
  { id: 'radar', label: 'Radar', icon: Radar, product: 'DWR RCTLS · Maximum reflectivity', source: '/gallery/index.html?ds=dwr', maxAge: 60 },
  { id: 'weather', label: 'Weather', icon: CloudRain, product: 'WRF · Ahmedabad temperature forecast', source: '/gallery/index.html?ds=weather' },
  { id: 'ocean', label: 'Ocean state', icon: Waves, product: 'Regional · Significant wave height forecast', source: '/gallery/index.html?ds=ocean' },
  { id: 'live', label: 'Live overview', icon: Radio, product: 'All products', source: '/live/lite/index.html' },
];
const formatTime = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
});
const formattedIST = (value) => formatTime.format(new Date(value)) + ' IST';

function defaultFrame(frames, feed) {
  if (!frames.length) return 0;
  if (feed.maxAge) return frames.length - 1;
  if (feed.id === 'ocean') {
    const next = frames.findIndex((frame) => Date.parse(frame.timestamp) >= Date.now());
    return next < 0 ? frames.length - 1 : next;
  }
  return 0;
}

function Preview({ feed }) {
  const [data, setData] = useState(null);
  const [selection, setSelection] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [failedImage, setFailedImage] = useState(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function refresh() {
      setBusy(true);
      setError('');
      try {
        const response = await fetch('/feeds/mosdac/' + feed.id, { signal: controller.signal, cache: 'no-store' });
        const listing = await response.json();
        if (!response.ok) throw new Error(listing.error);
        setData(listing);
        setFailedImage(null);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message || 'MOSDAC feed unavailable.');
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }

    refresh();
    const timer = window.setInterval(refresh, 5 * 60_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [feed.id, revision]);

  const frames = data?.frames ?? [];
  const chosen = frames.findIndex((frame) => frame.url === selection);
  const index = chosen < 0 ? defaultFrame(frames, feed) : chosen;
  const frame = frames[index];
  const latest = feed.maxAge && frames.at(-1);
  const age = latest ? (Date.parse(data.checked_at) - Date.parse(latest.timestamp)) / 60_000 : null;

  return (
    <>
      <div className="mosdac-toolbar">
        <div>
          <h3>{feed.product}</h3>
          <p>{frame?.timestamp ? (feed.maxAge ? 'Observed ' : 'Forecast valid ') + formattedIST(frame.timestamp)
            : frame?.run_date ? 'Model run ' + frame.run_date + ' · lead ' + frame.lead_hours + ' h'
              : 'Source timestamps appear when imagery is available.'}</p>
        </div>
        <button type="button" className="sat-secondary" disabled={busy} onClick={() => { setFailedImage(null); setRevision((value) => value + 1); }}>
          <RefreshCw size={16} /> {busy ? 'Checking…' : 'Refresh'}
        </button>
      </div>
      <div className="mosdac-canvas">
        {frame && failedImage !== frame.url ? (
          <img key={frame.url} src={frame.url} alt={feed.product} onError={() => setFailedImage(frame.url)} />
        ) : (
          <p role="status">{busy && !data ? 'Checking the MOSDAC feed…' : failedImage ? 'MOSDAC listed this image, but it could not be loaded.' : error ? 'The source feed is currently unavailable.' : 'MOSDAC returned no images for this product.'}</p>
        )}
      </div>
      <div className="mosdac-timeline">
        {frames.length > 1 && (
          <label>
            <span>Source frames <strong>{index + 1} / {frames.length}</strong></span>
            <input aria-label="Source frame" type="range" min="0" max={frames.length - 1} value={index} onChange={(event) => setSelection(frames[Number(event.target.value)].url)} />
          </label>
        )}
        <p aria-live="polite">
          {error ? (data ? 'Refresh failed. Showing previously retrieved images.' : error)
            : data ? 'Checked ' + formattedIST(data.checked_at) + ' · Refreshes every 5 minutes' : ''}
          {age > feed.maxAge && <span className="mosdac-delay"> Latest observation is delayed.</span>}
        </p>
      </div>
    </>
  );
}

function LiveTile({ feed }) {
  const [frame, setFrame] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch('/feeds/mosdac/' + feed.id, { signal: controller.signal, cache: 'no-store' });
        const listing = await response.json();
        if (!response.ok) throw new Error(listing.error);
        const frames = listing.frames ?? [];
        setFrame(frames[defaultFrame(frames, feed)] ?? null);
        setState(frames.length ? 'ready' : 'empty');
      } catch {
        if (!controller.signal.aborted) setState((current) => (current === 'ready' ? current : 'error'));
      }
    }
    refresh();
    const timer = window.setInterval(refresh, 5 * 60_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [feed]);

  const Icon = feed.icon;
  const time = frame?.timestamp ? formattedIST(frame.timestamp)
    : frame?.run_date ? 'Run ' + frame.run_date + ' · +' + frame.lead_hours + ' h' : null;
  return (
    <article className="live-tile">
      <header>
        <span className="live-tile-title"><Icon size={15} aria-hidden="true" />{feed.label}</span>
        {state === 'ready' && <span className="live-dot" aria-label="Live" />}
      </header>
      <div className="live-tile-image">
        {state === 'ready' && frame
          ? <img src={frame.url} alt={feed.product} loading="lazy" onError={() => setState('error')} />
          : <p role="status">{state === 'loading' ? 'Loading…' : state === 'empty' ? 'No images published' : 'Feed unavailable'}</p>}
      </div>
      <footer>
        <span>{feed.product}</span>
        <span className="tabular-nums">{time ?? '—'}</span>
      </footer>
    </article>
  );
}

function LiveBoard() {
  const tiles = feeds.filter((item) => item.id !== 'live');
  return (
    <div className="live-board">
      <p className="live-board-note">Latest frame from each MOSDAC product, refreshed every 5 minutes.</p>
      <div className="live-grid">
        {tiles.map((item) => <LiveTile key={item.id} feed={item} />)}
      </div>
    </div>
  );
}

export default function GlobalView() {
  const [feed, setFeed] = useState(feeds[0]);
  return (
    <section className="sat-panel mosdac-panel">
      <div className="sat-panel-header mosdac-header">
        <div className="sat-heading-icon"><Globe size={19} /></div>
        <div><h2>Official data feeds</h2><p>ISRO Space Applications Centre · MOSDAC</p></div>
        <a className="sat-secondary" href={origin + feed.source} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={15} /> Open source
        </a>
      </div>
      <div className="mosdac-tabs" role="group" aria-label="Data feed">
        {feeds.map(({ icon: Icon, ...item }) => (
          <button key={item.id} type="button" aria-pressed={feed.id === item.id} onClick={() => setFeed(item)}>
            <Icon size={16} /> {item.label}
          </button>
        ))}
      </div>
      {feed.id === 'live' ? <LiveBoard /> : <Preview key={feed.id} feed={feed} />}
    </section>
  );
}
