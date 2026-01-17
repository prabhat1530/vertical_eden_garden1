const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, 'src/images/images');
const DEST_DIR = path.join(__dirname, 'public/images');
const MANIFEST_FILE = path.join(__dirname, 'src/data/images.json');
const DATA_DIR = path.join(__dirname, 'src/data');

// Ensure destination directories exist
if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const files = fs.readdirSync(SOURCE_DIR);
const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file));
const manifest = [];

imageFiles.forEach(file => {
    const ext = path.extname(file);
    const basename = path.basename(file, ext);

    // Sanitize filename: remove 'WhatsApp Image', dates, 'Copy', special chars
    let newName = basename
        .replace(/WhatsApp Image \d{4}-\d{2}-\d{2} at/, 'img') // Shorten WhatsApp
        .replace(/\(.*\)/g, '') // Remove parenthesis content like (1)
        .replace(/- Copy/g, '') // Remove Copy text
        .replace(/[^a-zA-Z0-9]/g, '_') // Replace non-alphanumeric with underscrore
        .replace(/_+/g, '_') // Collapse multiple underscores
        .replace(/^_|_$/g, '') // Trim underscores
        .toLowerCase();

    // Add randomness if name is too generic or empty, or collision
    if (!newName || newName === 'img') {
        newName = `img_${Math.random().toString(36).substring(7)}`;
    }

    // append original extension
    const finalName = `${newName}${ext.toLowerCase()}`;

    // Handle duplicates
    let counter = 1;
    let uniqueName = finalName;
    while (fs.existsSync(path.join(DEST_DIR, uniqueName))) {
        uniqueName = `${newName}_${counter}${ext.toLowerCase()}`;
        counter++;
    }

    fs.copyFileSync(path.join(SOURCE_DIR, file), path.join(DEST_DIR, uniqueName));
    manifest.push(uniqueName);
    console.log(`Moved: ${file} -> ${uniqueName}`);
});

fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
console.log(`Manifest written to ${MANIFEST_FILE} with ${manifest.length} images.`);
