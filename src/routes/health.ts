import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (req, res) => {
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();
  
  // Check MongoDB connection
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    status: 'ok',
    uptime,
    version: '1.0.0',
    timestamp,
    database: {
      status: dbStatus,
      host: mongoose.connection.host || 'unknown'
    },
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;