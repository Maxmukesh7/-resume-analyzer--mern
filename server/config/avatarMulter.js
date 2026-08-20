import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ApiError from '../utils/apiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const avatarUploadDir = path.join(__dirname, '../uploads/avatars');

// Ensure uploads/avatars folder exists
if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}

// Storage Configuration for user avatar images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarUploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?._id ? req.user._id.toString() : 'user';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`);
  }
});

// Allowed Image Formats: JPG, JPEG, PNG, WEBP
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidExt = allowedExtensions.includes(ext);
  const isValidMime = allowedMimeTypes.includes(file.mimetype);

  if (isValidExt && isValidMime) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        'Invalid image format. Supported formats are JPG, JPEG, PNG, and WEBP.'
      ),
      false
    );
  }
};

// 5MB maximum file size limit
const maxAvatarSize = 5 * 1024 * 1024;

const avatarUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxAvatarSize,
    files: 1
  }
});

export default avatarUpload;
export { avatarUploadDir };
