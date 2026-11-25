"""Train the reference residual U-Net on ordered, calibrated thermal PNGs."""

import argparse
from pathlib import Path

import torch
from torch.utils.data import ConcatDataset, DataLoader, RandomSampler

from dataset import SatelliteFlowDataset
from model import SatelliteInterpolatorUNet


def train(args):
    torch.manual_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() and not args.cpu else "cpu")
    if device.type == "cpu":
        torch.set_num_threads(args.threads)

    sequences = [SatelliteFlowDataset(path, args.patch_size) for path in args.data_dir]
    if any(len(sequence) == 0 for sequence in sequences):
        raise ValueError("Each input directory needs at least three consecutive thermal frames.")
    dataset = ConcatDataset(sequences)
    sampler = RandomSampler(dataset, replacement=True, num_samples=args.steps) if args.steps else None
    loader = DataLoader(dataset, batch_size=args.batch_size, sampler=sampler, shuffle=sampler is None)

    model = SatelliteInterpolatorUNet().to(device)
    loss_fn = torch.nn.L1Loss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
    print(f"Training on {device} with {len(dataset)} temporal triplets", flush=True)
    for epoch in range(args.epochs):
        running_loss = 0
        for first, last, target in loader:
            optimizer.zero_grad()
            loss = loss_fn(model(first.to(device), last.to(device)), target.to(device))
            loss.backward()
            optimizer.step()
            running_loss += loss.item()
        print(f"Epoch {epoch + 1}/{args.epochs}: L1 {running_loss / len(loader):.6f}", flush=True)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.cpu().state_dict(), args.output)
    print(f"Saved {args.output}", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", nargs="+", default=["data/processed"])
    parser.add_argument("--output", type=Path, default=Path("models/satellite_interpolator.pth"))
    parser.add_argument("--epochs", type=int, default=200)
    parser.add_argument("--patch-size", type=int, default=128,
                        help="Side length of the shared random crop, divisible by four")
    parser.add_argument("--steps", type=int, help="Number of randomly sampled patches per epoch")
    parser.add_argument("--batch-size", type=int, default=1)
    parser.add_argument("--threads", type=int, default=4)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--cpu", action="store_true")
    args = parser.parse_args()
    if args.patch_size < 4 or args.patch_size % 4:
        parser.error("--patch-size must be a positive multiple of four")
    if min(args.epochs, args.threads, args.batch_size, args.steps or 1) < 1:
        parser.error("Epochs, steps, batch size and threads must be positive")
    train(args)
