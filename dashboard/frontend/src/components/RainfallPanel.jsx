import React, { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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

function niceMax(value) {
  const target = Math.max(value * 1.15, 0.5);
  const magnitude = 10 ** Math.floor(Math.log10(target));
  return [1, 2, 2.5, 5, 10].find((m) => m * magnitude >= target) * magnitude;
}

function TrendChart({ unit, data, nowMinutes, stepMinutes, percent }) {
  const peak = Math.max(...data.map((point) => point.observed ?? point.projected ?? 0));
  const top = percent ? 100 : niceMax(peak);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => +(top * f).toFixed(2));
  return (
    <figure className="rain-chart">
      <div className="rain-chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 14, bottom: 0, left: -8 }}>
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
            />
            <YAxis
              tick={{ fill: '#5f6b7e', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
              ticks={ticks}
              tickFormatter={(value) => (percent ? fixed(value, 0) + '%' : fixed(value, top < 5 ? 1 : 0))}
              domain={[0, top]}
            />
            <ReferenceLine x={nowMinutes} stroke="#8b95a5" strokeDasharray="2 3" label={{ value: 'Now', position: 'insideTopRight', fill: '#5f6b7e', fontSize: 11 }} />
            <Tooltip content={<ChartTooltip unit={unit} stepMinutes={stepMinutes} />} cursor={{ stroke: '#8b95a5', strokeWidth: 1 }} />
            <Line type="monotone" dataKey="observed" stroke={SERIES} strokeWidth={2} dot={{ r: 4, fill: SERIES, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="projected" stroke={SERIES} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 4, fill: '#fff', stroke: SERIES, strokeWidth: 2, strokeDasharray: '0' }} activeDot={{ r: 5, fill: '#fff', stroke: SERIES, strokeWidth: 2, strokeDasharray: '0' }} connectNulls={false} isAnimationActive={false} />
          </LineChart>
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
  const stats = [
    ['Rain rate', fixed(now.meanRate, 1), fixed(outlook.meanRate, 1), 'mm/h'],
    ['Raining area', fixed(now.rainArea, 0), fixed(outlook.rainArea, 0), '%'],
    [`Heavy rain ≥ ${HEAVY_RAIN_MM} mm/h`, fixed(now.heavyArea, 0), fixed(outlook.heavyArea, 0), '%'],
    accumulation != null
      ? ['Accumulated', fixed(accumulation, 1), null, `mm / ${fixed(window, 0)} min`]
      : ['Coldest cloud top', fixed(now.coldest - 273.15, 0), null, '°C'],
  ];

  return (
    <section className="sat-panel rain-panel" aria-labelledby="rain-heading">
      <div className="sat-panel-header rain-header">
        <div className="sat-heading-icon"><CloudRain size={18} /></div>
        <div><h2 id="rain-heading">Rainfall outlook</h2><p>{source} · {horizon}</p></div>
        <span className="rain-trend"><TrendIcon size={14} aria-hidden="true" />{trend}</span>
      </div>

      <dl className="rain-stats">
        {stats.map(([label, current, projectedValue, unit]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              <span className="rain-stat-now">{current}</span>
              {projectedValue != null && <span className="rain-stat-next" title="Projected"><ArrowRight size={13} aria-hidden="true" />{projectedValue}</span>}
              <small>{unit}</small>
            </dd>
          </div>
        ))}
      </dl>

      <div className="rain-body">
        <div className="rain-body-chart">
          <div className="rain-block-head">
            <strong>Mean rain rate</strong>
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
              <span className="rain-scale-bar">
                {RAIN_CLASSES.map((item) => <i key={item.label} style={{ background: item.color }} />)}
              </span>
              <span className="rain-scale-ticks">
                {RAIN_CLASSES.map((item) => <span key={item.label}>{item.min}</span>)}
                <span>mm/h</span>
              </span>
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
