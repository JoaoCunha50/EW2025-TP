const express = require('express');
const router = express.Router();
const DiaryContent = require('../controllers/diaryContent');
const  { isAuthenticated, isAdmin } = require('../middleware/auth')
const { upload, tempDir, filestorageDir, uploadSip } = require('../utils/multerConfig');
const { processZipFile } = require('../utils/utils');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

const publicDir = path.join(__dirname, '..', 'public');

router.get('/', async (req, res) => {
    try {
        let query = {};
        if (req.query.isPublic) query.isPublic = req.query.isPublic === 'true';
        if (req.query.tags) query.tags = { $in: req.query.tags.split(',') };
        
        const entries = await DiaryContent.list(query);
        res.status(200).json(entries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const entry = await DiaryContent.getOne(req.params.id);
        if (!entry) return res.status(404).json({ error: 'Entry not found' });
        res.status(200).json(entry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/download/:id', async (req, res) => {
    try {
        const entry = await DiaryContent.getOne(req.params.id);
        if (!entry) return res.status(404).json({ error: 'Entry not found' });

        const manifesto = {
            title: entry.title,
            content: entry.content,
            createdAt: new Date(entry.createdAt).toLocaleString('pt-PT', {timeZone: 'Europe/Lisbon'}),
            isPublic: entry.isPublic,
            tags: entry.tags,
            producer: entry.producer || 'Unknown Producer',
            files: entry.files.map(file => ({
                filename: file.filename,
                path: (file.type && file.type.startsWith('image/') ? 'images/' : 'documents/') + file.filename,
                url: file.url,
                type: file.type,
            }))
        }

        const zipFilename = `DIP_${entry._id}.zip`;
        const tempDirPath = path.join(__dirname, '..', 'temp');
        
        if (!fs.existsSync(tempDirPath)) {
            fs.mkdirSync(tempDirPath, { recursive: true });
        }

        const zipFilePath = path.join(tempDirPath, zipFilename);
        const archive = archiver('zip', { zlib: { level: 9 } });
        const output = fs.createWriteStream(zipFilePath);

        output.on('close', () => {
            res.download(zipFilePath, zipFilename, (err) => {
                if (err) {
                    console.error(err);
                }
                fs.unlinkSync(zipFilePath);
            });
        });

        archive.pipe(output);

        archive.append(JSON.stringify(manifesto), { name: 'manifesto-DIP.json' });

        for (const file of entry.files) {
            let folderPath = '';
            
            if (file.type && file.type.startsWith('image/')) {
                folderPath = 'images/';
            } else if (file.type && file.type.startsWith('application/')) {
                folderPath = 'documents/';
            }
            
            const zipEntryName = folderPath + file.filename;
            archive.file(path.join(publicDir, file.path), { name: zipEntryName });
        }

        archive.finalize();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
})

router.post('/', isAuthenticated, isAdmin, uploadSip.single('sipFile'), async (req, res) => {
    try {
        const storageDir = path.join(filestorageDir, Date.now().toString());
        fs.mkdirSync(storageDir, { recursive: true });

        const zipFileName = req.zipInfo.filename;
        const zipFilePath = path.join(tempDir, zipFileName);

        const { metadata, files } = await processZipFile(zipFilePath, storageDir);

        if (!metadata) {
            fs.unlinkSync(zipFilePath);
            fs.rmSync(storageDir, { recursive: true, force: true });
            return res.status(400).json({ error: 'Invalid zip file, follow the instructions bellow' });
        }
        
        const diaryEntry = {
            producer: req.user.email,
            title: metadata.title,
            content: metadata.content,
            createdAt: new Date(),
            isPublic: metadata.isPublic || false,
            tags: metadata.tags,
            files: files,
            comments: []
        };

        const entry = await DiaryContent.create(diaryEntry);
        
        fs.unlinkSync(zipFilePath);
        
        res.status(201).json(entry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
    try {
        const post = JSON.parse(req.body.post);
        const id = req.params.id;

        if (!post.files) {
            post.files = [];
        }
        if (post.filesToDelete && Array.isArray(post.filesToDelete)) {
            for (const fileToDelete of post.filesToDelete) {
                try {
                    const filePath = path.join(publicDir, fileToDelete);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                    post.files = post.files.filter(file => file.path !== fileToDelete);
                } catch (error) {
                    console.error(`Error deleting file ${fileToDelete}:`, error);
                    res.status(500).json({ error: `Error deleting file ${fileToDelete}: ${error.message}` });
                }
            }
        }

        if (req.file) {
            let storageDir = req.storageDir;
            const newFile = {
                filename: req.file.originalname,
                path: `/fileStorage/${storageDir}/${req.file.originalname}`,
                url: `http://localhost:3000/fileStorage/${storageDir}/${req.file.originalname}`,
                type: req.file.mimetype,
                size: req.file.size
            };
            post.files.push(newFile);
        }
        
        const entry = await DiaryContent.update(id, post);
        if (!entry) return res.status(404).json({ error: 'Entry not found' });
        res.status(200).json(entry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const filesEntry = await DiaryContent.getOne(req.params.id);
        if (!filesEntry) {
            console.log(`Entry with ID ${req.params.id} not found`);
            return res.status(404).json({ error: 'Entry not found' })
        };
        if (filesEntry.files && filesEntry.files.length > 0) {
            for (const file of filesEntry.files) {
                fs.rmSync(path.dirname(path.join(publicDir, file.path)),{ recursive: true, force: true })
                break;
            }
            console.log(`All files for post ${req.params.id} have been deleted`);
        }

        const entry = await DiaryContent.delete(req.params.id);
        if (!entry) return res.status(404).json({ error: 'Entry not found' });

        res.status(200).json({ message: 'Entry deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/comments', isAuthenticated, async (req, res) => {
    try {
        const entry = await DiaryContent.addComment(req.params.id, {
            user: req.body.user,
            text: req.body.text
        });
        if (!entry) return res.status(404).json({ error: 'Entry not found' });
        res.status(200).json(entry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
