import { badRequest } from './AppError.js';

const DAY_MS = 24 * 60 * 60 * 1000;
export const MAX_STAY_NIGHTS = 30;
export const MAX_ADVANCE_DAYS = 365;

/**
 * All stay dates are treated as calendar days in UTC ("YYYY-MM-DD").
 * Using whole UTC days avoids time-zone drift when counting nights.
 */
export function parseDay(value, label = 'date') {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw badRequest(`${label} must be in YYYY-MM-DD format.`);
  }
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) {
    throw badRequest(`${label} is not a valid calendar date.`);
  }
  return d;
}

export function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function nightsBetween(checkIn, checkOut) {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS);
}

/** Returns every night of the stay: check-in night up to the night before check-out. */
export function listNights(checkIn, checkOut) {
  const nights = [];
  for (let d = new Date(checkIn); d < checkOut; d = new Date(d.getTime() + DAY_MS)) {
    nights.push(new Date(d));
  }
  return nights;
}

/**
 * Business rules for a stay:
 *  - check-in cannot be in the past (today is allowed)
 *  - check-out must be after check-in (at least one night)
 *  - maximum stay of 30 nights, bookable up to 365 days ahead
 */
export function validateStay(checkInStr, checkOutStr) {
  const checkIn = parseDay(checkInStr, 'Check-in date');
  const checkOut = parseDay(checkOutStr, 'Check-out date');
  const today = todayUTC();

  if (checkIn < today) throw badRequest('Check-in date cannot be in the past.');
  if (checkOut <= checkIn) throw badRequest('Check-out date must be after the check-in date.');
  const nights = nightsBetween(checkIn, checkOut);
  if (nights > MAX_STAY_NIGHTS) throw badRequest(`Stays are limited to ${MAX_STAY_NIGHTS} nights.`);
  if (nightsBetween(today, checkIn) > MAX_ADVANCE_DAYS) {
    throw badRequest(`Bookings can be made up to ${MAX_ADVANCE_DAYS} days in advance.`);
  }
  return { checkIn, checkOut, nights };
}

export const toDayString = (date) => new Date(date).toISOString().slice(0, 10);
