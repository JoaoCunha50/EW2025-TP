const JSZip = require('jszip');
const fs = require('fs').promises;
const path = require('path');
const mime = require('mime-types');

async function processZipFile(zipPath, storageDir) {
    const zipData = await fs.readFile(zipPath);
    const zip = await JSZip.loadAsync(zipData);
    const metadata = {};
    const files = [];

    const manifest = zip.file('manifesto-SIP.json');
    if (!manifest) {
        return {
            error: 'Invalid manifest file',
        };
    }

    const manifestContent = await manifest.async('string');
    const manifestData = JSON.parse(manifestContent);
    
    const isValid = await validateManifestFiles(manifestData, zip);
    if (!isValid) {
        return {
            error: 'Invalid manifest file',
        };
    }

    for (const [filename, file] of Object.entries(zip.files)) {
        if (file.dir) continue;

        if (filename === 'manifesto-SIP.json') {
            Object.assign(metadata, manifestData);
        } else {
            const content = await file.async('nodebuffer');
            const fileName = path.basename(filename);
            const filePath = path.join(storageDir, fileName);

            await fs.writeFile(filePath, content);
            
            const mimeType = mime.lookup(fileName);
            
            files.push({
                filename: fileName,
                path: `/fileStorage/${path.basename(storageDir)}/${fileName}`,
                url: `http://localhost:3000/fileStorage/${path.basename(storageDir)}/${fileName}`,
                type: mimeType,
                size: content.length
            });
        }
    }

    return {
        metadata,
        files
    };
}

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

async function validateManifestFiles(manifest, zip) {
    try {
        if (!manifest.title || typeof manifest.title !== 'string') {
            console.error('Missing or invalid title field in manifest');
            return false;
        }

        if (!manifest.content || typeof manifest.content !== 'string') {
            console.error('Missing or invalid content field in manifest');
            return false;
        }

        if (manifest.tags) {
            if (!Array.isArray(manifest.tags)) {
                console.error('Tags field must be an array');
                return false;
            }

            for (const tag of manifest.tags) {
                if (typeof tag !== 'string') {
                    console.error(`Invalid tag type: ${typeof tag}`);
                    return false;
                }
                
                if (!validTags.includes(tag.toLowerCase())) {
                    console.error(`Invalid tag in manifest: ${tag}. Valid tags are: ${validTags.join(', ')}`);
                    return false;
                }
            }
        }

        if (manifest.files && Array.isArray(manifest.files)) {
            for (const fileRef of manifest.files) {
                const fileName = fileRef.filename || fileRef.path;
                
                if (!fileName) {
                    console.error('Invalid file reference in manifest - missing filename/path');
                    return false;
                }

                const fileInZip = zip.file(fileName);
                if (!fileInZip) {
                    console.error(`File referenced in manifest not found in ZIP: ${fileName}`);
                    return false;
                }

                if (fileInZip.dir) {
                    console.error(`File reference points to a directory: ${fileName}`);
                    return false;
                }
            }
        }

        return true;
    } catch (error) {
        console.error(`Error during manifest validation: ${error.message}`);
        return false;
    }
}

async function validateZipStructure(zip) {
    const requiredFiles = ['manifesto-SIP.json'];
    const foundFiles = Object.keys(zip.files);
    
    for (const required of requiredFiles) {
        if (!foundFiles.includes(required)) {
            console.error(`Required file missing: ${required}`);
            return false;
        }
    }
    
    return true;
}

module.exports = { 
    processZipFile, 
    validateManifestFiles,
    validateZipStructure,
    validTags 
};