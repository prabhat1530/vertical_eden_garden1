import json
import os
from PIL import Image

# Paths
json_path = 'src/data/images.json'
images_dir = 'public/images'

# Load JSON
with open(json_path, 'r') as f:
    image_list = json.load(f)

valid_images = []
removed_count = 0
converted_count = 0

print(f"Checking {len(image_list)} images...")

for img_name in image_list:
    webp_path = os.path.join(images_dir, img_name)
    
    # Check if WebP exists
    if os.path.exists(webp_path):
        valid_images.append(img_name)
        continue
        
    # If WebP doesn't exist, check if we have a source file to convert
    # The list currently has .webp extensions (due to my sed command)
    # We need to guess the original extension
    base_name = os.path.splitext(img_name)[0]
    
    source_found = False
    for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
        source_path = os.path.join(images_dir, base_name + ext)
        if os.path.exists(source_path):
            try:
                print(f"Converting {base_name}{ext} to WebP...")
                img = Image.open(source_path)
                # Resize if needed (for gallery consistency, optional but good)
                if img.width > 1200:
                     ratio = 1200 / img.width
                     img = img.resize((1200, int(img.height * ratio)), Image.Resampling.LANCZOS)
                
                img.save(webp_path, 'WEBP', quality=80)
                valid_images.append(img_name)
                converted_count += 1
                source_found = True
                break
            except Exception as e:
                print(f"Failed to convert {source_path}: {e}")
    
    if not source_found:
        print(f"Removing {img_name} (File not found)")
        removed_count += 1

# Save updated JSON
with open(json_path, 'w') as f:
    json.dump(valid_images, f, indent=2)

print(f"Done. Retained: {len(valid_images)}. Converted: {converted_count}. Removed: {removed_count}.")
