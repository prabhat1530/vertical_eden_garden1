import os
import re
import shutil
import json
from PIL import Image

SOURCE_DIR = '/Users/prabhatkumar/vertical_eden/new_image_video'
DEST_DIR = '/Users/prabhatkumar/vertical_eden/frontend/public/images'
MANIFEST_FILE = '/Users/prabhatkumar/vertical_eden/frontend/src/data/images.json'

MAX_WIDTH = 1200
QUALITY = 80

def sanitize_filename(filename):
    name, ext = os.path.splitext(filename)
    ext = ext.lower()
    
    # Change image extension to webp
    if ext in ['.jpg', '.jpeg', '.png']:
        target_ext = '.webp'
    elif ext == '.mp4':
        target_ext = '.mp4'
    else:
        return None, None
    
    # Sanitize name: alphanumeric and underscores only
    clean_name = name.lower()
    clean_name = re.sub(r'[^a-z0-9]', '_', clean_name)
    clean_name = re.sub(r'_+', '_', clean_name)
    clean_name = clean_name.strip('_')
    
    if not clean_name:
        clean_name = 'media'
        
    return clean_name, target_ext

def process_files():
    if not os.path.exists(SOURCE_DIR):
        print(f"Source directory not found: {SOURCE_DIR}")
        return
        
    if not os.path.exists(DEST_DIR):
        os.makedirs(DEST_DIR, exist_ok=True)
        
    # Load existing manifest if it exists
    existing_manifest = []
    if os.path.exists(MANIFEST_FILE):
        try:
            with open(MANIFEST_FILE, 'r') as f:
                existing_manifest = json.load(f)
                if not isinstance(existing_manifest, list):
                    existing_manifest = []
        except Exception as e:
            print(f"Error reading manifest: {e}")
            existing_manifest = []
            
    # Set to track unique filenames in public/images
    manifest_set = set(existing_manifest)
    new_additions = []
    
    files = sorted(os.listdir(SOURCE_DIR))
    print(f"Found {len(files)} files in source directory.")
    
    count = 0
    for filename in files:
        if filename.startswith('.'):
            continue
            
        clean_name, target_ext = sanitize_filename(filename)
        if not clean_name:
            continue
            
        source_path = os.path.join(SOURCE_DIR, filename)
        
        # Determine unique target name
        target_filename = f"{clean_name}{target_ext}"
        target_path = os.path.join(DEST_DIR, target_filename)
        
        counter = 1
        while os.path.exists(target_path):
            target_filename = f"{clean_name}_{counter}{target_ext}"
            target_path = os.path.join(DEST_DIR, target_filename)
            counter += 1
            
        try:
            if target_ext == '.webp':
                # Process image
                img = Image.open(source_path)
                
                # Check orientation using exif data if available and auto-rotate
                try:
                    if hasattr(img, '_getexif'):
                        exif = img._getexif()
                        if exif is not None:
                            orientation = exif.get(0x0112)
                            if orientation == 3:
                                img = img.rotate(180, expand=True)
                            elif orientation == 6:
                                img = img.rotate(270, expand=True)
                            elif orientation == 8:
                                img = img.rotate(90, expand=True)
                except Exception as exif_err:
                    # Ignore EXIF processing errors
                    pass
                
                width, height = img.size
                if width > MAX_WIDTH:
                    ratio = MAX_WIDTH / width
                    new_height = int(height * ratio)
                    img = img.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)
                
                # Convert to RGB mode if needed for webp saving (e.g. RGBA or CMYK)
                if img.mode in ('RGBA', 'LA'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[3]) # 3 is alpha
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                    
                img.save(target_path, 'WEBP', quality=QUALITY)
                print(f"Optimized image: {filename} -> {target_filename}")
                
            elif target_ext == '.mp4':
                # Copy video
                shutil.copy2(source_path, target_path)
                print(f"Copied video: {filename} -> {target_filename}")
                
            new_additions.append(target_filename)
            manifest_set.add(target_filename)
            count += 1
            
        except Exception as e:
            print(f"Error processing {filename}: {e}")
            
    # Combine lists preserving order: existing files first, then new files
    updated_manifest = []
    # Add existing ones in order
    for item in existing_manifest:
        if item in manifest_set:
            updated_manifest.append(item)
            manifest_set.discard(item)
            
    # Add new ones
    for item in new_additions:
        if item in manifest_set:
            updated_manifest.append(item)
            manifest_set.discard(item)
            
    # Save updated manifest
    with open(MANIFEST_FILE, 'w') as f:
        json.dump(updated_manifest, f, indent=2)
        
    print(f"\nProcessing complete. Processed {count} files successfully.")
    print(f"Total manifest count: {len(updated_manifest)}")

if __name__ == '__main__':
    process_files()
