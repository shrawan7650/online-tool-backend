import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import asyncHandler from 'express-async-handler';

const router = Router();

// Common validation schema
const TextInputSchema = z.object({
  text: z.string().min(1, 'Text is required').max(100000, 'Text too long')
});

const Base64Schema = z.object({
  text: z.string().min(1, 'Text is required'),
  urlSafe: z.boolean().optional().default(false)
});

const HashSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  alg: z.enum(['md5', 'sha1', 'sha256', 'sha512'])
});

// URL encode
router.post('/url-encode', asyncHandler(async (req, res) => {
  const { text } = TextInputSchema.parse(req.body);
  
  const result = encodeURIComponent(text);
  
  res.json({ result });
}));

// URL decode
router.post('/url-decode', asyncHandler(async (req, res) => {
  const { text } = TextInputSchema.parse(req.body);
  
  try {
    const result = decodeURIComponent(text);
    res.json({ result });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: {
        code: 'INVALID_URL_ENCODING',
        message: 'Invalid URL encoding'
      }
    });
  }
}));

// Base64 encode
router.post('/base64-encode', asyncHandler(async (req, res) => {
  const { text, urlSafe } = Base64Schema.parse(req.body);
  
  let result = Buffer.from(text, 'utf8').toString('base64');
  
  if (urlSafe) {
    result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
  
  res.json({ result });
}));

// Base64 decode
router.post('/base64-decode', asyncHandler(async (req, res) => {
  const { text } = TextInputSchema.parse(req.body);
  
  try {
    // Handle URL-safe base64
    let toDecode = text.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    while (toDecode.length % 4) {
      toDecode += '=';
    }
    
    const result = Buffer.from(toDecode, 'base64').toString('utf8');
    res.json({ result, isValid: true });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: {
        code: 'INVALID_BASE64',
        message: 'Invalid Base64 encoding'
      }
    });
  }
}));

// JSON escape
router.post('/json-escape', asyncHandler(async (req, res) => {
  const { text } = TextInputSchema.parse(req.body);
  
  const result = JSON.stringify(text).slice(1, -1); // Remove outer quotes
  
  res.json({ result });
}));

// JSON unescape
router.post('/json-unescape', asyncHandler(async (req, res) => {
  const { text } = TextInputSchema.parse(req.body);
  
  try {
    const result = JSON.parse(`"${text}"`); // Wrap in quotes for parsing
    res.json({ result });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON escape sequence'
      }
    });
  }
}));

// Hash generation
router.post('/hash', asyncHandler(async (req, res) => {
  const { text, alg } = HashSchema.parse(req.body);
  
  const hash = crypto.createHash(alg).update(text, 'utf8').digest('hex');
  
  res.json({ hash });
}));

export default router;