import os
from PIL import Image

# Directory to scan
IMAGE_DIR = '/Users/prabhatkumar/ankit_web/verticalgarden-website/public/images'

# Configuration
MAX_WIDTH_HERO = 1920
MAX_WIDTH_CONTENT = 800
QUALITY = 80

def get_file_size(file_path):
    return os.path.getsize(file_path)

def optimize_image(file_path):
    try:
        filename = os.path.basename(file_path)
        name, ext = os.path.splitext(filename)
        
        # Skip if already webp or not an image
        if ext.lower() not in ['.png', '.jpg', '.jpeg']:
            return

        img = Image.open(file_path)
        
        # Determine target width
        width, height = img.size
        target_width = width
        
        # Logic: If it's likely a hero image (large width), cap at 1920
        # If it's a content image, cap at 800 (unless it's already smaller)
        # For simplicity in this batch, let's just cap everything at 1920 to be safe not to ruin quality,
        # but specifically for the very large ones we saw (service images), we might want to be more aggressive if we knew which was which.
        # Given the file sizes (8MB), they are likely huge.
        
        if width > MAX_WIDTH_HERO:
            target_width = MAX_WIDTH_HERO
        
        if target_width < width:
            ratio = target_width / width
            new_height = int(height * ratio)
            img = img.resize((target_width, new_height), Image.Resampling.LANCZOS)
            print(f"Resized {filename} from {width}x{height} to {target_width}x{new_height}")

        # Save as WebP
        new_filename = f"{name}.webp"
        new_path = os.path.join(os.path.dirname(file_path), new_filename)
        
        img.save(new_path, 'WEBP', quality=QUALITY)
        
        old_size = get_file_size(file_path)
        new_size = get_file_size(new_path)
        savings = (old_size - new_size) / old_size * 100
        
        print(f"Converted {filename}: {old_size/1024/1024:.2f}MB -> {new_size/1024/1024:.2f}MB ({savings:.1f}% savings)")
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                optimize_image(os.path.join(root, file))

if __name__ == "__main__":
    print("Starting optimization...")
    process_directory(IMAGE_DIR)
    print("Done.")
