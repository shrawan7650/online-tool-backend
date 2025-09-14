import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import asyncHandler from 'express-async-handler';
import { createFileShare, retrieveFileShare } from '../services/fileService.js';
// Ensure environment variables are loaded
import 'dotenv/config';

// Import necessary modules and types


const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Ensure environment variables are set
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Missing Cloudinary configuration in environment variables');
}
//debug
console.log('Cloudinary configuration:', {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET
});
// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 2
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types but check size
    cb(null, true);
  }
});

// Rate limiting for file operations
const fileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 file operations per 15 minutes
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
  const files = req.files as Express.Multer.File[];
      console.log("files",files);
  if (!files || files.length === 0) {
    res.status(400).json({
      ok: false,
      error: {
        code: 'NO_FILES',
        message: 'No files provided'
      }
    });
    return;
  }

  if (files.length > 2) {
    res.status(400).json({
      ok: false,
      error: {
        code: 'TOO_MANY_FILES',
        message: 'Maximum 2 files allowed'
      }
    });
    return;
  }

  const { expiresIn } = UploadSchema.parse(req.body);

  try {
    // Upload files to Cloudinary
    const uploadPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'file-sharing',
            public_id: `${Date.now()}-${file.originalname}`,
            // Set auto-delete for 5m option
            ...(expiresIn === '5m' && {
              invalidate: true,
              overwrite: true
            })
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
    });

    const uploadResults = await Promise.all(uploadPromises) as any[];
    
    // Create file share record
    const result = await createFileShare({
      files: uploadResults.map(upload => ({
        filename: files[uploadResults.indexOf(upload)].originalname,
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
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Failed to upload files'
      }
    });
  }
}));

// Retrieve files
router.post('/retrieve', asyncHandler(async (req, res) => {
  const { code } = RetrieveSchema.parse(req.body);
  
  const result = await retrieveFileShare(code);
  
  if (!result) {
    res.status(404).json({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'File not found or expired'
      }
    });
    return;
  }
  
  res.json(result);
}));

export default router;