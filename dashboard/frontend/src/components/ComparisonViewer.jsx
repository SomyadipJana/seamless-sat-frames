import React, { useEffect, useRef, useState } from 'react';
import Select from './ui/Select';
import { ChevronsLeftRight, Download, Pause, Play, ScanLine, SkipBack, SkipForward } from 'lucide-react';

const formatMinutes = new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 });

export default function ComparisonViewer({ result }) {
  const [frameIndex, setFrameIndex] = useState(result.extra_frames.length ? 2 : 1);
  const [layer, setLayer] = useState('sequence');
  const [split, setSplit] = useState(50);
  const [playing, setPlaying] = useState(false);
  const [compareEnabled, setCompareEnabled] = useState(true);
  const [firstQuarter, thirdQuarter] = result.extra_frames;
  const sequence = [
    ['First observation', result.start_image],
    ...(firstQuarter ? [['First quarter', firstQuarter]] : []),
    ['Predicted midpoint', result.base_image],
    ...(thirdQuarter ? [['Third quarter', thirdQuarter]] : []),
    ['Last observation', result.end_image],
  ];
  const size = result.frame_size;
  const resized = size && (size.width !== size.input_width || size.height !== size.input_height);
  const midpointIndex = firstQuarter ? 2 : 1;
  const lastIndex = sequence.length - 1;
  const views = {
    ...(result.endpoint_change_image && { motion: ['Change between observations', result.endpoint_change_image] }),
    ...(result.engine === 'u-net' && {
      baseline: ['Linear-blend midpoint', result.baseline_image],
      difference: ['Difference from linear blend', result.differential_image],
    }),
    ...(result.observed_error_image && { error: ['Absolute error against observed midpoint', result.observed_error_image] }),
    edges: ['Predicted edges (Sobel)', result.sobel_image],
  };

  useEffect(() => {
    if (!playing) return;
    const ticker = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % (lastIndex + 1));
    }, 850);
    return () => window.clearInterval(ticker);
  }, [playing, lastIndex]);

  const [title, image] = layer === 'sequence' ? sequence[frameIndex] : views[layer];
  const canCompare = layer === 'sequence' && frameIndex === midpointIndex && result.ground_truth;
  const compare = canCompare && compareEnabled && !playing;
  const offset = result.interval_minutes == null
    ? 'Frame ' + (frameIndex + 1) + ' of ' + sequence.length
    : '+' + formatMinutes.format(result.interval_minutes * frameIndex) + ' min';

  const frameRef = useRef(null);

  function splitFromPointer(event) {
    const box = frameRef.current?.getBoundingClientRect();
    if (!box) return;
    setSplit(Math.min(100, Math.max(0, ((event.clientX - box.left) / box.width) * 100)));
  }

  function startDrag(event) {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    splitFromPointer(event);
  }

  function splitKey(event) {
    const delta = { ArrowLeft: -2, ArrowRight: 2, PageDown: -10, PageUp: 10 }[event.key];
    if (delta != null) { event.preventDefault(); setSplit((value) => Math.min(100, Math.max(0, value + delta))); }
    else if (event.key === 'Home') { event.preventDefault(); setSplit(0); }
    else if (event.key === 'End') { event.preventDefault(); setSplit(100); }
  }

  function jump(index) {
    setPlaying(false);
    setFrameIndex(index);
  }

  return (
    <section className="sat-panel sat-result" aria-labelledby="observation-heading">
      <div className="sat-panel-header sat-result-header">
        <div className="sat-heading-icon"><ScanLine size={19} /></div>
        <div><h2 id="observation-heading">Observation viewer</h2><p>{result.source}</p></div>
        <div className="sat-exports">
          <a className="sat-secondary" href={image} download={title.toLowerCase().replace(/[^a-z]+/g, '-') + '.png'}>
            <Download size={14} /> PNG
          </a>
          <a className="sat-secondary" href="/download_h5">
            <Download size={14} /> HDF5
          </a>
        </div>
      </div>
      <div className="sat-result-body">
        <div className="sat-result-toolbar">
          <div className="sat-field">
            <span id="layer-label">Analysis layer</span>
            <Select value={layer} ariaLabelledBy="layer-label" onChange={(next) => {
              setPlaying(false);
              setLayer(next);
            }} options={[
              { value: 'sequence', label: 'Satellite sequence' },
              ...Object.entries(views).map(([key, [label]]) => ({ value: key, label })),
            ]} />
          </div>
          {canCompare && !playing && <label className="sat-compare-control">
            <input type="checkbox" checked={compareEnabled} onChange={(event) => setCompareEnabled(event.target.checked)} />
            Compare observed midpoint
          </label>}
        </div>
        {(resized || result.identical_endpoints) && (
          <div className="sat-result-notes" role="status">
            {resized && <p>{size.input_width} × {size.input_height} input → processed at {size.width} × {size.height}.</p>}
            {result.identical_endpoints && <p>Both endpoints have the same image content. Use observations from different times to see motion.</p>}
          </div>
        )}
        <figure className="sat-result-figure">
          <div className="sat-preview-image sat-result-stage">
            <div className={`sat-frame${compare ? ' is-comparing' : ''}`} ref={frameRef} onPointerDown={compare ? startDrag : undefined} onPointerMove={compare ? (event) => { if (event.buttons) splitFromPointer(event); } : undefined}>
              <img src={image} alt={title} />
              {compare && <img
                className="sat-overlay"
                src={result.ground_truth}
                alt="Observed midpoint"
                style={{ clipPath: 'inset(0 ' + (100 - split) + '% 0 0)' }}
              />}
              {compare && (
                <>
                  <span className="sat-split-tag sat-split-tag-left">Observed</span>
                  <span className="sat-split-tag sat-split-tag-right">Predicted</span>
                  <div className="sat-split-line" style={{ left: split + '%' }}>
                    <button
                      type="button"
                      className="sat-split-handle"
                      role="slider"
                      aria-label="Observed versus predicted split"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(split)}
                      aria-valuetext={Math.round(split) + '% observed'}
                      onKeyDown={splitKey}
                    >
                      <ChevronsLeftRight size={15} aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <figcaption>
            <span>{title}</span>
            {layer === 'sequence' && <span className="tabular-nums">{offset}</span>}
          </figcaption>
        </figure>
        {layer === 'sequence' && (
          <div className="sat-timeline">
            <div className="sat-transport">
              <button type="button" className="sat-transport-btn" aria-label="Previous frame" disabled={frameIndex === 0} onClick={() => jump(frameIndex - 1)}><SkipBack size={16} /></button>
              <button type="button" className="sat-transport-btn sat-play" aria-label={playing ? 'Pause playback' : 'Play sequence'} onClick={() => setPlaying(!playing)}>
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button type="button" className="sat-transport-btn" aria-label="Next frame" disabled={frameIndex === lastIndex} onClick={() => jump(frameIndex + 1)}><SkipForward size={16} /></button>
              <input className="sat-scrubber" aria-label="Sequence frame" aria-valuetext={title + ', ' + offset} type="range" min="0" max={lastIndex} value={frameIndex} onChange={(event) => jump(Number(event.target.value))} />
            </div>
            <div className="sat-timeline-labels"><span>First observation</span><span>Last observation</span></div>
          </div>
        )}
      </div>
    </section>
  );
}
