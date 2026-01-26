import os
from PIL import Image

# Directories to scan
DIRECTORIES_TO_SCAN = [
    '/Users/prabhatkumar/ankit_web/verticalgarden-website/public/images',
    '/Users/prabhatkumar/ankit_web/verticalgarden-website/src/images',
    '/Users/prabhatkumar/ankit_web/verticalgarden-website/src/assets'
]

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

        # check if optimized version already exists
        new_filename = f"{name}.webp"
        new_path = os.path.join(os.path.dirname(file_path), new_filename)
        
        if os.path.exists(new_path):
             return # Skip if already optimized

        img = Image.open(file_path)
        
        # Determine target width
        width, height = img.size
        target_width = width
        
        if width > MAX_WIDTH_HERO:
            target_width = MAX_WIDTH_HERO
        
        if target_width < width:
            ratio = target_width / width
            new_height = int(height * ratio)
            img = img.resize((target_width, new_height), Image.Resampling.LANCZOS)
            print(f"Resized {filename} from {width}x{height} to {target_width}x{new_height}")

        # Save as WebP
        img.save(new_path, 'WEBP', quality=QUALITY)
        
        old_size = get_file_size(file_path)
        new_size = get_file_size(new_path)
        
        if old_size > 0:
            savings = (old_size - new_size) / old_size * 100
        else:
            savings = 0
        
        print(f"Converted {filename}: {old_size/1024/1024:.2f}MB -> {new_size/1024/1024:.2f}MB ({savings:.1f}% savings)")
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

def process_directory(directory):
    if not os.path.exists(directory):
        print(f"Directory not found: {directory}")
        return

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                optimize_image(os.path.join(root, file))

if __name__ == "__main__":
    print("Starting optimization...")
    for directory in DIRECTORIES_TO_SCAN:
        print(f"Scanning {directory}...")
        process_directory(directory)
    print("Done.")
