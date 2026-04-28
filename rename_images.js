const fs = require('fs');
const path = require('path');

const publicImagesDir = path.join(__dirname, 'frontend/public/images');
const imagesJsonPath = path.join(__dirname, 'frontend/src/data/images.json');

const imagesJson = JSON.parse(fs.readFileSync(imagesJsonPath, 'utf8'));
const newImagesList = [];

// Helper to slugify a filename
const slugify = (filename) => {
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase();
    return safeName + ext;
};

// Rename files
for (const originalName of imagesJson) {
    const oldPath = path.join(publicImagesDir, originalName);
    if (fs.existsSync(oldPath)) {
        let newName = slugify(originalName);
        
        // Ensure uniqueness
        let counter = 1;
        while (newImagesList.includes(newName)) {
            const ext = path.extname(newName);
            const base = path.basename(newName, ext);
            newName = `${base}-${counter}${ext}`;
            counter++;
        }
        
        const newPath = path.join(publicImagesDir, newName);
        fs.renameSync(oldPath, newPath);
        newImagesList.push(newName);
        console.log(`Renamed: ${originalName} -> ${newName}`);
    } else {
        console.log(`File not found: ${originalName}`);
        // If it's already renamed or missing, just keep original to avoid breaking array length
        newImagesList.push(originalName);
    }
}

// Update images.json
fs.writeFileSync(imagesJsonPath, JSON.stringify(newImagesList, null, 2));
console.log('Updated images.json');
