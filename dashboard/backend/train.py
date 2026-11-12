import torch
import torch.nn as nn
import torch.optim as optim
import torch_directml
from torch.utils.data import DataLoader
import os

# Import your custom modules
from dataset import SatelliteFlowDataset
from model import SatelliteInterpolatorUNet

def train_model():
    # 1. Setup AMD GPU via DirectML
    device = torch_directml.device()
    print(f"[*] Training on device: {device}")

    # 2. Initialize Model
    model = SatelliteInterpolatorUNet().to(device)
    
    # 3. Setup Dataset
    # Make sure you have at least 3 images in data/processed/ for this to work
    dataset = SatelliteFlowDataset("data/processed")
    dataloader = DataLoader(dataset, batch_size=1, shuffle=True)
    
    # 4. Loss Function and Optimizer
    criterion = nn.L1Loss() # L1 Loss (Mean Absolute Error) is best for sharp images
    optimizer = optim.Adam(model.parameters(), lr=1e-4)
    
    epochs = 200
    print("[*] Starting Training Loop...")
    
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        
        for batch_idx, (img0, img2, target) in enumerate(dataloader):
            # Move data to AMD GPU
            img0 = img0.to(device)
            img2 = img2.to(device)
            target = target.to(device)
            
            # Zero gradients
            optimizer.zero_grad()
            
            # Forward pass: Predict intermediate frame
            pred_frame = model(img0, img2)
            
            # Calculate error
            loss = criterion(pred_frame, target)
            
            # Backward pass & Optimize
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            
        print(f"Epoch [{epoch+1}/{epochs}] - Loss: {running_loss/len(dataloader):.4f}")
        
    # Save the trained weights!
    os.makedirs("models", exist_ok=True)
    torch.save(model.state_dict(), "models/satellite_interpolator.pth")
    print("[+] Model saved to models/satellite_interpolator.pth")

if __name__ == "__main__":
    train_model()
