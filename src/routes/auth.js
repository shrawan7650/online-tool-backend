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

// Helper: Generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // short-lived access token
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

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
        error: { code: 'INCOMPLETE_PROFILE', message: 'Google profile is incomplete' }
      });
    }

    // Find or create user
    let user = await User.findOne({ googleId });
    if (!user) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        existingUser.googleId = googleId;
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
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Set cookies consistently
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('inspitech_access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('inspitech_refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

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

  } catch (error) {
    console.error("Google OAuth error:", error); 
    res.status(400).json({
      ok: false,
      error: { code: 'GOOGLE_AUTH_FAILED', message: 'Google authentication failed' }
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
router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.inspitech_refresh_token;
  console.log("Received refresh token:", refreshToken);
  if (!refreshToken) return res.status(401).json({ ok: false, message: 'No refresh token' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ ok: false });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    const isProd = process.env.NODE_ENV === 'production';

    // Update cookies
    res.cookie('inspitech_access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('inspitech_refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ ok: true });

  } catch (error) {
    return res.status(401).json({ ok: false, message: 'Invalid refresh token' });
  }
}));

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('inspitech_access_token');
  res.clearCookie('inspitech_refresh_token');
  res.json({ ok: true, message: 'Logged out successfully' });
});

export default router;
