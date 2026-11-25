"""Load overlapping triplets from a single chronological satellite sequence."""

from pathlib import Path

import cv2
import torch
from torch.utils.data import Dataset


class SatelliteFlowDataset(Dataset):
    def __init__(self, directory, patch_size):
        self.frames = []
        self.patch_size = patch_size
        for path in sorted(Path(directory).glob("frame_*.png")):
            image = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
            if image is None or min(image.shape) < patch_size:
                raise ValueError(f"{path} must be a readable image at least {patch_size} pixels per side.")
            if self.frames and self.frames[-1].shape != image.shape:
                raise ValueError(f"{path} must match the other frames in its sequence.")
            self.frames.append(image)

    def __len__(self):
        return max(0, len(self.frames) - 2)

    def __getitem__(self, index):
        height, width = self.frames[index].shape
        size = self.patch_size
        y = torch.randint(height - size + 1, ()).item()
        x = torch.randint(width - size + 1, ()).item()

        def tensor(offset):
            patch = self.frames[index + offset][y:y + size, x:x + size]
            return torch.from_numpy(patch.copy())[None].repeat(3, 1, 1).float() / 255

        return tensor(0), tensor(2), tensor(1)
