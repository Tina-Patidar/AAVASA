import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { unauthorized, forbidden } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function extractToken(req) {
  if (req.cookies?.[env.COOKIE_NAME]) return req.cookies[env.COOKIE_NAME];
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/** Requires a valid session. Loads the user fresh from the database so role changes apply immediately. */
export const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw unauthorized('Your session has expired. Please sign in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw unauthorized('This account is no longer available.');
  // Invalidate tokens issued before the last password change
  if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime() - 1000) {
    throw unauthorized('Password was changed recently. Please sign in again.');
  }
  req.user = user;
  next();
});

/** Like protect, but never fails: req.user is simply undefined for guests. */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (user?.isActive) req.user = user;
    } catch {
      /* ignore invalid tokens for public routes */
    }
  }
  next();
});

/** Role check always runs on the server using the role stored in MongoDB, never one sent by the client. */
export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden('Administrator access is required.'));
    next();
  };
