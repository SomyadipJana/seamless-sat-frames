"""API for the INSAT interpolation dashboard.

The routes follow the screens that already exist in the frontend:
metrics, GOES-19 status, model configuration, comparison frames, and Generate Frames.
POST /interpolate and GET /download_h5 stay available for the earlier upload flow.
"""

from pathlib import Path

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

import engine

app = Flask(__name__)
CORS(app)


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/api/metrics")
def metrics():
    return jsonify(engine.public_metrics())


@app.get("/api/metrics/history")
def metrics_history():
    return jsonify(engine.public_history())


@app.get("/api/satellite")
def satellite():
    return jsonify(engine.public_satellite())


@app.get("/api/config")
def get_config():
    return jsonify(engine.public_config())


@app.put("/api/config")
@app.post("/api/config")
def put_config():
    payload = request.get_json(silent=True) or {}
    return jsonify(engine.update_config(payload))


@app.get("/api/comparison")
def comparison():
    state = engine.load_state()
    interval = request.args.get("interval")
    if interval:
        state["interval"] = interval
        engine.save_state(state)
    return jsonify(engine.build_comparison(state))


@app.post("/api/generate")
def generate():
    payload = request.get_json(silent=True) or {}
    return jsonify(engine.run_generation(payload or None))


@app.post("/interpolate")
def interpolate():
    if "frame1" not in request.files or "frame3" not in request.files:
        return jsonify({"error": "Missing frames"}), 400
    try:
        frame1 = engine.decode_upload(request.files["frame1"])
        frame3 = engine.decode_upload(request.files["frame3"])
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    resolution = request.form.get("resolution", "15min")
    return jsonify(engine.interpolate_uploads(frame1, frame3, resolution))


@app.get("/download_h5")
def download_h5():
    path = Path(engine.DATA) / "latest_prediction.h5"
    if not path.exists():
        engine.run_generation()
    return send_file(path, as_attachment=True, download_name="interpolated_t1.h5")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
