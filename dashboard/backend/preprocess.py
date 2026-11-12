import xarray as xr
import numpy as np
import cv2
import os
import glob

def process_sequence(raw_dir="data/raw", processed_dir="data/processed"):
    os.makedirs(processed_dir, exist_ok=True)
    
    # Get all .nc files and sort them to ensure chronological order
    nc_files = sorted(glob.glob(os.path.join(raw_dir, "*.nc")))
    
    if len(nc_files) < 3:
        print(f"Need at least 3 files. Found {len(nc_files)}.")
        return
        
    print(f"Found {len(nc_files)} consecutive satellite files. Extracting patches...")
    
    for i, nc_file in enumerate(nc_files):
        print(f"Processing: {os.path.basename(nc_file)}")
        ds = xr.open_dataset(nc_file)
        
        # Extract Thermal matrix
        data_matrix = ds['Rad'].values
        data_matrix = np.nan_to_num(data_matrix, nan=0.0)
        
        # Normalize to 0-255
        min_val, max_val = np.min(data_matrix), np.max(data_matrix)
        normalized = ((data_matrix - min_val) / (max_val - min_val) * 255).astype(np.uint8)
        
        # Crop the same 512x512 region from the center of the earth for every frame
        h, w = normalized.shape
        patch = normalized[h//2-256:h//2+256, w//2-256:w//2+256]
        
        # Save sequentially as frame_000.png, frame_001.png, frame_002.png
        output_path = os.path.join(processed_dir, f"frame_{i:03d}.png")
        cv2.imwrite(output_path, patch)
        
    print(f"\n[+] Successfully saved {len(nc_files)} real cloud patches to {processed_dir}/")

if __name__ == "__main__":
    process_sequence()
