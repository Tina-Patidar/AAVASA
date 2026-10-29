import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.isTest,
    message: { success: false, message },
  });

/** Brute-force protection for login / register / password change. */
export const authLimiter = make(15 * 60 * 1000, 20, 'Too many attempts. Please try again in a few minutes.');

/** Generic safety net for the whole API. */
export const apiLimiter = make(60 * 1000, 300, 'Too many requests. Please slow down.');

/** Booking creation is expensive, so it gets its own tighter limit. */
export const bookingLimiter = make(60 * 1000, 20, 'Too many booking requests. Please wait a moment.');
