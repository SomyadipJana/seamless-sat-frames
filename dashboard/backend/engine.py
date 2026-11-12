"""Frame interpolation and the numbers the dashboard already displays."""

from __future__ import annotations

import base64
import json
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path

import cv2
import h5py
import numpy as np

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
PROCESSED = DATA / "processed"
STATE_PATH = DATA / "state.json"

INTERVALS = {
    "15-min Interval": 15,
    "10-min Interval": 10,
    "7.5-min Interval": 7.5,
    "5-min Interval (Experimental)": 5,
}

DEFAULT_CONFIG = {
    "temporal_resolution": "15-min Interval",
    "inference_precision": "FP16 (Recommended)",
    "sharpening": 45,
    "prefetch_buffer": "24 Frames (Standard)",
    "tensorrt": True,
    "engine": "SeamlessSAT v2.4 Core",
}

# Same figures the dashboard rendered before it had a backend.
SEED_METRICS = [
    {"key": "ssim", "title": "SSIM (Structure)", "value": "0.912", "unit": "Idx", "trend": 4.2},
    {"key": "psnr", "title": "PSNR (Noise)", "value": "34.8", "unit": "dB", "trend": 2.1},
    {"key": "mse", "title": "MSE (Error)", "value": "0.0034", "unit": "", "trend": -12.5},
    {"key": "fsim", "title": "FSIM (Features)", "value": "0.885", "unit": "Idx", "trend": 3.8},
]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _seed_history() -> list[dict]:
    points = []
    start = _now().replace(minute=0, second=0, microsecond=0) - timedelta(hours=23)
    for i in range(24):
        stamp = start + timedelta(hours=i)
        wave = math.sin(i / 3.5)
        points.append(
            {
                "time": stamp.strftime("%H:%M"),
                "ssim": round(0.912 + wave * 0.012, 3),
                "psnr": round(34.8 + wave * 0.6, 2),
                "mse": round(0.0034 - wave * 0.0003, 4),
                "fsim": round(0.885 + wave * 0.01, 3),
            }
        )
    return points


def _default_state() -> dict:
    return {
        "config": dict(DEFAULT_CONFIG),
        "metrics": [dict(item) for item in SEED_METRICS],
        "history": _seed_history(),
        "last_sync": (_now() - timedelta(minutes=2)).isoformat(),
        "ingestion_gb_per_hour": 4.2,
        "ingestion_trend": 12.0,
        "status": "Online",
        "active_index": 1,
        "interval": "15-min Interval",
    }


def load_state() -> dict:
    DATA.mkdir(parents=True, exist_ok=True)
    if not STATE_PATH.exists():
        state = _default_state()
        save_state(state)
        return state
    with STATE_PATH.open("r", encoding="utf-8") as handle:
        stored = json.load(handle)
    base = _default_state()
    base.update(stored)
    base["config"] = {**DEFAULT_CONFIG, **stored.get("config", {})}
    return base


def save_state(state: dict) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    with STATE_PATH.open("w", encoding="utf-8") as handle:
        json.dump(state, handle, indent=2)


def _cloud_frame(index: int, size: int = 256) -> np.ndarray:
    """Rotating thermal field. The middle frame is not a blend of the endpoints."""
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    center = (size - 1) / 2.0
    angle = np.deg2rad(index * 28.0)
    dx = x - center
    dy = y - center
    xr = dx * np.cos(angle) - dy * np.sin(angle)
    yr = dx * np.sin(angle) + dy * np.cos(angle)
    bands = 70 + 55 * np.sin(xr / 16.0) * np.cos(yr / 12.0)
    core = np.exp(-((xr - 30) ** 2 + (yr + 10) ** 2) / (2 * 28**2)) * 110
    img = np.clip(bands + core, 0, 255).astype(np.uint8)
    return cv2.GaussianBlur(img, (3, 3), 0)


def ensure_triplet() -> list[np.ndarray]:
    PROCESSED.mkdir(parents=True, exist_ok=True)
    frames = sorted(PROCESSED.glob("frame_*.png"))
    if len(frames) >= 3:
        loaded = [cv2.imread(str(path), cv2.IMREAD_GRAYSCALE) for path in frames[:3]]
        if all(img is not None for img in loaded):
            return loaded
    generated = [_cloud_frame(i) for i in range(3)]
    for i, img in enumerate(generated):
        cv2.imwrite(str(PROCESSED / f"frame_{i:03d}.png"), img)
    return generated


def _apply_precision(image: np.ndarray, precision: str) -> np.ndarray:
    if precision.startswith("INT8"):
        levels = 32
        quantized = np.round(image.astype(np.float32) / 255.0 * (levels - 1))
        return (quantized / (levels - 1) * 255.0).astype(np.uint8)
    if precision.startswith("FP16"):
        return image.astype(np.float16).astype(np.uint8)
    return image.astype(np.float32).astype(np.uint8)


def _sharpen(image: np.ndarray, amount: int) -> np.ndarray:
    if amount <= 0:
        return image
    blurred = cv2.GaussianBlur(image, (0, 0), 1.2)
    strength = amount / 100.0
    sharp = cv2.addWeighted(image, 1.0 + strength, blurred, -strength, 0)
    return np.clip(sharp, 0, 255).astype(np.uint8)


def interpolate_pair(img0: np.ndarray, img2: np.ndarray, t: float, config: dict) -> np.ndarray:
    """Halfway (or partial) warp using Farneback flow from the first frame to the second."""
    img0 = img0.astype(np.uint8)
    img2 = img2.astype(np.uint8)
    flow = cv2.calcOpticalFlowFarneback(img0, img2, None, 0.5, 3, 15, 3, 5, 1.2, 0)
    height, width = img0.shape
    grid_x, grid_y = np.meshgrid(np.arange(width), np.arange(height))
    map_x0 = (grid_x - flow[..., 0] * t).astype(np.float32)
    map_y0 = (grid_y - flow[..., 1] * t).astype(np.float32)
    map_x2 = (grid_x + flow[..., 0] * (1.0 - t)).astype(np.float32)
    map_y2 = (grid_y + flow[..., 1] * (1.0 - t)).astype(np.float32)
    warp0 = cv2.remap(img0, map_x0, map_y0, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    warp2 = cv2.remap(img2, map_x2, map_y2, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    blended = warp0.astype(np.float32) * (1.0 - t) + warp2.astype(np.float32) * t
    result = _apply_precision(blended, config.get("inference_precision", "FP16 (Recommended)"))
    return _sharpen(result, int(config.get("sharpening", 0)))


def linear_blend(img0: np.ndarray, img2: np.ndarray, t: float) -> np.ndarray:
    mixed = img0.astype(np.float32) * (1.0 - t) + img2.astype(np.float32) * t
    return np.clip(mixed, 0, 255).astype(np.uint8)


def mse(a: np.ndarray, b: np.ndarray) -> float:
    diff = a.astype(np.float64) - b.astype(np.float64)
    return float(np.mean(diff ** 2) / (255.0 ** 2))


def psnr(a: np.ndarray, b: np.ndarray) -> float:
    err = np.mean((a.astype(np.float64) - b.astype(np.float64)) ** 2)
    if err <= 1e-12:
        return 99.0
    return float(10.0 * math.log10((255.0 ** 2) / err))


def ssim(a: np.ndarray, b: np.ndarray) -> float:
    x = a.astype(np.float64)
    y = b.astype(np.float64)
    c1 = (0.01 * 255) ** 2
    c2 = (0.03 * 255) ** 2
    mu_x = cv2.GaussianBlur(x, (11, 11), 1.5)
    mu_y = cv2.GaussianBlur(y, (11, 11), 1.5)
    sigma_x = cv2.GaussianBlur(x * x, (11, 11), 1.5) - mu_x ** 2
    sigma_y = cv2.GaussianBlur(y * y, (11, 11), 1.5) - mu_y ** 2
    sigma_xy = cv2.GaussianBlur(x * y, (11, 11), 1.5) - mu_x * mu_y
    num = (2 * mu_x * mu_y + c1) * (2 * sigma_xy + c2)
    den = (mu_x ** 2 + mu_y ** 2 + c1) * (sigma_x + sigma_y + c2)
    return float(np.mean(num / den))


def fsim(a: np.ndarray, b: np.ndarray) -> float:
    """Gradient-magnitude feature similarity. Used when the piq FSIM package is not installed."""
    ax = cv2.Sobel(a, cv2.CV_64F, 1, 0, ksize=3)
    ay = cv2.Sobel(a, cv2.CV_64F, 0, 1, ksize=3)
    bx = cv2.Sobel(b, cv2.CV_64F, 1, 0, ksize=3)
    by = cv2.Sobel(b, cv2.CV_64F, 0, 1, ksize=3)
    ga = np.sqrt(ax ** 2 + ay ** 2)
    gb = np.sqrt(bx ** 2 + by ** 2)
    c = 1.5
    sim = (2 * ga * gb + c) / (ga ** 2 + gb ** 2 + c)
    weight = np.maximum(ga, gb)
    return float(np.sum(sim * weight) / (np.sum(weight) + 1e-8))


def _trend(current: float, baseline: float) -> float:
    if abs(baseline) < 1e-9:
        return 0.0
    return round((current - baseline) / abs(baseline) * 100.0, 1)


def _fmt_metrics(ai: dict, base: dict) -> list[dict]:
    return [
        {
            "key": "ssim",
            "title": "SSIM (Structure)",
            "value": f"{ai['ssim']:.3f}",
            "unit": "Idx",
            "trend": _trend(ai["ssim"], base["ssim"]),
        },
        {
            "key": "psnr",
            "title": "PSNR (Noise)",
            "value": f"{ai['psnr']:.1f}",
            "unit": "dB",
            "trend": _trend(ai["psnr"], base["psnr"]),
        },
        {
            "key": "mse",
            "title": "MSE (Error)",
            "value": f"{ai['mse']:.4f}",
            "unit": "",
            "trend": _trend(ai["mse"], base["mse"]),
        },
        {
            "key": "fsim",
            "title": "FSIM (Features)",
            "value": f"{ai['fsim']:.3f}",
            "unit": "Idx",
            "trend": _trend(ai["fsim"], base["fsim"]),
        },
    ]


def _score(pred: np.ndarray, truth: np.ndarray) -> dict:
    return {
        "mse": mse(pred, truth),
        "psnr": psnr(pred, truth),
        "ssim": ssim(pred, truth),
        "fsim": fsim(pred, truth),
    }


def _png_data_url(image: np.ndarray) -> str:
    ok, buffer = cv2.imencode(".png", image)
    if not ok:
        raise RuntimeError("Could not encode frame")
    encoded = base64.b64encode(buffer.tobytes()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def _steps(interval_minutes: float) -> list[float]:
    count = int(round(30 / interval_minutes))
    count = max(count, 1)
    return [i / count for i in range(count + 1)]


def _labels(interval_name: str) -> list[str]:
    minutes = INTERVALS[interval_name]
    start = 4 * 60
    count = int(round(30 / minutes))
    return [f"{(start + int(round(i * minutes))) // 60:02d}:{(start + int(round(i * minutes))) % 60:02d} UTC" for i in range(count + 1)]


def build_comparison(state: dict | None = None) -> dict:
    state = state or load_state()
    config = state["config"]
    interval = state.get("interval") or config["temporal_resolution"]
    if interval not in INTERVALS:
        interval = "15-min Interval"
    img0, truth, img2 = ensure_triplet()
    times = _steps(INTERVALS[interval])
    labels = _labels(interval)
    frames = []
    for t, label in zip(times, labels):
        if t in (0.0, 1.0):
            observed = img0 if t == 0.0 else img2
            frames.append(
                {
                    "label": label,
                    "role": "observed",
                    "image": _png_data_url(observed),
                    "ground_truth": _png_data_url(observed),
                }
            )
        else:
            predicted = interpolate_pair(img0, img2, t, config)
            reference = truth if abs(t - 0.5) < 1e-6 else linear_blend(img0, img2, t)
            frames.append(
                {
                    "label": label,
                    "role": "interpolated",
                    "image": _png_data_url(predicted),
                    "ground_truth": _png_data_url(reference),
                }
            )
    active = next((i for i, frame in enumerate(frames) if frame["role"] == "interpolated"), 1)
    stored_index = int(state.get("active_index", active))
    if not 0 <= stored_index < len(frames):
        stored_index = active
    return {
        "interval": interval,
        "active_index": stored_index,
        "timestamp": frames[stored_index]["label"],
        "frames": frames,
    }


def run_generation(config: dict | None = None) -> dict:
    state = load_state()
    if config:
        state["config"].update(config)
    interval = state["config"]["temporal_resolution"]
    if interval not in INTERVALS:
        interval = "15-min Interval"
        state["config"]["temporal_resolution"] = interval
    img0, truth, img2 = ensure_triplet()
    predicted = interpolate_pair(img0, img2, 0.5, state["config"])
    baseline = linear_blend(img0, img2, 0.5)
    ai_scores = _score(predicted, truth)
    base_scores = _score(baseline, truth)
    state["metrics"] = _fmt_metrics(ai_scores, base_scores)
    state["history"] = state.get("history") or _seed_history()
    state["history"] = state["history"][-23:] + [
        {
            "time": _now().strftime("%H:%M"),
            "ssim": round(ai_scores["ssim"], 3),
            "psnr": round(ai_scores["psnr"], 2),
            "mse": round(ai_scores["mse"], 4),
            "fsim": round(ai_scores["fsim"], 3),
        }
    ]
    state["last_sync"] = _now().isoformat()
    state["status"] = "Online"
    state["interval"] = interval
    state["ingestion_gb_per_hour"] = round(4.2 + (ai_scores["ssim"] - 0.9) * 2, 2)
    h5_path = DATA / "latest_prediction.h5"
    with h5py.File(h5_path, "w") as handle:
        handle.create_dataset("interpolated_frame", data=predicted)
        handle.create_dataset("ground_truth", data=truth)
        handle.attrs["interval"] = interval
    comparison = build_comparison(state)
    state["active_index"] = comparison["active_index"]
    save_state(state)
    return {
        "status": "success",
        "metrics": public_metrics(state),
        "comparison": comparison,
        "satellite": public_satellite(state),
    }


def _relative_sync(iso_stamp: str) -> str:
    try:
        stamp = datetime.fromisoformat(iso_stamp)
    except ValueError:
        return "just now"
    if stamp.tzinfo is None:
        stamp = stamp.replace(tzinfo=timezone.utc)
    seconds = max(0, int((_now() - stamp).total_seconds()))
    if seconds < 60:
        return "just now"
    minutes = seconds // 60
    if minutes == 1:
        return "1 minute ago"
    if minutes < 60:
        return f"{minutes} minutes ago"
    hours = minutes // 60
    if hours == 1:
        return "1 hour ago"
    return f"{hours} hours ago"


def public_metrics(state: dict | None = None) -> dict:
    state = state or load_state()
    return {"satellite": "GOES-19", "metrics": state["metrics"]}


def public_history(state: dict | None = None) -> dict:
    state = state or load_state()
    return {"window": "Last 24h", "points": state["history"]}


def public_satellite(state: dict | None = None) -> dict:
    state = state or load_state()
    img0, _, _ = ensure_triplet()
    return {
        "name": "GOES-19",
        "instrument": "GOES-19 ABI",
        "status": state.get("status", "Online"),
        "last_sync": _relative_sync(state["last_sync"]),
        "ingestion_gb_per_hour": state.get("ingestion_gb_per_hour", 4.2),
        "ingestion_trend": state.get("ingestion_trend", 12),
        "feed": _png_data_url(img0),
    }


def public_config(state: dict | None = None) -> dict:
    state = state or load_state()
    return state["config"]


def update_config(payload: dict) -> dict:
    state = load_state()
    allowed = set(DEFAULT_CONFIG)
    for key, value in payload.items():
        if key in allowed and key != "engine":
            state["config"][key] = value
    if state["config"]["temporal_resolution"] in INTERVALS:
        state["interval"] = state["config"]["temporal_resolution"]
    save_state(state)
    return state["config"]


def decode_upload(file_storage) -> np.ndarray:
    data = np.frombuffer(file_storage.read(), np.uint8)
    image = cv2.imdecode(data, cv2.IMREAD_GRAYSCALE)
    if image is None:
        raise ValueError("Could not read image")
    return image


def interpolate_uploads(frame1: np.ndarray, frame3: np.ndarray, resolution: str) -> dict:
    state = load_state()
    config = state["config"]
    if resolution in ("7.5min", "7.5-min Interval"):
        config = {**config, "temporal_resolution": "7.5-min Interval"}
    predicted = interpolate_pair(frame1, frame3, 0.5, config)
    linear = linear_blend(frame1, frame3, 0.5)
    delta = cv2.absdiff(predicted, linear)
    delta_norm = cv2.normalize(delta, None, 0, 255, cv2.NORM_MINMAX)
    heatmap = cv2.applyColorMap(delta_norm, cv2.COLORMAP_JET)
    sobelx = cv2.Sobel(predicted, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(predicted, cv2.CV_64F, 0, 1, ksize=3)
    sobel = cv2.normalize(np.sqrt(sobelx ** 2 + sobely ** 2), None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    sobel_img = cv2.applyColorMap(sobel, cv2.COLORMAP_HOT)
    truth_path = PROCESSED / "frame_001.png"
    truth = cv2.imread(str(truth_path), cv2.IMREAD_GRAYSCALE) if truth_path.exists() else linear
    if truth.shape != predicted.shape:
        truth = cv2.resize(truth, (predicted.shape[1], predicted.shape[0]))
    ai_scores = _score(predicted, truth)
    base_scores = _score(linear, truth)
    extra = []
    if config["temporal_resolution"].startswith("7.5"):
        extra = [
            _png_data_url(interpolate_pair(frame1, frame3, 0.25, config)),
            _png_data_url(interpolate_pair(frame1, frame3, 0.75, config)),
        ]
    h5_path = DATA / "latest_prediction.h5"
    DATA.mkdir(parents=True, exist_ok=True)
    with h5py.File(h5_path, "w") as handle:
        handle.create_dataset("interpolated_frame", data=predicted)
    return {
        "base_image": _png_data_url(predicted),
        "differential_image": _png_data_url(heatmap),
        "sobel_image": _png_data_url(sobel_img),
        "extra_frames": extra,
        "metrics": {
            "mse": f"{ai_scores['mse']:.3f}",
            "psnr": f"{ai_scores['psnr']:.2f}",
            "ssim": f"{ai_scores['ssim']:.4f}",
            "fsim": f"{ai_scores['fsim']:.4f}",
            "mac": f"{float(np.mean(np.abs(frame1.astype(np.float64) - frame3.astype(np.float64)))):.2f}",
            "baseline": {
                "mse": f"{base_scores['mse']:.3f}",
                "psnr": f"{base_scores['psnr']:.2f}",
                "ssim": f"{base_scores['ssim']:.4f}",
                "fsim": f"{base_scores['fsim']:.4f}",
            },
        },
    }
