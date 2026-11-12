import s3fs
import os

print("Connecting to NOAA AWS S3...")
fs = s3fs.S3FileSystem(anon=True)

# Pointing to Jan 1, 2024, 12:00 UTC
bucket_path = 'noaa-goes18/ABI-L1b-RadF/2024/001/12/'
print(f"Searching for files in: {bucket_path}")

files = fs.ls(bucket_path)
# Filter for Channel 13 (Thermal Infrared) and sort chronologically
c13_files = sorted([f for f in files if "M6C13" in f])

# Grab exactly 3 consecutive frames
target_files = c13_files[:3]

if len(target_files) < 3:
    print("Error: Could not find 3 consecutive files.")
else:
    os.makedirs("data/raw", exist_ok=True)
    
    for i, file_path in enumerate(target_files):
        filename = os.path.basename(file_path)
        output_path = f"data/raw/{filename}"
        
        if not os.path.exists(output_path):
            print(f"Downloading Frame {i+1}/3: {filename}...")
            fs.get(file_path, output_path)
        else:
            print(f"Frame {i+1}/3 already exists: {filename}")
            
    print("\n[+] Successfully downloaded 3 consecutive satellite frames!")
