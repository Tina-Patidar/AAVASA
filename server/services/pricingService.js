import { env } from '../config/env.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * The ONLY place where booking totals are calculated. The frontend never sends a price;
 * it only displays what this function returns.
 *
 *   subtotal   = nightly rate x nights x rooms
 *   taxes      = subtotal x TAX_RATE%
 *   serviceFee = subtotal x SERVICE_FEE_RATE%
 *   total      = subtotal + taxes + serviceFee
 */
export function calculatePricing({ nightlyRate, nights, rooms }) {
  const subtotal = round2(nightlyRate * nights * rooms);
  const taxes = round2((subtotal * env.TAX_RATE) / 100);
  const serviceFee = round2((subtotal * env.SERVICE_FEE_RATE) / 100);
  const total = round2(subtotal + taxes + serviceFee);

  return {
    nightlyRate,
    nights,
    rooms,
    subtotal,
    taxRate: env.TAX_RATE,
    taxes,
    serviceFeeRate: env.SERVICE_FEE_RATE,
    serviceFee,
    total,
    currency: 'INR',
  };
}
