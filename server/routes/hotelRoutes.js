import { Router } from 'express';
import * as hotels from '../controllers/hotelController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { availabilityQuerySchema, hotelQuerySchema, reviewSchema } from '../utils/validators.js';

const router = Router();

// Fixed paths must be declared before the dynamic "/:idOrSlug" routes
router.get('/', validate(hotelQuerySchema, 'query'), hotels.listHotels);
router.get('/featured', hotels.featuredHotels);
router.get('/meta', hotels.filterMeta);
router.get('/destinations', hotels.popularDestinations);

router.get('/:idOrSlug', validate(availabilityQuerySchema, 'query'), hotels.getHotel);
router.get('/:idOrSlug/availability', validate(availabilityQuerySchema, 'query'), hotels.hotelAvailability);
router.get('/:idOrSlug/reviews', hotels.listReviews);
router.post('/:idOrSlug/reviews', protect, validate(reviewSchema), hotels.createReview);

export default router;
