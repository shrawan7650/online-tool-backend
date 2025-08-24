import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import asyncHandler from 'express-async-handler';
import { createClipboardNote, retrieveClipboardNote, deleteClipboardNote } from '../services/clipboardService.js';

const router = Router();

// Specific rate limiter for clipboard operations
const clipboardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 clipboard operations per 15 minutes
  message: {
    ok: false,
    error: {
      code: 'CLIPBOARD_RATE_LIMIT',
      message: 'Too many clipboard operations, please try again later'
    }
  }
});

// Rate limiter for retrieval (per code + IP to prevent brute force)
const retrievalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 attempts per code+IP combination
  keyGenerator: (req) => `${req.ip}-${req.body.code}`,
  message: {
    ok: false,
    error: {
      code: 'RETRIEVAL_RATE_LIMIT',
      message: 'Too many retrieval attempts for this code'
    }
  }
});

// Validation schemas
const CreateClipboardSchema = z.object({
  text: z.string().min(1).max(50000, 'Text too long (max 50,000 characters)'),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits').optional(),
  expiresIn: z.enum(['15m', '1h', '24h', '7d']).default('1h')
});

const RetrieveClipboardSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits'),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits').optional()
});

// Create clipboard note
router.post('/', clipboardLimiter, asyncHandler(async (req, res) => {
  const validatedData = CreateClipboardSchema.parse(req.body);
  
  const result = await createClipboardNote({
    ...validatedData,
    createdIp: req.ip || 'unknown'
  });
  
  res.status(201).json(result);
}));

// Retrieve clipboard note
router.post('/retrieve', retrievalLimiter, asyncHandler(async (req, res) => {
  const validatedData = RetrieveClipboardSchema.parse(req.body);
  
  const result = await retrieveClipboardNote(validatedData.code, validatedData.pin);
  
  if (!result) {
    res.status(404).json({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Clipboard note not found or expired'
      }
    });
    return;
  }
  
  res.json(result);
}));

// Delete clipboard note
router.delete('/:code', asyncHandler(async (req, res) => {
  const code = req.params.code;
  
  if (!/^\d{6}$/.test(code)) {
    res.status(400).json({
      ok: false,
      error: {
        code: 'INVALID_CODE',
        message: 'Code must be exactly 6 digits'
      }
    });
    return;
  }
  
  await deleteClipboardNote(code);
  
  res.json({ ok: true, message: 'Clipboard note deleted' });
}));

export default router;