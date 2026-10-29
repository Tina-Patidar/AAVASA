import { Router } from 'express';
import * as admin from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  adminBookingQuerySchema,
  adminBookingStatusSchema,
  adminGuestNotesSchema,
  adminGuestQuerySchema,
  adminHotelListQuerySchema,
  adminInventoryQuerySchema,
  adminUserQuerySchema,
  adminUserUpdateSchema,
  hotelInputSchema,
  hotelUpdateSchema,
  roomInputSchema,
  roomUpdateSchema,
} from '../utils/validators.js';

const router = Router();

// Server-side gate for all staff/admin endpoints: valid session AND role in ['admin', 'staff'].
router.use(protect, restrictTo('admin', 'staff'));

router.get('/stats', admin.stats);

router.get('/hotels', validate(adminHotelListQuerySchema, 'query'), admin.listHotels);
router.get('/hotels/:id', admin.getHotel);
router.post('/hotels', restrictTo('admin'), validate(hotelInputSchema), admin.createHotel);
router.patch('/hotels/:id', restrictTo('admin'), validate(hotelUpdateSchema), admin.updateHotel);
router.delete('/hotels/:id', restrictTo('admin'), admin.deleteHotel);

router.get('/hotels/:hotelId/rooms', admin.listRooms);
router.post('/hotels/:hotelId/rooms', restrictTo('admin'), validate(roomInputSchema), admin.createRoom);
router.patch('/rooms/:id', restrictTo('admin'), validate(roomUpdateSchema), admin.updateRoom);
router.delete('/rooms/:id', restrictTo('admin'), admin.deleteRoom);

router.get('/bookings', validate(adminBookingQuerySchema, 'query'), admin.listBookings);
router.get('/bookings/:id', admin.getBooking);
router.patch('/bookings/:id/status', validate(adminBookingStatusSchema), admin.updateBookingStatus);

router.get('/guests', validate(adminGuestQuerySchema, 'query'), admin.listGuests);
router.get('/guests/:id', admin.getGuest);
router.patch('/guests/:id/notes', validate(adminGuestNotesSchema), admin.updateGuestNotes);

router.get('/inventory', validate(adminInventoryQuerySchema, 'query'), admin.getRoomInventory);

// Admin-only user management
router.get('/users', restrictTo('admin'), validate(adminUserQuerySchema, 'query'), admin.listUsers);
router.get('/users/:id', restrictTo('admin'), admin.getUser);
router.patch('/users/:id', restrictTo('admin'), validate(adminUserUpdateSchema), admin.updateUser);

export default router;
