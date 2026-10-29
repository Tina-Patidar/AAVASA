import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, conflict, unauthorized } from '../utils/AppError.js';

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true, // JavaScript in the browser can never read the token
    secure: env.isProd, // HTTPS only in production
    // Frontend (Vercel) and API (Render) live on different sites in production, which needs SameSite=None
    sameSite: env.isProd ? 'none' : 'lax',
    path: '/',
  };
}

function sendSession(res, user, status = 200) {
  const token = jwt.sign({ sub: String(user._id) }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  res.cookie(env.COOKIE_NAME, token, { ...cookieOptions(), maxAge: MAX_AGE_MS });
  res.status(status).json({ success: true, user: user.toSafeJSON() });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (await User.exists({ email })) throw conflict('An account with this email already exists.');
  // role is never read from the request: every public sign-up is a normal guest account
  const user = await User.create({ name, email, password, phone: phone || '', role: 'user' });
  sendSession(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password so accounts cannot be enumerated
  if (!user || !(await user.comparePassword(password))) throw unauthorized('Incorrect email or password.');
  if (!user.isActive) throw unauthorized('This account has been deactivated. Please contact AAVASA support.');
  sendSession(res, user);
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.COOKIE_NAME, cookieOptions());
  res.json({ success: true, message: 'You have been signed out.' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
});

export const updateProfile = asyncHandler(async (req, res) => {
  // Only whitelisted fields (validated by the schema). Email and role cannot be changed here.
  Object.assign(req.user, req.body);
  await req.user.save();
  res.json({ success: true, user: req.user.toSafeJSON() });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) throw badRequest('Your current password is incorrect.');
  if (currentPassword === newPassword) throw badRequest('Choose a new password that is different from the current one.');
  user.password = newPassword; // hashed by the pre-save hook
  await user.save();
  sendSession(res, user); // re-issue a fresh session; older tokens are rejected via passwordChangedAt
});
