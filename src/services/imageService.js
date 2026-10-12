const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { fromBuffer } = require('file-type');
const ApiError = require('../helpers/ApiError');

const { UPLOADS_DIR, THUMB_DIR, storeFile, removeFile } = require('./mediaStorage');

const ALLOWED_EXT_TO_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const THUMBNAIL_WIDTH = 320;
const JPEG_WEBP_PNG_QUALITY = 80;

function extFromOriginalName(originalName) {
  const ext = path.extname(originalName).toLowerCase().replace('.', '');
  return ext === 'jpeg' ? 'jpg' : ext;
}

function generateFilename(ext) {
  const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  return `${unique}.${ext}`;
}

/** Very small heuristic SVG validator - SVG has no fixed magic bytes since it's XML/text. */
function looksLikeSvg(buffer) {
  const head = buffer.slice(0, 2000).toString('utf8').trim().toLowerCase();
  return head.includes('<svg') || (head.startsWith('<?xml') && head.includes('<svg'));
}

/**
 * Validates a file buffer against the allowlist using real magic-byte
 * sniffing (never trusting the client-supplied mimetype/extension alone),
 * then processes it:
 *  - raster images (jpg/png/webp): compressed with sharp (~80 quality) +
 *    a 320px-wide thumbnail generated
 *  - svg: stored as-is (no raster processing possible/needed)
 *
 * Returns the fields needed to build a Media document.
 */
async function processAndStoreUpload(file) {
  const declaredExt = extFromOriginalName(file.originalname);

  if (!declaredExt || !['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(declaredExt)) {
    throw new ApiError(415, `Unsupported file extension for "${file.originalname}".`);
  }


  if (declaredExt === 'svg') {
    if (!looksLikeSvg(file.buffer)) {
      throw new ApiError(415, `File "${file.originalname}" does not look like a valid SVG.`);
    }

    const filename = generateFilename('svg');
    await storeFile(filename, file.buffer, 'image/svg+xml');

    return {
      filename,
      originalName: file.originalname,
      url: `/uploads/${filename}`,
      thumbnailUrl: '',
      mimeType: 'image/svg+xml',
      size: file.buffer.length,
      width: null,
      height: null,
    };
  }

  // Raster path: verify the real file type via magic bytes - never trust
  // the client's Content-Type or file extension alone.
  const sniffed = await fromBuffer(file.buffer);
  if (!sniffed || !ALLOWED_EXT_TO_MIME[sniffed.ext]) {
    throw new ApiError(
      415,
      `File "${file.originalname}" failed content-type verification (detected: ${sniffed ? sniffed.mime : 'unknown'}).`
    );
  }

  const realExt = sniffed.ext === 'jpeg' ? 'jpg' : sniffed.ext;
  const filename = generateFilename(realExt);
  const thumbFilename = `thumb-${filename}`;

  let pipeline = sharp(file.buffer).rotate(); // auto-orient
  const metadata = await pipeline.metadata();

  if (realExt === 'png') {
    pipeline = pipeline.png({ quality: JPEG_WEBP_PNG_QUALITY, compressionLevel: 8 });
  } else if (realExt === 'webp') {
    pipeline = pipeline.webp({ quality: JPEG_WEBP_PNG_QUALITY });
  } else {
    pipeline = pipeline.jpeg({ quality: JPEG_WEBP_PNG_QUALITY, mozjpeg: true });
  }

  const compressedBuffer = await pipeline.toBuffer();

  const thumbnailBuffer = await sharp(file.buffer)
    .rotate()
    .resize({ width: THUMBNAIL_WIDTH })
    .toFormat(realExt === 'png' ? 'png' : realExt === 'webp' ? 'webp' : 'jpeg', {
      quality: JPEG_WEBP_PNG_QUALITY,
    })
    .toBuffer();

  await storeFile(filename, compressedBuffer, ALLOWED_EXT_TO_MIME[realExt]);
  try {
    await storeFile(`thumb/${thumbFilename}`, thumbnailBuffer, ALLOWED_EXT_TO_MIME[realExt]);
  } catch (error) {
    await removeFile(filename);
    throw error;
  }

  return {
    filename,
    originalName: file.originalname,
    url: `/uploads/${filename}`,
    thumbnailUrl: `/uploads/thumb/${thumbFilename}`,
    mimeType: ALLOWED_EXT_TO_MIME[realExt],
    size: compressedBuffer.length,
    width: metadata.width || null,
    height: metadata.height || null,
  };
}

/** Removes a media file (and its thumbnail, if any) from disk given stored urls. */
async function deleteMediaFiles({ url, thumbnailUrl }) {
  const removals = [];
  if (url) {
    removals.push(removeFile(path.basename(url)));
  }
  if (thumbnailUrl) {
    removals.push(removeFile(`thumb/${path.basename(thumbnailUrl)}`));
  }
  await Promise.all(removals);
}

module.exports = {
  processAndStoreUpload,
  deleteMediaFiles,
  UPLOADS_DIR,
  THUMB_DIR,
};
