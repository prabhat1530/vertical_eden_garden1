from PIL import Image
import os

files = [
    '/Users/prabhatkumar/ankit_web/verticalgarden-website/src/images/images/about-hero-premium.png',
    '/Users/prabhatkumar/ankit_web/verticalgarden-website/src/images/images/about-mission-authentic.png',
    '/Users/prabhatkumar/ankit_web/verticalgarden-website/src/images/images/about-team-authentic.png'
]

for f in files:
    try:
        if not os.path.exists(f):
            print(f"File not found: {f}")
            continue
            
        img = Image.open(f)
        # Resize if too huge (hero max 1920, others smaller)
        if 'hero' in f:
            if img.width > 1920:
                ratio = 1920 / img.width
                img = img.resize((1920, int(img.height * ratio)), Image.Resampling.LANCZOS)
        else:
             if img.width > 1200:
                ratio = 1200 / img.width
                img = img.resize((1200, int(img.height * ratio)), Image.Resampling.LANCZOS)
        
        webp_path = f.replace('.png', '.webp')
        img.save(webp_path, 'WEBP', quality=85)
        print(f"Converted {f} to {webp_path}")
    except Exception as e:
        print(f"Error {f}: {e}")
