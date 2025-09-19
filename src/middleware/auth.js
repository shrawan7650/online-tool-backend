import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { createLogger, transports, format } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console()
  ]
});

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log("Auth middleware token:", token);

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access denied. No token provided.'
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token. User not found.'
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        ok: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired. Please login again.'
        }
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        ok: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token format.'
        }
      });
    }

    res.status(500).json({
      ok: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed.'
      }
    });
  }
};

// Optional: subscription middleware in JS
// export const subscriptionMiddleware = (req, res, next) => {
//   if (!req.user) {
//     return res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
//   }
//   if (!req.user.isPro && !req.user.isMaxPro) {
//     return res.status(403).json({ ok: false, error: { code: 'SUBSCRIPTION_REQUIRED', message: 'Pro subscription required.' } });
//   }
//   if (req.user.subscriptionExpiry && req.user.subscriptionExpiry < new Date()) {
//     return res.status(403).json({ ok: false, error: { code: 'SUBSCRIPTION_EXPIRED', message: 'Subscription expired.' } });
//   }
//   next();
// };
