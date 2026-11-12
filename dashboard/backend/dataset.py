import os
import cv2
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader

class SatelliteFlowDataset(Dataset):
    def __init__(self, data_dir):
        """
        Expects a directory of extracted .png satellite patches named sequentially 
        (e.g., frame_001.png, frame_002.png, frame_003.png).
        """
        self.data_dir = data_dir
        # Sort files to ensure chronological order
        self.frames = sorted([f for f in os.listdir(data_dir) if f.endswith('.png')])
        
    def __len__(self):
        # We need groups of 3 frames, so total length is len - 2
        return len(self.frames) - 2

    def __getitem__(self, idx):
        # Load Frame 1, Frame 2 (Ground Truth), and Frame 3
        img0_path = os.path.join(self.data_dir, self.frames[idx])
        img1_path = os.path.join(self.data_dir, self.frames[idx+1]) # The one we want to predict
        img2_path = os.path.join(self.data_dir, self.frames[idx+2])

        # Read as grayscale (1-channel)
        img0 = cv2.imread(img0_path, cv2.IMREAD_GRAYSCALE)
        img1 = cv2.imread(img1_path, cv2.IMREAD_GRAYSCALE)
        img2 = cv2.imread(img2_path, cv2.IMREAD_GRAYSCALE)

        # HACKATHON TRICK: Duplicate 1-channel to 3-channel (Pseudo-RGB)
        # This allows us to use powerful pre-trained computer vision models!
        img0 = np.repeat(img0[:, :, np.newaxis], 3, axis=2)
        img1 = np.repeat(img1[:, :, np.newaxis], 3, axis=2)
        img2 = np.repeat(img2[:, :, np.newaxis], 3, axis=2)

        # Convert to PyTorch Tensors (Channels, Height, Width) and normalize to 0.0 - 1.0
        img0_tensor = torch.from_numpy(img0).permute(2, 0, 1).float() / 255.0
        img1_tensor = torch.from_numpy(img1).permute(2, 0, 1).float() / 255.0
        img2_tensor = torch.from_numpy(img2).permute(2, 0, 1).float() / 255.0

        # Return (Input 1, Input 2), Target
        return img0_tensor, img2_tensor, img1_tensor

# --- Quick Test to see if it works ---
if __name__ == "__main__":
    # Let's create a fake dummy directory to test this script
    os.makedirs("data/processed", exist_ok=True)
    
    # Generate 3 dummy images (simulating satellite patches)
    for i in range(3):
        dummy_img = np.random.randint(0, 255, (256, 256), dtype=np.uint8)
        cv2.imwrite(f"data/processed/frame_{i:03d}.png", dummy_img)
        
    # Test the loader
    dataset = SatelliteFlowDataset("data/processed")
    img0, img2, target = dataset[0]
    
    print(f"Dataset Loaded Successfully!")
    print(f"Input Frame 0 Shape: {img0.shape}") # Should be [3, 256, 256]
    print(f"Target Frame 1 Shape: {target.shape}")
