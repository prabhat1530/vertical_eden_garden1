import os
from PIL import Image
import collections

def process_logo():
    input_path = 'src/images/images/logo-leaf.jpg'
    output_path = 'src/images/images/logo-leaf.webp'
    
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        # Try finding it if maybe I saved it elsewhere?
        # Actually I copied it to src/images/images/logo-leaf.jpg in previous turn
        return

    img = Image.open(input_path)
    img = img.convert("RGBA")
    
    datas = img.getdata()
    
    newData = []
    # Simple thresholding for white background
    for item in datas:
        # If pixel is very light (white-ish), make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    
    # Save transparent version
    img.save(output_path, "WEBP", quality=95)
    print(f"Saved transparent logo to {output_path}")
    
    # Color extraction (ignoring transparent/white pixels)
    colors = []
    for item in newData:
        if item[3] > 0: # not transparent
             colors.append(item[:3])
             
    # Get most common color that is GREEN-ish (G > R and G > B)
    # This filters out black/grey noise
    green_candidates = [c for c in colors if c[1] > c[0] and c[1] > c[2]]
    
    if green_candidates:
        most_common = collections.Counter(green_candidates).most_common(1)[0][0]
        print(f"Dominant Green: #{most_common[0]:02x}{most_common[1]:02x}{most_common[2]:02x}")
    else:
        print("Could not find dominant green.")

if __name__ == "__main__":
    process_logo()
