import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import asyncHandler from 'express-async-handler';
import { createScheduledContent, retrieveScheduledContent } from '../services/schedulerService.js';

const router = Router();

// Rate limiting for scheduler operations
const schedulerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 scheduler operations per 15 minutes
  message: {
    ok: false,
    error: {
      code: 'SCHEDULER_RATE_LIMIT',
      message: 'Too many scheduler operations, please try again later'
    }
  }
});

// Validation schemas
const CreateScheduledSchema = z.object({
  type: z.enum(['text', 'file']),
  content: z.string().min(1).max(10000, 'Content too long (max 10,000 characters)'),
  title: z.string().max(200).optional(),
  unlockAt: z.string().datetime('Invalid unlock date format')
});

const RetrieveScheduledSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits')
});

// Create scheduled content
router.post('/create', schedulerLimiter, asyncHandler(async (req, res) => {
  const validatedData = CreateScheduledSchema.parse(req.body);
  
  const unlockDate = new Date(validatedData.unlockAt);
  const now = new Date();
  
  // Validate unlock time
  if (unlockDate <= now) {
    res.status(400).json({
      ok: false,
      error: {
        code: 'INVALID_UNLOCK_TIME',
        message: 'Unlock time must be in the future'
      }
    });
    return;
  }
  
  // Maximum 30 days in the future
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  
  if (unlockDate > maxDate) {
    res.status(400).json({
      ok: false,
      error: {
        code: 'UNLOCK_TIME_TOO_FAR',
        message: 'Unlock time cannot be more than 30 days from now'
      }
    });
    return;
  }
  
  const result = await createScheduledContent({
    ...validatedData,
    unlockAt: unlockDate,
    createdIp: req.ip || 'unknown'
  });
  
  res.status(201).json(result);
}));

// Retrieve scheduled content
router.post('/retrieve', asyncHandler(async (req, res) => {
  const { code } = RetrieveScheduledSchema.parse(req.body);
  
  const result = await retrieveScheduledContent(code);
  
  if (!result) {
    res.status(404).json({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Scheduled content not found or expired'
      }
    });
    return;
  }
  
  if (result.locked) {
    res.status(423).json({
      ok: false,
      error: {
        code: 'CONTENT_LOCKED',
        message: 'Content is still locked until the scheduled time',
        unlockAt: result.unlockAt
      }
    });
    return;
  }
  
  res.json(result);
}));

export default router;