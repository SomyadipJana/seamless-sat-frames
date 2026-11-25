from flask import Flask, request, jsonify, send_file
import os
import json
from flask_cors import CORS
os.environ.setdefault("OPENCV_IO_MAX_IMAGE_PIXELS", str(64_000_000))
import cv2
import numpy as np
import math
import base64
import h5py
from tempfile import NamedTemporaryFile
from mosdac import PRODUCTS, latest_gallery

os.chdir(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 30 * 1024 * 1024
CORS(app)

model = None
checkpoint = next((path for path in ("models/satellite_interpolator.pth", "sample/goes18_unet.pth")
                   if os.path.isfile(path)), None)
if checkpoint:
    try:
        import torch
        from model import SatelliteInterpolatorUNet

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        if device.type == "cpu":
            torch.set_num_threads(min(4, os.cpu_count() or 1))
        network = SatelliteInterpolatorUNet().to(device)
        network.load_state_dict(torch.load(checkpoint, map_location=device, weights_only=True))
        model = network.eval()
    except Exception:
        app.logger.exception("Could not load checkpoint. Using the OpenCV baseline.")

DEFAULT_METHOD = "linear"
METHODS = ("linear", "u-net")
MODEL_PROFILE = ("GOES-18 starter checkpoint" if checkpoint == "sample/goes18_unet.pth"
                 else "Local checkpoint") if model is not None else None
WORKING_SIZE = 768
feature_similarity = None
if model is not None:
    try:
        from piq import fsim as feature_similarity
    except Exception:
        app.logger.warning("PIQ unavailable. FSIM will be omitted.")


def score(reference, image):
    reference = reference.astype(np.float64)
    image = image.astype(np.float64)
    mse = float(np.mean((reference - image) ** 2))

    def mean(field):
        return cv2.GaussianBlur(field, (11, 11), 1.5)

    a, b = mean(reference), mean(image)
    c1, c2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    variance = mean(reference ** 2) - a ** 2 + mean(image ** 2) - b ** 2
    covariance = mean(reference * image) - a * b
    similarity = ((2 * a * b + c1) * (2 * covariance + c2)) / ((a ** 2 + b ** 2 + c1) * (variance + c2))
    fsim = None
    if feature_similarity is not None:
        try:
            a, b = (torch.from_numpy(frame.copy())[None, None].float() / 255
                    for frame in (image, reference))
            value = feature_similarity(a, b, data_range=1.0, chromatic=False).item()
            fsim = f"{value:.4f}" if math.isfinite(value) else None
        except Exception:
            app.logger.exception("Could not compute FSIM.")
    return {
        "mse": f"{mse:.3f}",
        "psnr": f"{10 * math.log10(255 ** 2 / mse):.2f}" if mse else "Infinity",
        "ssim": f"{similarity[5:-5, 5:-5].mean():.4f}",
        "fsim": fsim,
    }


STATE_PATH = os.path.join("data", "dashboard_state.json")
DEFAULT_RESOLUTION = "15-min Interval"
RESOLUTIONS = ("15min", "7.5min")
CONFIG_RESOLUTIONS = ("15-min Interval", "7.5-min Interval")
CACHE = {"result": None}


def img_to_base64(img):
    _, buffer = cv2.imencode(".png", img)
    return "data:image/png;base64," + base64.b64encode(buffer).decode("utf-8")


def isro_resolution(label):
    return "7.5min" if "7.5" in (label or "") else "15min"


def unet_midpoint(start, end):
    height, width = start.shape
    padded = [cv2.copyMakeBorder(frame, 0, -height % 4, 0, -width % 4, cv2.BORDER_REPLICATE)
              for frame in (start, end)]
    tensors = [torch.from_numpy(frame)[None, None].float().repeat(1, 3, 1, 1).to(device) / 255
               for frame in padded]
    with torch.inference_mode():
        image = model(*tensors)[0, :, :height, :width].mean(dim=0)
    return np.rint(image.cpu().numpy() * 255).astype(np.uint8)


def run_interpolation(start, end, resolution, truth=None, source="Uploaded frames", cadence=None,
                      method=DEFAULT_METHOD):
    if method not in METHODS:
        raise ValueError("Choose Linear blend or U-Net.")
    if method == "u-net" and model is None:
        raise ValueError("U-Net is unavailable. Load a compatible checkpoint or select Linear blend.")
    profile = MODEL_PROFILE if method == "u-net" else None
    for frame in (end, truth):
        if frame is not None and frame.shape != start.shape:
            raise ValueError("All frames must have the same dimensions and cover the same grid.")
    if min(start.shape) < 11:
        raise ValueError("Each frame must be at least 11 pixels wide and high.")
    original_height, original_width = start.shape
    scale = min(1, WORKING_SIZE / max(start.shape))
    if scale < 1:
        size = (max(11, round(original_width * scale)), max(11, round(original_height * scale)))
        start, end = (cv2.resize(frame, size, interpolation=cv2.INTER_AREA) for frame in (start, end))
        if truth is not None:
            truth = cv2.resize(truth, size, interpolation=cv2.INTER_AREA)

    endpoint_delta = cv2.absdiff(start, end)
    identical = not np.any(endpoint_delta)
    linear = cv2.addWeighted(start, 0.5, end, 0.5, 0)
    prediction = linear if method == "linear" or identical else unet_midpoint(start, end)
    delta = cv2.absdiff(prediction, linear)
    heatmap = cv2.applyColorMap(cv2.normalize(delta, None, 0, 255, cv2.NORM_MINMAX), cv2.COLORMAP_JET)
    dx = cv2.Sobel(prediction, cv2.CV_32F, 1, 0)
    dy = cv2.Sobel(prediction, cv2.CV_32F, 0, 1)
    edges = cv2.normalize(cv2.magnitude(dx, dy), None, 0, 255, cv2.NORM_MINMAX)
    sobel = cv2.applyColorMap(edges.astype(np.uint8), cv2.COLORMAP_HOT)

    extras = []
    if resolution == "7.5min":
        if method == "linear" or identical:
            extras = [cv2.addWeighted(start, 1 - fraction, end, fraction, 0)
                      for fraction in (0.25, 0.75)]
        else:
            extras = [unet_midpoint(start, prediction), unet_midpoint(prediction, end)]
    intervals = 4 if extras else 2
    scores = None
    observed_error = None
    if truth is not None:
        observed_error = cv2.applyColorMap(cv2.absdiff(prediction, truth), cv2.COLORMAP_INFERNO)
        baseline_scores = score(truth, linear)
        scores = dict(baseline_scores) if prediction is linear else score(truth, prediction)
        scores["baseline"] = baseline_scores

    os.makedirs("data", exist_ok=True)
    with NamedTemporaryFile(dir="data", suffix=".h5", delete=False) as temporary:
        export_path = temporary.name
    try:
        with h5py.File(export_path, "w") as handle:
            handle.attrs["engine"] = method
            handle.attrs["source"] = source
            handle.attrs["input_width"] = original_width
            handle.attrs["input_height"] = original_height
            if profile:
                handle.attrs["model_profile"] = profile
            handle.attrs["identical_endpoints"] = identical
            if cadence:
                handle.attrs["endpoint_gap_minutes"] = cadence
            frames = {"interpolated_frame": (prediction, 0.5)}
            if extras:
                frames.update(first_quarter=(extras[0], 0.25), third_quarter=(extras[1], 0.75))
            for name, (frame, fraction) in frames.items():
                dataset = handle.create_dataset(name, data=frame)
                dataset.attrs["endpoint_fraction"] = fraction
                if cadence is not None:
                    dataset.attrs["offset_minutes"] = cadence * fraction
        os.replace(export_path, "data/latest_prediction.h5")
    finally:
        if os.path.exists(export_path):
            os.unlink(export_path)

    return {
        "base_image": img_to_base64(prediction),
        "start_image": img_to_base64(start),
        "end_image": img_to_base64(end),
        "ground_truth": img_to_base64(truth) if truth is not None else None,
        "baseline_image": img_to_base64(linear),
        "differential_image": img_to_base64(heatmap),
        "sobel_image": img_to_base64(sobel),
        "observed_error_image": img_to_base64(observed_error) if observed_error is not None else None,
        "mean_endpoint_change": float(endpoint_delta.mean()),
        "endpoint_change_image": img_to_base64(cv2.applyColorMap(endpoint_delta, cv2.COLORMAP_INFERNO)),
        "extra_frames": [img_to_base64(frame) for frame in extras],
        "metrics": scores,
        "engine": method,
        "source": source,
        "model_profile": profile,
        "identical_endpoints": identical,
        "frame_size": {
            "input_width": original_width, "input_height": original_height,
            "width": start.shape[1], "height": start.shape[0],
        },
        "interval_minutes": cadence / intervals if cadence else None,
    }


def load_config():
    try:
        with open(STATE_PATH, encoding="utf-8") as handle:
            resolution = json.load(handle).get("config", {}).get("temporal_resolution")
    except (FileNotFoundError, json.JSONDecodeError):
        resolution = None
    return {
        "temporal_resolution": resolution if resolution in CONFIG_RESOLUTIONS else DEFAULT_RESOLUTION,
        "engine": DEFAULT_METHOD,
        "u_net_available": model is not None,
    }


def remember(result):
    CACHE["result"] = result
    return result


SAMPLE_SOURCES = {
    "sample": ("sample", "GOES-18 ABI Channel 13, 1 Jan 2024", 20),
    "milton": ("sample/milton", "Hurricane Milton, GOES-16 Channel 13, 9 Oct 2024", 30),
    "processed": ("data/processed", "Local prepared frames", None),
}


def generate_from_processed(resolution, source, method=DEFAULT_METHOD):
    directory, label, gap = SAMPLE_SOURCES[source]
    frames = [cv2.imread(f"{directory}/frame_{index:03d}.png", cv2.IMREAD_GRAYSCALE)
              for index in range(3)]
    if any(frame is None for frame in frames):
        raise ValueError("This source needs three prepared frames.")
    return remember(run_interpolation(frames[0], frames[2], resolution, frames[1], label, gap, method))


def read_upload(file_storage):
    raw = np.frombuffer(file_storage.read(), np.uint8)
    image = cv2.imdecode(raw, cv2.IMREAD_GRAYSCALE)
    if image is None:
        raise ValueError("Could not decode the image. Use a valid PNG or JPEG frame.")
    return image


@app.route("/interpolate", methods=["POST"])
def interpolate():
    try:
        if not all(key in request.files and request.files[key].filename for key in ("frame1", "frame3")):
            raise ValueError("Select both the first and last satellite frame.")
        start, end = (read_upload(request.files[key]) for key in ("frame1", "frame3"))
        middle = request.files.get("midpoint")
        truth = read_upload(middle) if middle and middle.filename else None
        resolution = request.form.get("resolution", "15min")
        if resolution not in RESOLUTIONS:
            raise ValueError("Choose midpoint or quarter steps.")
        cadence = float(request.form.get("endpoint_gap") or 30)
        if not math.isfinite(cadence) or cadence <= 0:
            raise ValueError("Enter a positive time gap in minutes.")
        method = request.form.get("method", DEFAULT_METHOD)
        return jsonify(remember(run_interpolation(start, end, resolution, truth, cadence=cadence, method=method)))
    except (ValueError, cv2.error) as exc:
        return {"error": str(exc)}, 400


@app.route("/download_h5", methods=["GET"])
def download_h5():
    h5_path = os.path.join("data", "latest_prediction.h5")
    if os.path.exists(h5_path):
        return send_file(os.path.abspath(h5_path), as_attachment=True, download_name="interpolated_t1.h5")
    return {"error": "No data available"}, 404


@app.get("/feeds/mosdac/<product>")
def mosdac_feed(product):
    if product not in PRODUCTS:
        return {"error": "Unknown MOSDAC product."}, 404
    try:
        return jsonify(latest_gallery(product))
    except (OSError, ValueError):
        app.logger.warning("Could not retrieve MOSDAC %s feed", product, exc_info=True)
        return {"error": "Could not reach the MOSDAC feed. Try Refresh or open the official source."}, 502


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "engine": DEFAULT_METHOD, "u_net_available": model is not None})


@app.get("/api/metrics")
def metrics():
    result = CACHE["result"] or {}
    return jsonify({"satellite": result.get("source"), "metrics": result.get("metrics")})


@app.get("/api/metrics/history")
def metrics_history():
    return jsonify({"points": []})


@app.get("/api/satellite")
def satellite():
    result = CACHE["result"] or {}
    return jsonify({"name": result.get("source"), "feed": result.get("start_image")})


@app.get("/api/config")
@app.get("/config")
def get_config():
    return jsonify(load_config())


@app.put("/api/config")
@app.post("/api/config")
@app.put("/config")
@app.post("/config")
def put_config():
    payload = request.get_json(silent=True) or {}
    resolution = payload.get("temporal_resolution")
    if resolution not in CONFIG_RESOLUTIONS:
        return {"error": "Choose midpoint or quarter steps."}, 400
    config = {"temporal_resolution": resolution, "engine": DEFAULT_METHOD, "u_net_available": model is not None}
    os.makedirs("data", exist_ok=True)
    with open(STATE_PATH, "w", encoding="utf-8") as handle:
        json.dump({"config": config}, handle)
    return jsonify(config)


@app.get("/api/comparison")
def comparison():
    return jsonify(CACHE["result"] or {})


@app.post("/generate")
@app.post("/api/generate")
def generate():
    payload = request.get_json(silent=True) or {}
    resolution = payload.get("resolution") or isro_resolution(load_config()["temporal_resolution"])
    if resolution not in RESOLUTIONS:
        return {"error": "Choose midpoint or quarter steps."}, 400
    source = payload.get("source", "sample")
    if not isinstance(source, str) or source not in SAMPLE_SOURCES:
        return {"error": "Unknown sample source."}, 400
    try:
        return jsonify(generate_from_processed(resolution, source, payload.get("method", DEFAULT_METHOD)))
    except ValueError as exc:
        return {"error": str(exc)}, 400


if __name__ == "__main__":
    app.run(port=5000, debug=True)
