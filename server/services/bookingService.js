import crypto from 'node:crypto';
import { Booking } from '../models/Booking.js';
import { Hotel } from '../models/Hotel.js';
import { RoomType } from '../models/RoomType.js';
import { validateStay, listNights, todayUTC } from '../utils/dates.js';
import { badRequest, conflict, notFound } from '../utils/AppError.js';
import { calculatePricing } from './pricingService.js';
import { getFreeRooms, holdInventory, releaseInventory } from './availabilityService.js';

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid misreading

export function generateReference() {
  let code = '';
  for (let i = 0; i < 8; i += 1) code += REF_ALPHABET[crypto.randomInt(REF_ALPHABET.length)];
  return `AAV-${code}`;
}

/**
 * Validates a booking request WITHOUT reserving anything.
 * Used for the live price breakdown and again inside createBooking.
 */
export async function buildQuote({ hotelId, roomTypeId, checkIn: checkInStr, checkOut: checkOutStr, rooms, guests }) {
  const { checkIn, checkOut, nights } = validateStay(checkInStr, checkOutStr);

  const hotel = await Hotel.findOne({ _id: hotelId, isActive: true });
  if (!hotel) throw notFound('This property is not available for booking.');

  const roomType = await RoomType.findOne({ _id: roomTypeId, hotel: hotel._id, isActive: true });
  if (!roomType) throw notFound('That room type was not found for this property.');

  // Guest capacity: every room holds at most roomType.maxGuests people
  const capacity = roomType.maxGuests * rooms;
  if (guests > capacity) {
    throw badRequest(
      `${roomType.name} sleeps up to ${roomType.maxGuests} guests per room. ${rooms} room${rooms > 1 ? 's' : ''} can host ${capacity} guests at most.`
    );
  }
  if (guests < rooms) throw badRequest('Each room needs at least one guest. Reduce the number of rooms or add guests.');

  const free = (await getFreeRooms([roomType], checkIn, checkOut)).get(String(roomType._id));
  if (free < rooms) {
    throw conflict(
      free === 0
        ? `${roomType.name} is fully booked for those dates.`
        : `Only ${free} ${roomType.name} room${free > 1 ? 's are' : ' is'} left for those dates.`,
      { availableRooms: free }
    );
  }

  const pricing = calculatePricing({ nightlyRate: roomType.pricePerNight, nights, rooms });
  return { hotel, roomType, checkIn, checkOut, nights, rooms, guests, pricing, availableRooms: free };
}

export async function createBooking(user, input) {
  const { idempotencyKey } = input;

  // Duplicate-submission guard: same user + same key returns the original booking
  if (idempotencyKey) {
    const existing = await Booking.findOne({ user: user._id, idempotencyKey });
    if (existing) return { booking: existing, duplicate: true };
  }

  const quote = await buildQuote(input);
  const { hotel, roomType, checkIn, checkOut, nights, rooms, guests, pricing } = quote;

  // 1) Atomically reserve inventory night by night (throws 409 if someone else got there first)
  await holdInventory(roomType, listNights(checkIn, checkOut), rooms);

  // 2) Record the booking. If this fails, give the rooms back.
  try {
    let booking;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        booking = await Booking.create({
          reference: generateReference(),
          user: user._id,
          hotel: hotel._id,
          roomType: roomType._id,
          hotelSnapshot: {
            name: hotel.name,
            city: hotel.city,
            image: hotel.images[0]?.url,
            imageAlt: hotel.images[0]?.alt,
            slug: hotel.slug,
          },
          roomSnapshot: { name: roomType.name },
          checkIn,
          checkOut,
          nights,
          rooms,
          guests,
          guestDetails: {
            fullName: input.guestDetails.fullName,
            email: input.guestDetails.email,
            phone: input.guestDetails.phone || '',
            specialRequests: input.guestDetails.specialRequests || '',
          },
          pricing,
          // Demo checkout: instantly confirmed, no money moves. A real gateway would start as 'pending'.
          status: 'confirmed',
          payment: { mode: 'demo', provider: 'demo', status: 'demo_recorded' },
          idempotencyKey: idempotencyKey || undefined,
          inventoryHeld: true,
        });
        break;
      } catch (err) {
        // Reference collision: try a new random reference
        if (err.code === 11000 && err.keyPattern?.reference) continue;
        throw err;
      }
    }
    if (!booking) throw new Error('Could not generate a unique booking reference.');
    return { booking, duplicate: false };
  } catch (err) {
    await releaseInventory(roomType._id, checkIn, checkOut, rooms);
    // A parallel request with the same idempotency key won the race: return its booking
    if (err.code === 11000 && err.keyPattern?.idempotencyKey) {
      const existing = await Booking.findOne({ user: user._id, idempotencyKey });
      if (existing) return { booking: existing, duplicate: true };
    }
    throw err;
  }
}

/** Confirmed bookings whose check-out day has passed become "completed". Cheap, runs before listings. */
export async function syncCompletedBookings() {
  await Booking.updateMany({ status: 'confirmed', checkOut: { $lte: todayUTC() } }, { $set: { status: 'completed' } });
}

/** Only pending/confirmed bookings whose check-in day is still in the future can be cancelled online. */
export function canCancel(booking) {
  if (!['pending', 'confirmed'].includes(booking.status)) return false;
  return booking.checkIn > todayUTC();
}

/**
 * Cancels a booking and returns its rooms to inventory.
 * The atomic status flip (only from pending/confirmed while inventoryHeld) guarantees
 * inventory is released exactly once even if two cancel requests arrive together.
 */
export async function cancelBooking(booking, actor, reason = '') {
  if (!canCancel(booking)) {
    throw badRequest(
      booking.status === 'cancelled'
        ? 'This booking is already cancelled.'
        : 'This booking can no longer be cancelled because the stay has started or finished.'
    );
  }

  const hotel = await Hotel.findById(booking.hotel).select('policies').lean();
  const freeHours = hotel?.policies?.freeCancellationHours ?? 48;
  const hoursUntilCheckIn = (booking.checkIn.getTime() - Date.now()) / 36e5;
  const freeCancellation = hoursUntilCheckIn >= freeHours;

  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: { $in: ['pending', 'confirmed'] }, inventoryHeld: true },
    {
      $set: {
        status: 'cancelled',
        inventoryHeld: false,
        'cancellation.cancelledAt': new Date(),
        'cancellation.cancelledBy': actor._id,
        'cancellation.reason': reason || undefined,
        'cancellation.freeCancellation': freeCancellation,
      },
    },
    { new: true }
  );
  if (!updated) throw conflict('This booking was just updated. Please refresh and try again.');

  await releaseInventory(updated.roomType, updated.checkIn, updated.checkOut, updated.rooms);
  return updated;
}

const ADMIN_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'completed', 'cancelled'],
  checked_in: ['checked_out'],
  checked_out: [],
  cancelled: [],
  completed: [],
};

/** Admin/staff status changes follow a fixed state machine; cancelling always goes through cancelBooking. */
export async function adminUpdateStatus(booking, nextStatus, admin, reason) {
  const allowed = ADMIN_TRANSITIONS[booking.status] || [];
  if (!allowed.includes(nextStatus)) {
    throw badRequest(`A ${booking.status} booking cannot be changed to ${nextStatus}.`);
  }
  if (nextStatus === 'cancelled') {
    // Same cancellation rules as guests: inventory is released exactly once
    return cancelBooking(booking, admin, reason || 'Cancelled by AAVASA administrator');
  }
  if (nextStatus === 'checked_in') {
    if (booking.checkIn > todayUTC()) {
      throw badRequest('Check-in is only allowed on or after the check-in date.');
    }
  }
  if (nextStatus === 'completed' && booking.checkIn > todayUTC()) {
    throw badRequest('A booking can only be marked completed once the stay has started.');
  }
  booking.status = nextStatus;
  if (nextStatus === 'confirmed' && booking.payment.status === 'pending') booking.payment.status = 'demo_recorded';
  await booking.save();
  return booking;
}

export function assertOwnerOrAdmin(booking, user) {
  if (String(booking.user?._id || booking.user) !== String(user._id) && !['admin', 'staff'].includes(user.role)) {
    // 404 instead of 403 so booking references cannot be probed
    throw notFound('Booking not found.');
  }
}
