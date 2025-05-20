const multer = require('multer');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '../public');
const tempDir = path.join(__dirname, '../temp');
const aipDir = path.join(__dirname, '../public', 'uploads', 'AIP');

[tempDir, aipDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(aipDir, Date.now().toString())
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
    cb(null, zipFileName);

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

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Verifique o limite de tamanho.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Número máximo de arquivos excedido.' });
    }
    return res.status(400).json({ error: `Erro no upload: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = {
  upload,
  uploadSip,
  handleMulterError,
  publicDir,
  tempDir,
  aipDir
};