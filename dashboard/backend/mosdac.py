"""Read-only adapter for MOSDAC's public gallery products."""

from datetime import datetime, timedelta, timezone
from functools import lru_cache
import json
from pathlib import PurePosixPath
import re
import time
from urllib.request import Request, urlopen


GALLERY = "https://mosdac.gov.in/gallery/getImage.php"
IMAGE_ROOT = "https://mosdac.gov.in/look/"
IST = timezone(timedelta(hours=5, minutes=30))
MONTHS = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split()
PRODUCTS = {
    "satellite": ("3SIMG_*_L1B_STD_IR1_V*.jpg", "3S_IMG/preview"),
    "radar": ("RCTLS_*_L2B_STD_MAXZ.gif", "DWR/RCTLS"),
    "weather": ("WRF5K_*_TEMP.jpg", "WRF/gallery"),
    "ocean": ("REGNL_*_SWH.gif", "AOSF/REGNL/gallery"),
}
IMAGE_PATH = re.compile(r"[a-zA-Z0-9/_-]+\.(jpg|gif|png)", re.ASCII)
FRAME_NAME = re.compile(r"^[^_]+_(\d{2})([A-Z]{3})(\d{4})_(\d{4,6})Z?_")


def frame_metadata(path, product):
    filename = PurePosixPath(path).name
    match = FRAME_NAME.match(filename)
    if match is None:
        return None
    day, month, year, clock = match.groups()
    try:
        date = datetime(int(year), MONTHS.index(month) + 1, int(day), tzinfo=timezone.utc)
        if product == "weather":
            return {"run_date": date.date().isoformat(), "lead_hours": int(clock) / 100}
        stamp = date.replace(hour=int(clock[:2]), minute=int(clock[2:4]), second=int(clock[4:] or 0))
    except ValueError:
        return None
    return {"timestamp": stamp.isoformat()}


@lru_cache(maxsize=24)
def _fetch_gallery(product, date, cache_window):
    pattern, directory = PRODUCTS[product]
    payload = json.dumps({"prod": pattern, "st_date": date, "count": 24}).encode()
    request = Request(GALLERY, data=payload, headers={"Content-Type": "application/json"})
    with urlopen(request, timeout=8) as response:
        raw = response.read(128 * 1024 + 1)
    if len(raw) > 128 * 1024:
        raise ValueError("MOSDAC gallery response exceeded the expected size.")
    listing = json.loads(raw)
    if not isinstance(listing, list) or not listing or not isinstance(listing[0], str):
        raise ValueError("Unexpected MOSDAC gallery response.")
    frames = []
    for path in dict.fromkeys(listing[0].split(",")):
        if not IMAGE_PATH.fullmatch(path) or not path.startswith(directory + "/"):
            continue
        metadata = frame_metadata(path, product)
        if metadata is not None:
            frames.append({"url": IMAGE_ROOT + path, **metadata})
    return {
        "frames": frames,
        "requested_date": date,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


def latest_gallery(product):
    # Start a new cache window each minute and whenever the IST date changes.
    date = datetime.now(IST).date().isoformat()
    return _fetch_gallery(product, date, int(time.time() // 60))
