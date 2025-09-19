import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import pino from 'pino';
import { googleOAuth } from '../config/googlOAuth.js';

const router = Router();
const logger = pino();

// Validation schemas
const GoogleTokenSchema = z.object({
  token: z.string().min(1, 'Google token is required')
});

// Google OAuth login
router.post('/google', asyncHandler(async (req, res) => {
  const { token } = GoogleTokenSchema.parse(req.body);
  console.log("Received Google token:", token);

  try {
    const googleData = await googleOAuth(req, res);
    const { sub: googleId, email, name, picture } = googleData;
    console.log("Google payload:", googleData);

    if (!email || !name) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INCOMPLETE_PROFILE',
          message: 'Google profile is incomplete'
        }
      });
    }

    // Find or create user
    let user = await User.findOne({ googleId });
    
    if (!user) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        existingUser.googleId = googleId;
        existingUser.profilePicture = picture || existingUser.profilePicture;
        user = await existingUser.save();
      } else {
        user = new User({
          googleId,
          email,
          name,
          profilePicture: picture,
          isPro: false,
          isMaxPro: false
        });
        await user.save();
        logger.info(`New user registered: ${email}`);
      }
    } else {
      user.name = name;
      user.profilePicture = picture || user.profilePicture;
      await user.save();
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        isPro: user.isPro,
        isMaxPro: user.isMaxPro
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      ok: true,
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
        isPro: user.isPro,
        isMaxPro: user.isMaxPro,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry
      }
    });

  } catch (error) {
    logger.error('Google OAuth error:', error);
    res.status(400).json({
      ok: false,
      error: {
        code: 'GOOGLE_AUTH_FAILED',
        message: 'Google authentication failed'
      }
    });
  }
}));

// Get current user
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ ok: false });

  res.json({
    ok: true,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
      isPro: user.isPro,
      isMaxPro: user.isMaxPro,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry
    }
  });
}));

// Refresh token
router.post('/refresh', authMiddleware, asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ ok: false });

  const token = jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      isPro: user.isPro,
      isMaxPro: user.isMaxPro
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    ok: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
      isPro: user.isPro,
      isMaxPro: user.isMaxPro,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry
    }
  });
}));

// Logout
router.post('/logout', (req, res) => {
  res.json({
    ok: true,
    message: 'Logged out successfully'
  });
});

export default router;
