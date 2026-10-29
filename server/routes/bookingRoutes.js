import { Router } from 'express';
import * as bookings from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { bookingLimiter } from '../middleware/rateLimiters.js';
import { bookingListQuerySchema, cancelSchema, createBookingSchema, quoteSchema } from '../utils/validators.js';

const router = Router();

// Every booking route requires a signed-in user, and controllers scope queries to that user.
router.use(protect);

router.post('/quote', validate(quoteSchema), bookings.quote);
router.post('/', bookingLimiter, validate(createBookingSchema), bookings.create);
router.get('/', validate(bookingListQuerySchema, 'query'), bookings.listMine);
router.get('/:id', bookings.getOne);
router.patch('/:id/cancel', validate(cancelSchema), bookings.cancel);

export default router;
