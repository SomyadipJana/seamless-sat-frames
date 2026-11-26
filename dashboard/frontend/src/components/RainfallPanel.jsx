import React, { useEffect, useMemo, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowRight, ArrowUpRight, CloudRain, Info } from 'lucide-react';
import { analyseSequence, HEAVY_RAIN_MM, RAIN_CLASSES, renderRainMap } from '../lib/rainfall';

const SERIES = '#257de0';
const fixed = (value, digits = 1) => (Number.isFinite(value) ? value.toFixed(digits) : '—');

function timeLabel(minutes, stepMinutes) {
  if (stepMinutes == null) return 'Step ' + fixed(minutes, 0);
  return (minutes === 0 ? 'T0' : 'T+' + fixed(minutes, minutes % 1 ? 1 : 0)) + ' min';
}

function ChartTooltip({ active, payload, unit, stepMinutes }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const value = point.observed ?? point.projected;
  return (
    <div className="rain-tooltip">
      <span>{timeLabel(point.minutes, stepMinutes)} · {point.kind}</span>
      <strong>{fixed(value, 2)} {unit}</strong>
    </div>
  );
}

function niceStep(raw) {
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].find((m) => m * magnitude >= raw) * magnitude;
}

// Axis zoomed to the data so real change in the frames is visible.
function axisFor(values) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = Math.max((hi - lo) * 0.35, hi * 0.06, 0.2);
  const step = niceStep((hi - lo + 2 * pad) / 4);
  const min = Math.max(0, Math.floor((lo - pad) / step) * step);
  const max = Math.ceil((hi + pad) / step) * step;
  const ticks = [];
  for (let t = min; t <= max + step / 2; t += step) ticks.push(+t.toFixed(4));
  return { min, max, ticks, digits: step < 1 ? 1 : 0 };
}

function PointLabel({ x, y, value, index, target, tone }) {
  if (index !== target || value == null) return null;
  return (
    <g>
      <rect x={x - 22} y={y - 30} width={44} height={20} rx={5} fill={tone === 'solid' ? '#18191c' : '#fff'} stroke={tone === 'solid' ? 'none' : '#257de0'} />
      <text x={x} y={y - 16} textAnchor="middle" fontSize={11} fontWeight={600} fill={tone === 'solid' ? '#fff' : '#18191c'}>{fixed(value, 1)}</text>
    </g>
  );
}

function TrendChart({ unit, data, nowMinutes, stepMinutes }) {
  const values = data.flatMap((point) => [point.observed, point.projected]).filter((v) => v != null);
  const axis = axisFor(values);
  const lastObserved = data.findLastIndex((point) => point.observed != null);
  const lastIndex = data.length - 1;
  return (
    <figure className="rain-chart">
      <div className="rain-chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 40, right: 38, bottom: 4, left: -6 }}>
            <defs>
              <linearGradient id="rain-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES} stopOpacity={0.16} />
                <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#eceef2" vertical={false} />
            <XAxis
              dataKey="minutes"
              type="number"
              domain={['dataMin', 'dataMax']}
              ticks={data.map((point) => point.minutes)}
              tickFormatter={(value) => timeLabel(value, stepMinutes).replace(' min', 'm')}
              tick={{ fill: '#5f6b7e', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#d6dae1' }}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              tick={{ fill: '#5f6b7e', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
              ticks={axis.ticks}
              domain={[axis.min, axis.max]}
              tickFormatter={(value) => fixed(value, axis.digits)}
            />
            <ReferenceArea x1={nowMinutes} x2={data[lastIndex].minutes} fill="#f4f5f7" fillOpacity={1} ifOverflow="extendDomain"
              label={{ value: 'PROJECTION', position: 'insideTopRight', fill: '#8b95a5', fontSize: 10, fontWeight: 600, offset: 8 }} />
            <ReferenceLine x={nowMinutes} stroke="#8b95a5" strokeDasharray="3 3"
              label={{ value: 'NOW', position: 'top', fill: '#5f6b7e', fontSize: 10, fontWeight: 600, offset: 8 }} />
            <Tooltip content={<ChartTooltip unit={unit} stepMinutes={stepMinutes} />} cursor={{ stroke: '#8b95a5', strokeWidth: 1 }} />
            <Area type="linear" dataKey="observed" stroke="none" fill="url(#rain-fill)" baseValue={axis.min} isAnimationActive={false} activeDot={false} tooltipType="none" />
            <Line type="linear" dataKey="observed" stroke={SERIES} strokeWidth={2} dot={{ r: 4, fill: SERIES, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} connectNulls={false} isAnimationActive={false}
              label={(props) => <PointLabel {...props} target={lastObserved} tone="solid" />} />
            <Line type="linear" dataKey="projected" stroke={SERIES} strokeWidth={2} strokeDasharray="5 4"
              dot={({ cx, cy, index }) => (index <= lastObserved || cx == null
                ? <g key={index} />
                : <circle key={index} cx={cx} cy={cy} r={4} fill="#fff" stroke={SERIES} strokeWidth={2} />)} activeDot={{ r: 5, fill: '#fff', stroke: SERIES, strokeWidth: 2, strokeDasharray: '0' }} connectNulls={false} isAnimationActive={false}
              label={(props) => <PointLabel {...props} target={lastIndex} tone="outline" />} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

export default function RainfallPanel({ result, source }) {
  const [analysis, setAnalysis] = useState(null);
  const [failure, setFailure] = useState('');
  const [mapKey, setMapKey] = useState('now');

  useEffect(() => {
    let cancelled = false;
    analyseSequence(result)
      .then((value) => { if (!cancelled) { setAnalysis(value); setFailure(''); setMapKey('now'); } })
      .catch((error) => { if (!cancelled) setFailure(error.message); });
    return () => { cancelled = true; };
  }, [result]);

  const mapFrames = useMemo(() => {
    if (!analysis) return [];
    const { observed, projected, stepMinutes, window } = analysis;
    const ahead = (frame) => (stepMinutes == null ? 'Next' : `+${fixed(frame.minutes - window, 0)} min`);
    return [
      { key: 'now', label: 'Now', frame: observed.at(-1) },
      { key: 'half', label: ahead(projected[0]), frame: projected[0] },
      { key: 'outlook', label: ahead(projected[1]), frame: projected[1] },
    ];
  }, [analysis]);

  const selected = mapFrames.find((item) => item.key === mapKey) ?? mapFrames.at(-1);
  const mapImage = useMemo(
    () => (selected && analysis ? renderRainMap(selected.frame.field, analysis.width, analysis.height) : null),
    [selected, analysis],
  );

  if (failure) {
    return <section className="sat-panel rain-panel"><p className="sat-eval-empty">{failure}</p></section>;
  }
  if (!analysis) {
    return (
      <section className="sat-panel rain-panel" aria-busy="true">
        <div className="sat-panel-header">
          <div className="sat-heading-icon"><CloudRain size={18} /></div>
          <div><h2>Rainfall nowcast</h2><p>Analysing the sequence…</p></div>
        </div>
        <div className="rain-skeleton" />
      </section>
    );
  }

  const { observed, projected, stepMinutes, window, trend, accumulation, outlook } = analysis;
  const now = observed.at(-1);
  const series = [
    ...observed.map((point, index) => ({
      minutes: point.minutes, kind: point.kind, observed: point.meanRate,
      projected: index === observed.length - 1 ? point.meanRate : null,
    })),
    ...projected.map((point) => ({ minutes: point.minutes, kind: point.kind, observed: null, projected: point.meanRate })),
  ];
  const TrendIcon = trend === 'Intensifying' ? ArrowUpRight : trend === 'Weakening' ? ArrowDownRight : ArrowRight;
  const horizon = stepMinutes != null ? `next ${fixed(window, 0)} min` : 'next window';
  const aheadLabel = stepMinutes != null ? `+${fixed(window, 0)} min` : 'Next';
  const stats = [
    { label: 'Rain rate', now: now.meanRate, next: outlook.meanRate, unit: 'mm/h', digits: 1 },
    { label: 'Raining area', now: now.rainArea, next: outlook.rainArea, unit: '%', digits: 0 },
    { label: `Heavy rain ≥ ${HEAVY_RAIN_MM} mm/h`, now: now.heavyArea, next: outlook.heavyArea, unit: '%', digits: 0 },
    accumulation != null
      ? { label: 'Accumulated', now: accumulation, unit: `mm / ${fixed(window, 0)} min`, digits: 1 }
      : { label: 'Coldest cloud top', now: now.coldest - 273.15, unit: '°C', digits: 0 },
  ];

  return (
    <section className="sat-panel rain-panel" aria-labelledby="rain-heading">
      <div className="sat-panel-header rain-header">
        <div className="sat-heading-icon"><CloudRain size={18} /></div>
        <div><h2 id="rain-heading">Rainfall outlook</h2><p>{source} · {horizon}</p></div>
        <span className="rain-trend"><TrendIcon size={14} aria-hidden="true" />{trend}</span>
      </div>

      <dl className="rain-stats">
        {stats.map((stat) => {
          const delta = stat.next != null && stat.now > 0.05 ? ((stat.next - stat.now) / stat.now) * 100 : null;
          return (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd className="rain-stat-now">{fixed(stat.now, stat.digits)}<small>{stat.unit}</small></dd>
              <dd className="rain-stat-next">
                {stat.next != null ? (
                  <>
                    <span>{aheadLabel}</span>
                    <strong>{fixed(stat.next, stat.digits)}</strong>
                    {delta != null && <em>{delta >= 0 ? '+' : '−'}{fixed(Math.abs(delta), 0)}%</em>}
                  </>
                ) : <span>Observed window</span>}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="rain-body">
        <div className="rain-body-chart">
          <div className="rain-block-head">
            <strong>Mean rain rate <span className="rain-unit">mm/h</span></strong>
            <span className="rain-chart-key">
              <span><i className="rain-key-solid" aria-hidden="true" />Observed</span>
              <span><i className="rain-key-dashed" aria-hidden="true" />Projected</span>
            </span>
          </div>
          <TrendChart unit="mm/h" data={series} nowMinutes={now.minutes} stepMinutes={stepMinutes} />
        </div>

        <div className="rain-body-map">
          <div className="rain-block-head">
            <strong>Rain-rate map</strong>
            <div className="rain-tabs" role="group" aria-label="Rain map time">
              {mapFrames.map((item) => (
                <button key={item.key} type="button" aria-pressed={item.key === selected?.key} onClick={() => setMapKey(item.key)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <figure className="rain-map-figure">
            {mapImage && <img src={mapImage} alt={`Estimated rain rate, ${selected.label}`} />}
            <figcaption className="rain-scale">
              <span className="rain-scale-track">
                <span className="rain-scale-bar">
                  {RAIN_CLASSES.map((item) => <i key={item.label} style={{ background: item.color }} />)}
                </span>
                <span className="rain-scale-ticks">
                  {RAIN_CLASSES.map((item, index) => (
                    <span key={item.label} style={{ left: `${(index / RAIN_CLASSES.length) * 100}%` }}>{item.min}</span>
                  ))}
                </span>
              </span>
              <span className="rain-scale-unit">mm/h</span>
            </figcaption>
          </figure>
        </div>
      </div>

      <p className="rain-method">
        <Info size={13} aria-hidden="true" />
        <span>
          Infrared estimate (NOAA Auto-Estimator); projection extrapolates the cloud-top trend without motion. Indicative only.
          {source === 'Custom upload' && ' Uploads assumed on the 180–330 K sample scale.'}
        </span>
      </p>
    </section>
  );
}
