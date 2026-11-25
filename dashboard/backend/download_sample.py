"""Download one chronological sequence from the public NOAA GOES-18 archive."""

import argparse
from pathlib import Path
import shutil
from urllib.parse import urlencode
from urllib.request import urlopen
from xml.etree import ElementTree


ARCHIVE = "https://noaa-goes18.s3.amazonaws.com/"


def download_sequence(day, hour, count, output):
    prefix = f"ABI-L1b-RadF/{day.year}/{day.timetuple().tm_yday:03d}/{hour:02d}/"
    query = urlencode({"list-type": 2, "prefix": prefix})
    with urlopen(ARCHIVE + "?" + query, timeout=25) as remote:
        listing = ElementTree.parse(remote)
    keys = sorted(entry.text for entry in listing.findall(".//{*}Key")
                  if entry.text and "M6C13" in entry.text)
    if len(keys) < count:
        raise SystemExit(f"Expected {count} Channel 13 scans under {prefix}; found {len(keys)}.")
    output.mkdir(parents=True, exist_ok=True)
    for key in keys[:count]:
        target = output / key.rsplit("/", 1)[1]
        if target.exists():
            continue
        partial = target.with_suffix(".partial")
        print(f"Downloading {target.name}", flush=True)
        with urlopen(ARCHIVE + key, timeout=45) as remote, partial.open("wb") as local:
            shutil.copyfileobj(remote, local)
        partial.replace(target)


if __name__ == "__main__":
    from datetime import date

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--date", type=date.fromisoformat, default=date(2024, 1, 1))
    parser.add_argument("--hour", type=int, choices=range(24), default=12)
    parser.add_argument("--count", type=int, choices=range(3, 7), default=3)
    parser.add_argument("--output", type=Path, default=Path("data/raw"))
    args = parser.parse_args()
    download_sequence(args.date, args.hour, args.count, args.output)
