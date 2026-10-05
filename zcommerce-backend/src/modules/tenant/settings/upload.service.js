import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import storageConfig from '../../../app/config/storage.config.js';
import { ValidationError } from '../../../shared/exceptions/index.js';

const EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
};

/** Multer instance: disk storage under storage/uploads/<tenant_id>/, images only, size-limited. */
export const uploader = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const dir = path.join(storageConfig.uploadsDir, req.tenant.id);
      fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
    },
    filename: (_req, file, cb) => {
      const ext = EXT[file.mimetype] || path.extname(file.originalname).toLowerCase() || '';
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: storageConfig.maxFileSize, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!storageConfig.allowedMimes.includes(file.mimetype)) {
      return cb(ValidationError.field('file', 'Only image files (jpg, png, gif, webp, svg, avif) are allowed'));
    }
    return cb(null, true);
  },
});

export class UploadService {
  /** Describe a stored file in the contract shape { url, path, size, mime }. */
  describe(tenantId, file) {
    if (!file) throw ValidationError.field('file', 'A file is required (multipart field "file")');
    const relative = `uploads/${tenantId}/${file.filename}`;
    return { url: `${storageConfig.publicUrl}/${relative}`, path: relative, size: file.size, mime: file.mimetype };
  }
}
