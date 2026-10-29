export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount ?? 0);

// Dates from the API are ISO strings at UTC midnight; always format in UTC so the day never shifts.
export const formatDate = (value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  value ? new Intl.DateTimeFormat('en-IN', { ...opts, timeZone: 'UTC' }).format(new Date(value)) : '';

export const formatDateTime = (value) =>
  value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '';

/** YYYY-MM-DD for N days from today (local calendar day, which is what a traveller means by "today") */
export function dayFromToday(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(`${checkIn}T00:00:00Z`);
  const b = new Date(`${checkOut}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

export const toISODay = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

/** Returns an error message for an invalid stay, or '' when fine. Mirrors the server rules for fast feedback. */
export function validateStayInputs({ checkIn, checkOut, guests, rooms }) {
  if (checkIn || checkOut) {
    if (!checkIn) return 'Please choose a check-in date.';
    if (!checkOut) return 'Please choose a check-out date.';
    if (checkIn < dayFromToday(0)) return 'Check-in date cannot be in the past.';
    if (checkOut <= checkIn) return 'Check-out must be after check-in.';
    if (nightsBetween(checkIn, checkOut) > 30) return 'Stays are limited to 30 nights.';
  }
  if (guests !== undefined && (!Number.isInteger(Number(guests)) || guests < 1 || guests > 40)) return 'Guests must be between 1 and 40.';
  if (rooms !== undefined && (!Number.isInteger(Number(rooms)) || rooms < 1 || rooms > 10)) return 'Rooms must be between 1 and 10.';
  if (rooms !== undefined && guests !== undefined && Number(guests) < Number(rooms)) return 'Each room needs at least one guest.';
  return '';
}

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
