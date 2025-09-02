import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import pino from 'pino';

const logger = pino();

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
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
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        ok: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired. Please login again.'
        }
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
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

export const subscriptionMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.'
      }
    });
  }

  if (!req.user.isPro && !req.user.isMaxPro) {
    return res.status(403).json({
      ok: false,
      error: {
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Pro subscription required to access this feature.'
      }
    });
  }

  // Check if subscription is still valid
  if (req.user.subscriptionExpiry && req.user.subscriptionExpiry < new Date()) {
    return res.status(403).json({
      ok: false,
      error: {
        code: 'SUBSCRIPTION_EXPIRED',
        message: 'Your subscription has expired. Please renew to continue.'
      }
    });
  }

  next();
};

export const maxProMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.'
      }
    });
  }

  if (!req.user.isMaxPro) {
    return res.status(403).json({
      ok: false,
      error: {
        code: 'MAX_PRO_REQUIRED',
        message: 'Max Pro subscription required to access this feature.'
      }
    });
  }

  next();
};