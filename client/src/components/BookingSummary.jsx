import Card from 'react-bootstrap/Card';
import { CalendarDays, Moon, ShieldAlert, Users } from 'lucide-react';
import SmartImage from './SmartImage.jsx';
import { formatDate, formatINR, plural } from '../utils/format.js';

/** Price breakdown + stay details. Every figure comes from the server (quote or booking). */
export function PriceBreakdown({ pricing }) {
  if (!pricing) return null;
  return (
    <div className="d-flex flex-column gap-2 text-sm my-3 border-top pt-3">
      <div className="d-flex justify-content-between small text-muted">
        <span>
          {formatINR(pricing.nightlyRate)} x {plural(pricing.nights, 'night')} x {plural(pricing.rooms, 'room')}
        </span>
        <span className="text-dark fw-medium">{formatINR(pricing.subtotal)}</span>
      </div>
      <div className="d-flex justify-content-between small text-muted">
        <span>Taxes (GST {pricing.taxRate}%)</span>
        <span className="text-dark fw-medium">{formatINR(pricing.taxes)}</span>
      </div>
      <div className="d-flex justify-content-between small text-muted">
        <span>AAVASA service fee ({pricing.serviceFeeRate}%)</span>
        <span className="text-dark fw-medium">{formatINR(pricing.serviceFee)}</span>
      </div>
      <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
        <span className="font-serif fs-5 fw-bold text-dark">Total</span>
        <span className="font-serif fs-5 fw-bold text-forest">{formatINR(pricing.total)}</span>
      </div>
    </div>
  );
}

export default function BookingSummary({
  hotelName,
  city,
  image,
  roomName,
  checkIn,
  checkOut,
  nights,
  rooms,
  guests,
  pricing,
  showDemoNote = true,
  children,
}) {
  return (
    <Card className="overflow-hidden border shadow-sm">
      {image && (
        <div style={{ height: '200px', overflow: 'hidden' }}>
          <SmartImage src={image.url} alt={image.alt || hotelName} width={700} className="w-100 h-100 object-fit-cover" />
        </div>
      )}
      <Card.Body className="p-4">
        <div className="mb-3">
          <span className="eyebrow">{city}</span>
          <h3 className="font-serif fs-4 mt-1 mb-1 text-dark">{hotelName}</h3>
          <p className="small text-muted mb-0">{roomName}</p>
        </div>

        <ul className="list-unstyled d-flex flex-column gap-2 small text-muted mb-3">
          <li className="d-flex align-items-center gap-2">
            <CalendarDays size={16} className="text-forest" aria-hidden="true" />
            <span className="text-dark">{formatDate(checkIn)} to {formatDate(checkOut)}</span>
          </li>
          <li className="d-flex align-items-center gap-2">
            <Moon size={16} className="text-forest" aria-hidden="true" />
            <span className="text-dark">{plural(nights, 'night')}, {plural(rooms, 'room')}</span>
          </li>
          <li className="d-flex align-items-center gap-2">
            <Users size={16} className="text-forest" aria-hidden="true" />
            <span className="text-dark">{plural(guests, 'guest')}</span>
          </li>
        </ul>

        <PriceBreakdown pricing={pricing} />

        {showDemoNote && (
          <div className="d-flex gap-2 rounded-3 bg-sand bg-opacity-50 p-3 small text-dark mt-3">
            <ShieldAlert size={18} className="text-forest flex-shrink-0 mt-1" aria-hidden="true" />
            <div style={{ fontSize: '0.8rem' }}>
              Demo mode: no real payment is taken and no card details are collected. The amounts above show how a real checkout would be calculated.
            </div>
          </div>
        )}

        {children}
      </Card.Body>
    </Card>
  );
}
