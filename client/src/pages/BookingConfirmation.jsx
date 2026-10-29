import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Printer } from 'lucide-react';
import Button from 'react-bootstrap/Button';
import Logo from '../components/Logo.jsx';
import BookingSummary from '../components/BookingSummary.jsx';
import ErrorState from '../components/ErrorState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { PageSkeleton } from '../components/Skeletons.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { bookingApi } from '../services/api.js';
import { toISODay } from '../utils/format.js';

export default function BookingConfirmation() {
  const { id } = useParams();
  useDocumentTitle('Booking confirmed');
  const { data, loading, error, reload } = useFetch(() => bookingApi.get(id), [id]);

  if (loading) return <PageSkeleton />;
  if (error) return <div className="container-page py-5"><ErrorState message={error} onRetry={reload} /></div>;

  const b = data.booking;

  return (
    <div className="container-page py-5" style={{ maxWidth: '900px' }}>
      {/* Confirmation header */}
      <div className="d-flex flex-column align-items-center text-center">
        <Logo variant="full" />
        <CheckCircle2 className="mt-5 text-forest" size={48} aria-hidden="true" />
        <h1 className="mt-3 font-serif fs-1">Your stay is booked</h1>
        <p className="mt-2 text-muted" style={{ maxWidth: '420px' }}>
          A confirmation has been recorded for {b.guestDetails.fullName}. This is a demo booking, so no payment was taken.
        </p>

        {/* Reference badge */}
        <div className="mt-4 rounded-3 border px-5 py-3 bg-white text-center" style={{ borderColor: 'rgba(82,99,78,0.25)' }}>
          <p className="eyebrow text-forest mb-1">Booking reference</p>
          <p className="font-serif fs-3 mb-2" style={{ letterSpacing: '0.15em' }}>{b.reference}</p>
          <StatusBadge status={b.status} />
        </div>
      </div>

      {/* Booking summary */}
      <div className="mx-auto mt-5" style={{ maxWidth: '480px' }}>
        <BookingSummary
          hotelName={b.hotelSnapshot.name}
          city={b.hotelSnapshot.city}
          image={b.hotelSnapshot.image ? { url: b.hotelSnapshot.image, alt: b.hotelSnapshot.imageAlt } : null}
          roomName={b.roomSnapshot.name}
          checkIn={toISODay(b.checkIn)}
          checkOut={toISODay(b.checkOut)}
          nights={b.nights}
          rooms={b.rooms}
          guests={b.guests}
          pricing={b.pricing}
        />
      </div>

      {/* Action buttons */}
      <div className="mt-4 d-flex flex-wrap justify-content-center gap-3">
        <Link to="/bookings" className="btn btn-primary btn-primary">View my bookings</Link>
        <button type="button" onClick={() => window.print()} className="btn btn-secondary d-inline-flex align-items-center gap-2">
          <Printer size={16} aria-hidden="true" /> Print
        </button>
        <Link to="/explore" className="btn btn-ghost">Keep exploring</Link>
      </div>
    </div>
  );
}
