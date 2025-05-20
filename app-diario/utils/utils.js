const path = require('path');
const fs = require('fs');
const extract = require('extract-zip');
const { 
    aipDir 
} = require('../utils/multerConfig');

const validTags = [
    'experiences',
    'travel',
    'adventures',
    'food',
    'places',
    'studies',
    'literature',
    'nature'
];

function validateManifestFiles(manifest, extractDir) {
    if (!manifest.title || !manifest.content || manifest.isPublic === undefined) {
        console.error('Missing required manifest fields');
        return false;
    }

    if (manifest.tags && Array.isArray(manifest.tags)) {
        for (const tag of manifest.tags) {
            if (!validTags.includes(tag.toLowerCase())) {
                console.error(`Invalid tag in manifest: ${tag}`);
                return false;
            }
        }
    }

    const files = Array.isArray(manifest.files) ? manifest.files : [];
    for (const file of files) {
        try {
            const filePath = path.join(extractDir, file.path || file);
            if (!fs.existsSync(filePath)) {
                console.error(`File not found: ${filePath}`);
                return false;
            }
        } catch (error) {
            console.error(`Error checking file: ${error.message}`);
            return false;
        }
    }

    return true;
}

async function processFiles(manifest, extractDir) {
    const storageDir = path.join(aipDir, Date.now().toString());
    fs.mkdirSync(storageDir, { recursive: true });
    
    const files = Array.isArray(manifest.files) ? manifest.files : [];

    if(files.length >= 6) return []

    const processedFiles = [];
    
    for (const file of files) {
        const srcPath = path.join(extractDir, file.path);
        const fileName = path.basename(file.path);
        const destPath = path.join(storageDir, fileName);
        
        fs.copyFileSync(srcPath, destPath);
        
        const stats = fs.statSync(destPath);
        
        processedFiles.push({
            filename: fileName,
            path: `/uploads/AIP/${path.basename(storageDir)}/${fileName}`,
            type: file.type,
            size: stats.size
        });
    }
    
    return processedFiles;
}

function extractZip(zipPath, options) {
    return new Promise((resolve, reject) => {
        extract(zipPath, options)
            .then(() => resolve())
            .catch(err => reject(err));
    });
}

module.exports = {
    validateManifestFiles,
    processFiles,
    extractZip,
    validTags,
    local: {
        secret: 'ew2025'
    }
};