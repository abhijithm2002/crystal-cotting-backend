const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads'));
const THUMB_DIR = path.join(UPLOADS_DIR, 'thumb');
function usesGridFS() {
  const storage = process.env.MEDIA_STORAGE || (process.env.NODE_ENV === 'production' ? 'gridfs' : 'disk');
  if (!['gridfs', 'disk'].includes(storage)) throw new Error('MEDIA_STORAGE must be gridfs or disk');
  return storage === 'gridfs';
}
function bucket() {
  if (!mongoose.connection.db) throw new Error('MongoDB must be connected before storing images');
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'media_files' });
}
async function storeFile(filename, buffer, contentType) {
  if (usesGridFS()) {
    await pipeline(Readable.from([buffer]), bucket().openUploadStream(filename, { metadata: { contentType } }));
  } else {
    const target = path.join(UPLOADS_DIR, filename);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buffer);
  }
}
async function removeFile(filename) {
  if (mongoose.connection.db) {
    const storage = bucket();
    const files = await storage.find({ filename }).toArray();
    for (const file of files) await storage.delete(file._id);
  }
  await fs.rm(path.join(UPLOADS_DIR, filename), { force: true });
}
// Mounted after express.static: preserves older disk-backed URLs while serving
// durable images from MongoDB even after Render replaces its filesystem.
async function serveStoredFile(req, res, next) {
  try {
    const filename = req.path.replace(/^\//, '');
    if (!/^(thumb\/)?[\w.-]+\.(jpg|jpeg|png|webp|svg)$/i.test(filename) || !mongoose.connection.db) return next();
    const storage = bucket();
    const [file] = await storage.find({ filename }).limit(1).toArray();
    if (!file) return next();
    res.type(file.metadata?.contentType || 'application/octet-stream');
    res.set('Content-Length', String(file.length));
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (req.method === 'HEAD') return res.end();
    await pipeline(storage.openDownloadStream(file._id), res);
  } catch (error) {
    if (res.headersSent) res.destroy(error);
    else next(error);
  }
}
module.exports = { UPLOADS_DIR, THUMB_DIR, storeFile, removeFile, serveStoredFile };
