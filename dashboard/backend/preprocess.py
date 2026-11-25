from pathlib import Path
import cv2
import numpy as np
import xarray as xr


def process_sequence(raw_dir="data/raw", processed_dir="data/processed"):
    files = sorted(Path(raw_dir).glob("*.nc"))
    if len(files) < 3:
        raise SystemExit(f"Need at least three GOES ABI NetCDF files in {raw_dir}.")

    output = Path(processed_dir)
    output.mkdir(parents=True, exist_ok=True)
    for index, path in enumerate(files):
        with xr.open_dataset(path) as dataset:
            radiance = dataset["Rad"]
            height, width = radiance.shape
            patch = radiance.isel(
                y=slice(height // 2 - 256, height // 2 + 256),
                x=slice(width // 2 - 256, width // 2 + 256),
            ).values
            fk1, fk2, bc1, bc2 = (
                dataset[f"planck_{key}"].item()
                for key in ("fk1", "fk2", "bc1", "bc2")
            )
            with np.errstate(divide="ignore", invalid="ignore"):
                kelvin = (fk2 / np.log1p(fk1 / patch) - bc1) / bc2
        if kelvin.shape != (512, 512) or not np.isfinite(kelvin).all() or (patch <= 0).any():
            raise ValueError(f"Invalid thermal crop in {path.name}")
        # Use the same brightness-temperature scale for every observation.
        image = np.rint(np.clip((kelvin - 180) / (330 - 180), 0, 1) * 255).astype(np.uint8)
        target = output / f"frame_{index:03d}.png"
        if not cv2.imwrite(str(target), image):
            raise OSError(f"Could not write {target}")
        print(f"{path.name} -> {target}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Prepare calibrated 512-pixel GOES thermal crops.")
    parser.add_argument("--raw-dir", default="data/raw")
    parser.add_argument("--output", default="data/processed")
    args = parser.parse_args()
    process_sequence(args.raw_dir, args.output)
