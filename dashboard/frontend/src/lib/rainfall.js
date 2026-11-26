// Satellite rainfall estimate and short-range outlook from thermal infrared frames.
//
// The backend writes every frame on one brightness-temperature scale
// (preprocess.py): pixel = (T - 180 K) / (330 K - 180 K) * 255.
// Rain rate follows the NOAA Auto-Estimator power law
// (Vicente, Scofield & Menzel 1998): R = 1.1183e11 · exp(-3.6382e-2 · T^1.2) mm/h,
// capped at 72 mm/h, with pixels warmer than 240 K treated as rain-free.
// The outlook extrapolates each pixel's observed temperature trend; it does not
// model cloud motion, so it is a trend nowcast, not a forecast.

export const T_MIN = 180;
export const T_MAX = 330;
export const RAIN_THRESHOLD_K = 240;
export const DEEP_CONVECTION_K = 220;
export const HEAVY_RAIN_MM = 10;

export const RAIN_CLASSES = [
  { min: 0.5, label: '0.5–2', color: '#9dc8f7' },
  { min: 2, label: '2–5', color: '#519ced' },
  { min: 5, label: '5–10', color: '#257de0' },
  { min: 10, label: '10–25', color: '#1b64be' },
  { min: 25, label: '≥ 25', color: '#0e3d7e' },
];

export function rainRate(kelvin) {
  if (kelvin > RAIN_THRESHOLD_K) return 0;
  return Math.min(72, 1.1183e11 * Math.exp(-3.6382e-2 * kelvin ** 1.2));
}

// Precompute the rate for each 8-bit level once.
const RATE_BY_LEVEL = Float32Array.from({ length: 256 }, (_, v) => rainRate(T_MIN + (v * (T_MAX - T_MIN)) / 255));

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not decode a satellite frame.'));
    image.src = src;
  });
}

async function decodeKelvin(src) {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const kelvin = new Float32Array(canvas.width * canvas.height);
  for (let i = 0; i < kelvin.length; i += 1) kelvin[i] = T_MIN + (data[i * 4] * (T_MAX - T_MIN)) / 255;
  return { kelvin, width: canvas.width, height: canvas.height };
}

function rateOf(kelvin) {
  const level = Math.round(((kelvin - T_MIN) / (T_MAX - T_MIN)) * 255);
  return RATE_BY_LEVEL[Math.min(255, Math.max(0, level))];
}

function summarise(kelvin) {
  let rainy = 0;
  const classCounts = new Array(RAIN_CLASSES.length).fill(0);
  let heavy = 0;
  let deep = 0;
  let total = 0;
  let peak = 0;
  let coldest = Infinity;
  for (let i = 0; i < kelvin.length; i += 1) {
    const t = kelvin[i];
    const r = rateOf(t);
    total += r;
    if (r >= 0.5) rainy += 1;
    for (let c = RAIN_CLASSES.length - 1; c >= 0; c -= 1) {
      if (r >= RAIN_CLASSES[c].min) { classCounts[c] += 1; break; }
    }
    if (r >= HEAVY_RAIN_MM) heavy += 1;
    if (t < DEEP_CONVECTION_K) deep += 1;
    if (r > peak) peak = r;
    if (t < coldest) coldest = t;
  }
  const n = kelvin.length;
  return {
    meanRate: total / n,
    rainArea: (rainy / n) * 100,
    heavyArea: (heavy / n) * 100,
    deepConvection: (deep / n) * 100,
    conditionalRate: rainy ? total / rainy : 0,
    peakRate: peak,
    coldest,
    classShares: classCounts.map((count) => (count / n) * 100),
  };
}

// Box-blur a field (separable, edge-clamped) so the extrapolated trend reflects
// mesoscale cloud evolution rather than pixel noise, which the convex rain-rate
// relation would otherwise turn into a spurious rise in projected rainfall.
function smooth(field, width, height, radius) {
  const pass = (input, horizontal) => {
    const out = new Float32Array(input.length);
    const span = 2 * radius + 1;
    const lines = horizontal ? height : width;
    const length = horizontal ? width : height;
    for (let line = 0; line < lines; line += 1) {
      for (let pos = 0; pos < length; pos += 1) {
        let sum = 0;
        for (let k = -radius; k <= radius; k += 1) {
          const c = Math.min(length - 1, Math.max(0, pos + k));
          sum += horizontal ? input[line * width + c] : input[c * width + line];
        }
        out[horizontal ? line * width + pos : pos * width + line] = sum / span;
      }
    }
    return out;
  };
  return pass(pass(field, true), false);
}

function project(first, last, ratio, width, height) {
  const delta = new Float32Array(last.length);
  for (let i = 0; i < last.length; i += 1) delta[i] = last[i] - first[i];
  const trend = smooth(delta, width, height, Math.max(2, Math.round(width / 48)));
  const out = new Float32Array(last.length);
  for (let i = 0; i < last.length; i += 1) {
    out[i] = Math.min(T_MAX, Math.max(T_MIN, last[i] + trend[i] * ratio));
  }
  return out;
}

export function renderRainMap(field, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const image = context.createImageData(width, height);
  const px = image.data;
  const rgb = RAIN_CLASSES.map(({ color }) => [1, 3, 5].map((o) => parseInt(color.slice(o, o + 2), 16)));
  for (let i = 0; i < field.length; i += 1) {
    const t = field[i];
    const r = rateOf(t);
    let cls = -1;
    for (let c = RAIN_CLASSES.length - 1; c >= 0; c -= 1) if (r >= RAIN_CLASSES[c].min) { cls = c; break; }
    const o = i * 4;
    if (cls < 0) {
      // Faint cloud-field context: colder tops render slightly darker grey.
      const shade = Math.round(246 - Math.max(0, Math.min(1, (300 - t) / 80)) * 46);
      px[o] = shade; px[o + 1] = shade; px[o + 2] = shade + 2;
    } else {
      [px[o], px[o + 1], px[o + 2]] = rgb[cls];
    }
    px[o + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Analyse the returned sequence. Frames are evenly spaced; `stepMinutes`
 * is the spacing (null when the upload gave no timing, then one step = 1 unit).
 */
export async function analyseSequence(result) {
  const sources = [
    result.start_image,
    ...(result.extra_frames[0] ? [result.extra_frames[0]] : []),
    result.base_image,
    ...(result.extra_frames[1] ? [result.extra_frames[1]] : []),
    result.end_image,
  ];
  const decoded = await Promise.all(sources.map(decodeKelvin));
  const { width, height } = decoded[0];
  const steps = decoded.length - 1;
  const stepMinutes = result.interval_minutes ?? null;
  const unit = stepMinutes ?? 1;
  const window = steps * unit;
  const midIndex = steps / 2;

  const observed = decoded.map(({ kelvin }, index) => ({
    minutes: index * unit,
    kind: index === 0 || index === steps ? 'Observed' : 'Interpolated',
    field: kelvin,
    ...summarise(kelvin),
  }));

  const first = decoded[0].kelvin;
  const last = decoded[steps].kelvin;
  // Project half a window and a full window ahead of the last observation.
  const projected = [0.5, 1].map((ratio) => {
    const field = project(first, last, ratio, width, height);
    return { minutes: window + window * ratio, kind: 'Projected', field, ...summarise(field) };
  });

  const start = observed[0];
  const end = observed[steps];
  const change = start.meanRate > 0.05 ? (end.meanRate - start.meanRate) / start.meanRate : end.meanRate - start.meanRate;
  const trend = change > 0.08 ? 'Intensifying' : change < -0.08 ? 'Weakening' : 'Steady';
  const hours = stepMinutes ? window / 60 : null;
  const coolingRate = hours ? (end.coldest - start.coldest) / hours : null;

  // Scene-mean accumulation over the observed window (trapezoid rule, mm).
  let accumulation = null;
  if (hours) {
    accumulation = 0;
    for (let i = 1; i < observed.length; i += 1) {
      accumulation += ((observed[i - 1].meanRate + observed[i].meanRate) / 2) * (unit / 60);
    }
  }

  return {
    width, height, stepMinutes, window, midIndex,
    observed, projected, trend, change, coolingRate, accumulation,
    outlook: projected[projected.length - 1],
  };
}
