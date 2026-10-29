import { z } from 'zod';
import { AMENITIES, PROPERTY_TYPES } from '../models/Hotel.js';
import { ROOM_AMENITIES } from '../models/RoomType.js';
import { BOOKING_STATUSES } from '../models/Booking.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const optionalText = (max) => z.string().trim().max(max).optional().or(z.literal(''));
const csv = (allowed) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []))
    .pipe(allowed ? z.array(z.enum(allowed)) : z.array(z.string()));

// ---------- auth ----------
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be 72 characters or fewer')
  .regex(/[A-Za-z]/, 'Password needs at least one letter')
  .regex(/\d/, 'Password needs at least one number');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password,
  phone: optionalText(20),
});
// NOTE: `role` is deliberately not accepted here. z.object strips unknown keys, so a client
// sending { role: "admin" } is silently ignored.

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: optionalText(20),
    city: optionalText(80),
  })
  .strict();

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: password,
});

// ---------- hotels ----------
export const hotelQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  checkIn: day.optional(),
  checkOut: day.optional(),
  guests: z.coerce.number().int().min(1).max(40).optional(),
  rooms: z.coerce.number().int().min(1).max(10).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  propertyType: csv(PROPERTY_TYPES),
  amenities: csv(AMENITIES),
  stars: z.coerce.number().int().min(1).max(5).optional(),
  sort: z.enum(['recommended', 'price_asc', 'price_desc', 'rating_desc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(24).optional(),
});

export const availabilityQuerySchema = z.object({
  checkIn: day.optional(),
  checkOut: day.optional(),
  guests: z.coerce.number().int().min(1).max(40).optional(),
  rooms: z.coerce.number().int().min(1).max(10).optional(),
});

export const reviewSchema = z.object({
  bookingId: objectId,
  rating: z.coerce.number().int().min(1).max(5),
  title: optionalText(100),
  comment: z.string().trim().min(10, 'Please write at least 10 characters').max(1200),
});

// ---------- bookings ----------
const stayFields = {
  hotelId: objectId,
  roomTypeId: objectId,
  checkIn: day,
  checkOut: day,
  rooms: z.coerce.number().int().min(1).max(10),
  guests: z.coerce.number().int().min(1).max(40),
};

// Only identifying details and the stay itself are accepted. A `total` or `status` sent by the client is stripped.
export const quoteSchema = z.object(stayFields);

export const createBookingSchema = z.object({
  ...stayFields,
  guestDetails: z.object({
    fullName: z.string().trim().min(2, 'Guest name is required').max(100),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    phone: optionalText(20),
    specialRequests: optionalText(500),
  }),
  idempotencyKey: z.string().trim().min(8).max(80).optional(),
  acceptDemoPayment: z.literal(true, { errorMap: () => ({ message: 'Please acknowledge the demo checkout.' }) }),
});

export const bookingListQuerySchema = z.object({
  group: z.enum(['upcoming', 'past', 'cancelled', 'all']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const cancelSchema = z.object({ reason: optionalText(300) });

// ---------- admin ----------
const imageInput = z.object({ url: z.string().trim().url('Image URL must be valid'), alt: z.string().trim().min(3, 'Alt text is required').max(200) });

export const hotelInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  tagline: optionalText(160),
  description: z.string().trim().min(20, 'Description should be at least 20 characters').max(4000),
  propertyType: z.enum(PROPERTY_TYPES),
  starCategory: z.coerce.number().int().min(1).max(5),
  city: z.string().trim().min(2).max(80),
  state: optionalText(80),
  country: z.string().trim().max(80).optional(),
  address: z.string().trim().min(5).max(300),
  location: z.object({ lat: z.coerce.number().min(-90).max(90), lng: z.coerce.number().min(-180).max(180) }).partial().optional(),
  images: z.array(imageInput).min(1, 'Add at least one image').max(12),
  amenities: z.array(z.enum(AMENITIES)).max(AMENITIES.length),
  policies: z
    .object({
      checkInTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      checkOutTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      cancellation: z.string().trim().max(500).optional(),
      freeCancellationHours: z.coerce.number().int().min(0).max(720).optional(),
      houseRules: z.string().trim().max(500).optional(),
    })
    .optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export const hotelUpdateSchema = hotelInputSchema.partial();

export const roomInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: optionalText(1000),
  pricePerNight: z.coerce.number().min(100, 'Price must be at least 100').max(500000),
  maxGuests: z.coerce.number().int().min(1).max(12),
  totalRooms: z.coerce.number().int().min(0).max(200),
  sizeSqFt: z.coerce.number().int().min(50).max(5000).optional(),
  amenities: z.array(z.enum(ROOM_AMENITIES)).optional(),
  images: z.array(imageInput).max(8).optional(),
  isActive: z.boolean().optional(),
});
export const roomUpdateSchema = roomInputSchema.partial();

export const adminBookingQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  status: z.enum(BOOKING_STATUSES).optional(),
  hotelId: objectId.optional(),
  from: day.optional(),
  to: day.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const adminBookingStatusSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
  reason: optionalText(300),
});

export const adminUserQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  role: z.enum(['user', 'staff', 'admin']).optional(),
  active: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const adminUserUpdateSchema = z
  .object({ isActive: z.boolean().optional(), role: z.enum(['user', 'staff', 'admin']).optional() })
  .refine((v) => v.isActive !== undefined || v.role !== undefined, 'Nothing to update');

export const adminGuestQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const adminGuestNotesSchema = z.object({
  staffNotes: z.string().trim().max(2000),
});

export const adminInventoryQuerySchema = z.object({
  hotelId: objectId.optional(),
  startDate: day.optional(),
  days: z.coerce.number().int().min(1).max(30).optional(),
});

export const adminHotelListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
