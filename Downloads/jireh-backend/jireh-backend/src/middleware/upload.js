const multer = require('multer');
const path = require('path');

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];

// Memory storage: we need the full buffer in-hand to run magic-byte
// sniffing (file-type) and sharp processing before anything touches disk.
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
    err.message = `File extension "${ext}" is not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
    return cb(err);
  }
  cb(null, true);
}

// Accepts either a single `file` field or multiple `files` (bulk) - .any()
// lets both field names through; the controller treats req.files uniformly.
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 20 },
  fileFilter,
}).any();

module.exports = { upload, MAX_FILE_SIZE, ALLOWED_EXTENSIONS };
