import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import asyncHandler from 'express-async-handler';

const router = Router();

// Rate limit for metrics
const metricsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    ok: false,
    error: {
      code: 'METRICS_RATE_LIMIT',
      message: 'Too many metrics requests'
    }
  }
});

// Validation schema
const MetricSchema = z.object({
  type: z.enum(['pageview', 'interaction']),
  path: z.string().max(200),
  timestamp: z.number(),
  userAgent: z.string().max(200).optional()
});

// In-memory storage (replace with proper database in production)
const metrics: any[] = [];

router.post('/', metricsLimiter, asyncHandler(async (req, res) => {
  const validatedData = MetricSchema.parse(req.body);
  
  // Store metric (anonymized)
  const metric = {
    ...validatedData,
    ip: req.ip?.substring(0, req.ip.lastIndexOf('.')) + '.xxx', // Anonymize IP
    timestamp: Date.now()
  };
  
  metrics.push(metric);
  
  // Keep only last 10000 metrics
  if (metrics.length > 10000) {
    metrics.splice(0, metrics.length - 10000);
  }
  
  res.status(201).json({ ok: true });
}));

// Get basic metrics (admin endpoint - would require auth in production)
router.get('/', (req, res) => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;
  
  const hourlyMetrics = metrics.filter(m => now - m.timestamp < oneHour);
  const dailyMetrics = metrics.filter(m => now - m.timestamp < oneDay);
  
  res.json({
    total: metrics.length,
    lastHour: hourlyMetrics.length,
    lastDay: dailyMetrics.length,
    topPages: getTopPages(dailyMetrics, 5)
  });
});

function getTopPages(metrics: any[], limit: number) {
  const counts: { [path: string]: number } = {};
  
  metrics.forEach(m => {
    if (m.type === 'pageview') {
      counts[m.path] = (counts[m.path] || 0) + 1;
    }
  });
  
  return Object.entries(counts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, limit)
    .map(([path, count]) => ({ path, count }));
}

export default router;