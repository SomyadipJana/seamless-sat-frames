"""Optional U-Net used when PyTorch is installed. OpenCV optical flow is the default path."""

try:
    import torch
    import torch.nn as nn
except ImportError:  # pragma: no cover - exercised only when torch is present
    torch = None
    nn = None


if nn is not None:

    class DoubleConv(nn.Module):
        def __init__(self, in_channels, out_channels):
            super().__init__()
            self.double_conv = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
                nn.BatchNorm2d(out_channels),
                nn.ReLU(inplace=True),
                nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1),
                nn.BatchNorm2d(out_channels),
                nn.ReLU(inplace=True),
            )

        def forward(self, x):
            return self.double_conv(x)

    class SatelliteInterpolatorUNet(nn.Module):
        def __init__(self):
            super().__init__()
            self.inc = DoubleConv(6, 64)
            self.down1 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(64, 128))
            self.down2 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(128, 256))
            self.up1 = nn.ConvTranspose2d(256, 128, kernel_size=2, stride=2)
            self.conv_up1 = DoubleConv(256, 128)
            self.up2 = nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2)
            self.conv_up2 = DoubleConv(128, 64)
            self.outc = nn.Conv2d(64, 3, kernel_size=1)

        def forward(self, img0, img2):
            x = torch.cat([img0, img2], dim=1)
            x1 = self.inc(x)
            x2 = self.down1(x1)
            x3 = self.down2(x2)
            x_up = self.up1(x3)
            x_up = torch.cat([x_up, x2], dim=1)
            x_up = self.conv_up1(x_up)
            x_up = self.up2(x_up)
            x_up = torch.cat([x_up, x1], dim=1)
            x_up = self.conv_up2(x_up)
            motion_shift = torch.tanh(self.outc(x_up)) * 0.5
            base_blend = (img0 + img2) / 2.0
            return torch.clamp(base_blend + motion_shift, 0.0, 1.0)

else:
    SatelliteInterpolatorUNet = None
