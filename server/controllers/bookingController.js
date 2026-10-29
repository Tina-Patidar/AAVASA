import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/AppError.js';
import { todayUTC } from '../utils/dates.js';
import {
  assertOwnerOrAdmin,
  buildQuote,
  canCancel,
  cancelBooking,
  createBooking,
  syncCompletedBookings,
} from '../services/bookingService.js';

/** Shapes a booking for the API and tells the UI whether cancellation is currently allowed. */
export function presentBooking(b) {
  const o = b.toObject ? b.toObject() : b;
  return { ...o, canCancel: canCancel(b) };
}

export const quote = asyncHandler(async (req, res) => {
  const q = await buildQuote(req.body);
  res.json({
    success: true,
    quote: {
      hotel: { id: q.hotel._id, name: q.hotel.name, city: q.hotel.city, slug: q.hotel.slug, image: q.hotel.images[0] },
      roomType: { id: q.roomType._id, name: q.roomType.name, maxGuests: q.roomType.maxGuests },
      checkIn: req.body.checkIn,
      checkOut: req.body.checkOut,
      nights: q.nights,
      rooms: q.rooms,
      guests: q.guests,
      availableRooms: q.availableRooms,
      pricing: q.pricing,
      policies: q.hotel.policies,
      paymentMode: 'demo',
    },
  });
});

export const create = asyncHandler(async (req, res) => {
  const { booking, duplicate } = await createBooking(req.user, req.body);
  res.status(duplicate ? 200 : 201).json({ success: true, duplicate, booking: presentBooking(booking) });
});

export const listMine = asyncHandler(async (req, res) => {
  await syncCompletedBookings();
  const { group = 'all', page = 1, limit = 10 } = req.validatedQuery;
  const today = todayUTC();

  const filter = { user: req.user._id };
  if (group === 'upcoming') Object.assign(filter, { status: { $in: ['pending', 'confirmed', 'checked_in'] }, checkOut: { $gt: today } });
  if (group === 'past') Object.assign(filter, { status: { $in: ['completed', 'checked_out'] } });
  if (group === 'cancelled') filter.status = 'cancelled';

  const sort = group === 'upcoming' ? { checkIn: 1 } : { checkIn: -1 };
  const [bookings, total, counts] = await Promise.all([
    Booking.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
    Booking.countDocuments(filter),
    Booking.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const c = Object.fromEntries(counts.map((x) => [x._id, x.count]));
  res.json({
    success: true,
    bookings: bookings.map(presentBooking),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    counts: {
      cancelled: c.cancelled || 0,
      completed: (c.completed || 0) + (c.checked_out || 0),
      active: (c.pending || 0) + (c.confirmed || 0) + (c.checked_in || 0),
    },
  });
});

async function findOwnedBooking(idOrRef, user) {
  const filter = mongoose.isValidObjectId(idOrRef) ? { _id: idOrRef } : { reference: String(idOrRef).toUpperCase() };
  const booking = await Booking.findOne(filter);
  if (!booking) throw notFound('Booking not found.');
  assertOwnerOrAdmin(booking, user);
  return booking;
}

export const getOne = asyncHandler(async (req, res) => {
  await syncCompletedBookings();
  const booking = await findOwnedBooking(req.params.id, req.user);
  res.json({ success: true, booking: presentBooking(booking) });
});

export const cancel = asyncHandler(async (req, res) => {
  const booking = await findOwnedBooking(req.params.id, req.user);
  const updated = await cancelBooking(booking, req.user, req.body.reason);
  res.json({ success: true, booking: presentBooking(updated) });
});
