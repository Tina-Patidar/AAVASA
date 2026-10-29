import { describe, expect, it } from 'vitest';
import { calculatePricing } from '../services/pricingService.js';
import { listNights, nightsBetween, parseDay, validateStay } from '../utils/dates.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { generateReference } from '../services/bookingService.js';

const day = (n) => {
  const t = new Date();
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + n)).toISOString().slice(0, 10);
};

describe('pricing service', () => {
  it('computes subtotal, taxes, fee and total', () => {
    const p = calculatePricing({ nightlyRate: 1000, nights: 3, rooms: 2 });
    expect(p.subtotal).toBe(6000);
    expect(p.taxes).toBe(720);
    expect(p.serviceFee).toBe(180);
    expect(p.total).toBe(6900);
  });
});

describe('date rules', () => {
  it('counts nights and lists them without the check-out day', () => {
    const a = parseDay('2030-01-10');
    const b = parseDay('2030-01-13');
    expect(nightsBetween(a, b)).toBe(3);
    expect(listNights(a, b).map((d) => d.toISOString().slice(0, 10))).toEqual(['2030-01-10', '2030-01-11', '2030-01-12']);
  });
  it('rejects impossible dates and bad stays', () => {
    expect(() => parseDay('2030-02-31')).toThrow();
    expect(() => validateStay(day(5), day(5))).toThrow(/after/);
    expect(() => validateStay(day(-1), day(2))).toThrow(/past/);
    expect(validateStay(day(0), day(1)).nights).toBe(1); // checking in today is allowed
  });
});

describe('helpers', () => {
  it('escapes regex characters', () => {
    expect(escapeRegex('a.b*c(d)')).toBe('a\\.b\\*c\\(d\\)');
  });
  it('generates readable unique-looking references', () => {
    const refs = new Set(Array.from({ length: 200 }, generateReference));
    expect(refs.size).toBe(200);
    for (const r of refs) expect(r).toMatch(/^AAV-[A-HJ-NP-Z2-9]{8}$/);
  });
});
