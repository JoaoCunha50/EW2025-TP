const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedFileTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'text/plain'
    ];

    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não suportado!'), false);
    }
};

const limits = {
    fileSize: 10 * 1024 * 1024,
    files: 10
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Erro específico do Multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. O limite é 5MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Número máximo de arquivos excedido.' });
    }
    return res.status(400).json({ error: `Erro no upload: ${err.message}` });
  } else if (err) {
    // Outros erros
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = {
  upload,
  handleMulterError
};