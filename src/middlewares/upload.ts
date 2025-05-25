import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary';
import { ApiError } from '../utils/apiError';
import { HTTP_STATUS, ERROR_MESSAGES, FILE_TYPES, MAX_FILE_SIZE } from '../constants';

// Cloudinary storage configuration for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'servicehub/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }],
  } as any,
});

// Cloudinary storage configuration for documents
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'servicehub/documents',
    allowed_formats: ['pdf', 'doc', 'docx'],
    resource_type: 'raw',
  } as any,
});

// File filter function
const fileFilter = (allowedTypes: string[]) => {
  return (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_FILE_TYPE));
    }
  };
};

// Image upload middleware
export const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: MAX_FILE_SIZE.IMAGE,
  },
  fileFilter: fileFilter(FILE_TYPES.IMAGES),
});

// Document upload middleware
export const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: MAX_FILE_SIZE.DOCUMENT,
  },
  fileFilter: fileFilter(FILE_TYPES.DOCUMENTS),
});

// Multiple image upload
export const uploadMultipleImages = multer({
  storage: imageStorage,
  limits: {
    fileSize: MAX_FILE_SIZE.IMAGE,
    files: 5, // Maximum 5 files
  },
  fileFilter: fileFilter(FILE_TYPES.IMAGES),
});

// Handle multer errors
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.FILE_TOO_LARGE));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Too many files uploaded'));
    }
  }
  next(error);
};