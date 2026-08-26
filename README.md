# Seamless SAT Frames

Deep learning-based optical flow model that generates intermediate frames between consecutive geostationary satellite images (INSAT-3DS/3DR, GOES-19, Himawari-8), effectively increasing observation frequency without additional satellites.

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-Deep%20Learning-red)](https://pytorch.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Objectives](#objectives)
- [Datasets](#datasets)
- [Project Workflow](#project-workflow)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Setup](#setup)
- [Usage](#usage)
- [Evaluation Metrics](#evaluation-metrics)
- [Team](#team)

---

## Overview

Geostationary satellites (INSAT, GOES, Himawari) capture images at fixed intervals — 30 minutes for INSAT, 10 minutes for GOES/Himawari. This limits near real-time monitoring of fast-changing events like fires, cyclones, thunderstorms, and floods. Classical optical-flow interpolation struggles here because cloud motion is non-rigid — clouds swirl, merge, split, and dissipate rather than moving like solid objects, producing blurred or artifact-heavy interpolated frames.

This project builds a deep learning-based optical flow and frame interpolation model that generates realistic intermediate frames between two consecutive satellite images, improving effective temporal resolution (e.g., 30 min → 15 min → 7.5 min) without requiring additional satellites.

---

## Objectives

- Estimate motion vectors between consecutive satellite frames using an AI/ML optical flow approach.
- Generate synthetic intermediate frames using deep learning video interpolation methods.
- Improve temporal resolution of INSAT-3DS/3DR imagery using a model trained and validated on higher-frequency data.
- Validate results against real higher-temporal-resolution datasets (GOES-19, Himawari-8) using SSIM, PSNR, MSE, and FSIM.

---

## Datasets

Thermal Infrared band (~10 micrometer) data in `.nc` / `.h5` format:

| Source | Temporal Resolution | Role |
|--------|---------------------|------|
| GOES-19 ABI Channel 13 (NOAA AWS bucket) | 10 min | Training + quantitative validation (real ground-truth middle frames available) |
| Himawari-8 | 10 min | Additional training / cross-validation |
| INSAT-3DS/3DR TIR1 (MOSDAC) | 30 min | Final application target — no ground truth at finer intervals |

---

## Project Workflow

### Phase A — Train and Validate (GOES-19 / Himawari-8)

1. **Data collection** — Download GOES-19 / Himawari `.nc` / `.h5` frames.
2. **Preprocessing** — Extract the TIR band, normalize, crop, and build consecutive-frame training triplets (frame `t`, frame `t+2`, ground-truth frame `t+1`).
3. **Model training** — Fine-tune a deep video-interpolation network (e.g., RIFE / Super SloMo) in PyTorch.
4. **Evaluation** — Score generated middle frames against real ones using SSIM, PSNR, MSE, and FSIM.

### Phase B — Apply to INSAT (Final Deliverable)

1. Apply the trained model to INSAT-3DS/3DR 30-minute TIR1 frames.
2. Generate intermediate frames at 15-minute (and optionally 7.5-minute) intervals.
3. Produce a visualization dashboard with side-by-side time-lapse animations and a metrics report.

---

## Tech Stack

| Layer | Tools |
|-------|-------|
| Data Acquisition | Python, xarray, netCDF4/h5py, boto3, requests (MOSDAC), satpy |
| Preprocessing | NumPy, OpenCV / Pillow, xarray |
| Modeling | PyTorch, RIFE / Super SloMo (optionally DAIN, FLAVR), Google Colab / Kaggle |
| Evaluation | scikit-image (SSIM, PSNR, MSE), FSIM implementation, Matplotlib / Seaborn |
| Visualization | FastAPI or Flask (backend), React or Streamlit / Plotly Dash (frontend), FFmpeg |
| Supporting | Git / GitHub, Docker (optional) |

---

## Repository Structure

```
seamless-sat-frames/
├── data/                # Raw and processed .nc / .h5 satellite frames (gitignored)
├── notebooks/           # Exploration, training, and evaluation notebooks
├── src/
│   ├── data/            # Data download and preprocessing scripts
│   ├── models/          # Frame interpolation model code
│   ├── train.py         # Training entry point
│   ├── evaluate.py      # SSIM / PSNR / MSE / FSIM evaluation
│   └── inference.py     # Apply trained model to INSAT data
├── dashboard/           # Visualization web app (backend + frontend)
├── reports/             # Generated comparison reports and plots
├── requirements.txt
└── README.md
```

---

## Setup

```bash
git clone https://github.com/SomyadipJana/seamless-sat-frames.git
cd seamless-sat-frames
pip install -r requirements.txt
```

---

## Usage

```bash
# Download and preprocess training data (GOES-19 / Himawari-8)
python src/data/download_goes.py

# Train the interpolation model
python src/train.py

# Evaluate against ground truth
python src/evaluate.py

# Run inference on INSAT-3DS/3DR data
python src/inference.py --input insat_frames/ --interval 15min
```

---

## Evaluation Metrics

| Metric | Description | Range | Direction |
|--------|-------------|-------|-----------|
| SSIM | Structural Similarity Index | [0, 1] | Higher is better |
| PSNR | Peak Signal-to-Noise Ratio (dB) | [0, inf) | Higher is better |
| MSE | Mean Squared Error | [0, inf) | Lower is better |
| FSIM | Feature Similarity Index | [0, 1] | Higher is better |

---

## Team

- **Souraddep pradhan**
- **Soumyadip Jana** 
- Sayan Adak
- Aniruddha Das
- Pijush pore 


---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.