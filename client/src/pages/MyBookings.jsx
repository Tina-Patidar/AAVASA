import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { CalendarCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import SmartImage from '../components/SmartImage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import AppPagination from '../components/Pagination.jsx';
import { ListSkeleton } from '../components/Skeletons.jsx';
import { PriceBreakdown } from '../components/BookingSummary.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { bookingApi, getErrorMessage } from '../services/api.js';
import { formatDate, formatDateTime, formatINR, plural } from '../utils/format.js';

const TABS = [['upcoming', 'Upcoming'], ['past', 'Past'], ['cancelled', 'Cancelled']];

function BookingItem({ b, onCancel }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="card mb-4 overflow-hidden">
      <Row className="g-0">
        {/* Property thumbnail */}
        <Col sm={4} md={3} style={{ minHeight: '140px' }}>
          <SmartImage
            src={b.hotelSnapshot.image}
            alt={b.hotelSnapshot.imageAlt || b.hotelSnapshot.name}
            width={500}
            className="w-100 h-100 object-fit-cover"
            style={{ minHeight: '140px' }}
          />
        </Col>
        <Col sm={8} md={9} className="p-4">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
            <div>
              <p className="text-uppercase small text-muted mb-1" style={{ letterSpacing: '0.07em', fontSize: '0.72rem' }}>
                {b.reference}
              </p>
              <h3 className="font-serif fs-5 mb-1">{b.hotelSnapshot.name}</h3>
              <p className="small text-muted mb-0">{b.roomSnapshot.name} · {b.hotelSnapshot.city}</p>
            </div>
            <StatusBadge status={b.status} />
          </div>

          <p className="small mt-3 mb-1">
            {formatDate(b.checkIn)} to {formatDate(b.checkOut)} · {plural(b.nights, 'night')} · {plural(b.rooms, 'room')} · {plural(b.guests, 'guest')}
          </p>
          <p className="font-serif fs-5 mb-3">{formatINR(b.pricing.total)}</p>

          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
            >
              {open ? 'Hide details' : 'View details'}
            </button>
            {b.status !== 'cancelled' && (
              <Link to={`/bookings/${b._id}/confirmation`} className="btn btn-sm btn-ghost">
                Confirmation
              </Link>
            )}
            {b.canCancel && (
              <button type="button" className="btn btn-sm btn-danger" onClick={() => onCancel(b)}>
                Cancel booking
              </button>
            )}
          </div>
        </Col>
      </Row>

      {/* Expandable details panel */}
      {open && (
        <div className="border-top p-4 bg-ivory">
          <Row className="g-4">
            <Col md={6}>
              <PriceBreakdown pricing={b.pricing} />
            </Col>
            <Col md={6}>
              <dl className="small">
                <div className="mb-2">
                  <dt className="text-uppercase text-muted mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.07em' }}>Guest</dt>
                  <dd className="mb-0">{b.guestDetails.fullName} · {b.guestDetails.email}</dd>
                </div>
                {b.guestDetails.specialRequests && (
                  <div className="mb-2">
                    <dt className="text-uppercase text-muted mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.07em' }}>Special requests</dt>
                    <dd className="mb-0">{b.guestDetails.specialRequests}</dd>
                  </div>
                )}
                <div className="mb-2">
                  <dt className="text-uppercase text-muted mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.07em' }}>Payment</dt>
                  <dd className="mb-0">Demo mode (no money taken)</dd>
                </div>
                <div className="mb-2">
                  <dt className="text-uppercase text-muted mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.07em' }}>Booked on</dt>
                  <dd className="mb-0">{formatDateTime(b.createdAt)}</dd>
                </div>
                {b.cancellation?.cancelledAt && (
                  <div>
                    <dt className="text-uppercase text-muted mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.07em' }}>Cancelled</dt>
                    <dd className="mb-0">
                      {formatDateTime(b.cancellation.cancelledAt)}
                      {b.cancellation.freeCancellation ? ' (within free cancellation window)' : ''}
                    </dd>
                  </div>
                )}
              </dl>
            </Col>
          </Row>
        </div>
      )}
    </li>
  );
}

export default function MyBookings() {
  useDocumentTitle('My Bookings');
  const [params, setParams] = useSearchParams();
  const group = TABS.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'upcoming';
  const page = Number(params.get('page')) || 1;
  const { data, loading, error, reload } = useFetch(() => bookingApi.list({ group, page, limit: 6 }), [group, page]);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const setTab = (tab) => setParams({ tab });

  const confirmCancel = async () => {
    setBusy(true);
    try {
      await bookingApi.cancel(target._id);
      toast.success(`Booking ${target.reference} has been cancelled.`);
      setTarget(null);
      reload();
    } catch (e) {
      toast.error(getErrorMessage(e));
      setTarget(null);
      reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page py-4 py-md-5" style={{ maxWidth: '900px' }}>
      <p className="eyebrow">My bookings</p>
      <h1 className="mt-3 font-serif fs-1">Your stays</h1>

      {/* Tabs */}
      <Nav
        variant="tabs"
        className="mt-4 border-bottom"
        role="tablist"
        aria-label="Booking groups"
      >
        {TABS.map(([key, label]) => (
          <Nav.Item key={key}>
            <Nav.Link
              role="tab"
              aria-selected={group === key}
              active={group === key}
              onClick={() => setTab(key)}
              style={{ cursor: 'pointer' }}
            >
              {label}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <div className="mt-4" role="tabpanel">
        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : data.bookings.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title={`No ${group} bookings`}
            message={
              group === 'upcoming'
                ? 'When you book a stay it will appear here.'
                : 'Nothing to show in this group yet.'
            }
            action={
              group === 'upcoming' && (
                <Link to="/explore" className="btn btn-primary btn-primary">
                  Explore stays
                </Link>
              )
            }
          />
        ) : (
          <>
            <ul className="list-unstyled">
              {data.bookings.map((b) => (
                <BookingItem key={b._id} b={b} onCancel={setTarget} />
              ))}
            </ul>
            <AppPagination
              page={data.pagination.page}
              pages={data.pagination.pages}
              onChange={(p) => setParams({ tab: group, page: p })}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!target}
        danger
        busy={busy}
        title="Cancel this booking?"
        message={
          target
            ? `${target.hotelSnapshot.name}, ${formatDate(target.checkIn)} to ${formatDate(target.checkOut)}. Your rooms will be released and this cannot be undone.`
            : ''
        }
        confirmLabel="Yes, cancel booking"
        cancelLabel="Keep booking"
        onConfirm={confirmCancel}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
