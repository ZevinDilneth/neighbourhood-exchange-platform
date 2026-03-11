import multer from 'multer';
import { Request } from 'express';

const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_MIME = ['video/webm', 'video/mp4', 'video/ogg', 'video/quicktime'];

const imageFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (IMAGE_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
  }
};

const videoFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (VIDEO_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only WebM, MP4, OGG, and MOV videos are allowed'));
  }
};

// Memory storage — buffer is uploaded to S3 in the controller
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: imageFilter,
});

// Video upload — up to 50 MB
export const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: videoFilter,
});
