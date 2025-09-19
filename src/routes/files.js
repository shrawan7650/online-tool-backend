import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import asyncHandler from 'express-async-handler';
import { createFileShare, retrieveFileShare } from '../services/fileService.js';
import 'dotenv/config';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Missing Cloudinary configuration in environment variables');
}

console.log('Cloudinary configuration:', {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 2
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

// Rate limiting
const fileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    ok: false,
    error: {
      code: 'FILE_RATE_LIMIT',
      message: 'Too many file operations, please try again later'
    }
  }
});

// Validation schemas
const UploadSchema = z.object({
  expiresIn: z.enum(['5m', '1h', '24h', '7d']).default('24h')
});

const RetrieveSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits')
});

// Upload files
router.post('/upload', fileLimiter, upload.array('files', 2), asyncHandler(async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({
      ok: false,
      error: { code: 'NO_FILES', message: 'No files provided' }
    });
  }

  if (files.length > 2) {
    return res.status(400).json({
      ok: false,
      error: { code: 'TOO_MANY_FILES', message: 'Maximum 2 files allowed' }
    });
  }

  const { expiresIn } = UploadSchema.parse(req.body);

  try {
    const uploadResults = await Promise.all(files.map(file => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto', folder: 'file-sharing', public_id: `${Date.now()}-${file.originalname}` },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
    }));

    const result = await createFileShare({
      files: uploadResults.map((upload, index) => ({
        filename: files[index].originalname,
        url: upload.secure_url,
        publicId: upload.public_id,
        size: upload.bytes,
        type: upload.resource_type
      })),
      expiresIn,
      createdIp: req.ip || 'unknown'
    });

    res.status(201).json(result);

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      ok: false,
      error: { code: 'UPLOAD_FAILED', message: 'Failed to upload files' }
    });
  }
}));

// Retrieve files
router.post('/retrieve', asyncHandler(async (req, res) => {
  const { code } = RetrieveSchema.parse(req.body);

  const result = await retrieveFileShare(code);

  if (!result) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'File not found or expired' }
    });
  }

  res.json(result);
}));

export default router;
