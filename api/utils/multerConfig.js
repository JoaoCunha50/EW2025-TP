const multer = require('multer');
const path = require('path');
const fs = require('fs');

const filestorageDir = path.join(__dirname, '..', 'public', 'fileStorage');
const tempDir = path.join(__dirname, '../temp');

[tempDir, filestorageDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(filestorageDir, Date.now().toString())
    fs.mkdirSync(dir, { recursive: true });
    req.storageDir = path.basename(dir)
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const sipStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = new Date() + '-' + Math.round(Math.random() * 1E9);
    const zipFileName = 'sip -' + uniqueSuffix

    if (!req.zipInfo) req.zipInfo = {};
    req.zipInfo.filename = zipFileName;
    cb(null, zipFileName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
      'text/plain',
      'application/msword',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed! Allowed types: PDF, Images, Text files'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 5
  }
});

const uploadSip = multer({
  storage: sipStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
      cb(null, true);
    } else {
      cb(new Error('O arquivo SIP deve ser um arquivo ZIP válido!'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 1
  }
});

module.exports = {
  upload,
  uploadSip,
  tempDir,
  filestorageDir
};