const path = require('path');
const fs = require('fs');
const extract = require('extract-zip');
const { 
    aipDir 
} = require('../utils/multerConfig');

function validateManifestFiles(manifest, extractDir) {
    const files = Array.isArray(manifest.files) ? manifest.files : [];
    
    for (const file of files) {
        const filePath = path.join(extractDir, file.path || file);
        if (!fs.existsSync(filePath)) {
            console.error(`File referenced in manifest does not exist: ${file.path || file}`);
            return false;
        }
    }
    
    return true;
}

async function processFiles(manifest, extractDir) {
    const storageDir = path.join(aipDir, Date.now().toString());
    fs.mkdirSync(storageDir, { recursive: true });
    
    const files = Array.isArray(manifest.files) ? manifest.files : [];
    const processedFiles = [];
    
    for (const file of files) {
        const srcPath = path.join(extractDir, file.path || file);
        const fileName = path.basename(file.path || file);
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
    extractZip
};