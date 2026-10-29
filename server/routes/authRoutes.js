import { Router } from 'express';
import * as auth from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { loginSchema, passwordChangeSchema, profileSchema, registerSchema } from '../utils/validators.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), auth.register);
router.post('/login', authLimiter, validate(loginSchema), auth.login);
router.post('/logout', auth.logout);
router.get('/me', protect, auth.me);
router.patch('/me', protect, validate(profileSchema), auth.updateProfile);
router.patch('/me/password', protect, authLimiter, validate(passwordChangeSchema), auth.changePassword);

export default router;
