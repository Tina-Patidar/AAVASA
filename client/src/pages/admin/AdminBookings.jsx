import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import { CalendarCheck, Search, LogIn, LogOut, XCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import AppPagination from '../../components/Pagination.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { PriceBreakdown } from '../../components/BookingSummary.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { adminApi, getErrorMessage } from '../../services/api.js';
import { formatDate, formatDateTime, formatINR } from '../../utils/format.js';

const NEXT = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['checked_out'],
  checked_out: [],
  cancelled: [],
  completed: [],
};

const ACTION_CONFIG = {
  checked_in: { label: 'Check In', variant: 'success', icon: LogIn },
  checked_out: { label: 'Check Out', variant: 'secondary', icon: LogOut },
  confirmed: { label: 'Confirm', variant: 'primary', icon: CalendarCheck },
  cancelled: { label: 'Cancel', variant: 'danger', icon: XCircle },
};

export default function AdminBookings() {
  useDocumentTitle('Bookings Management | AAVASA');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const status = params.get('status') || '';
  const page = Number(params.get('page')) || 1;

  const { data, loading, error, reload } = useFetch(
    () => adminApi.bookings({ q: q || undefined, status: status || undefined, page, limit: 10 }),
    [q, status, page]
  );

  const [text, setText] = useState(q);
  const [openDetailId, setOpenDetailId] = useState(null);
  const [change, setChange] = useState(null); // { booking, status }
  const [busy, setBusy] = useState(false);

  const setQuery = (patch) => {
    const n = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    if (!('page' in patch)) n.delete('page');
    setParams(n);
  };

  const applyStatusChange = async () => {
    if (!change) return;
    setBusy(true);
    try {
      await adminApi.updateBookingStatus(change.booking._id, { status: change.status });
      const prettyStatus = change.status.replace('_', ' ');
      toast.success(`Booking ${change.booking.reference} marked as ${prettyStatus}.`);
      setChange(null);
      reload();
    } catch (e) {
      toast.error(getErrorMessage(e));
      setChange(null);
    } finally {
      setBusy(false);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <span className="eyebrow">Front Desk & Reservations</span>
          <h1 className="font-serif fs-2 mb-0">Bookings Management</h1>
        </div>
      </div>

      <Card className="p-3 mb-4 bg-white border shadow-sm">
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            setQuery({ q: text.trim() });
          }}
        >
          <Row className="g-2 align-items-center">
            <Col md={6} xs={12}>
              <Form.Control
                type="search"
                placeholder="Search reference, guest name, email, or property..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                size="sm"
              />
            </Col>
            <Col md={4} xs={8}>
              <Form.Select
                value={status}
                onChange={(e) => setQuery({ status: e.target.value })}
                size="sm"
                aria-label="Filter by booking status"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked_in">Checked In</option>
                <option value="checked_out">Checked Out</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Col>
            <Col md={2} xs={4}>
              <Button type="submit" variant="primary" size="sm" className="w-100 btn-primary">
                <Search size={14} className="me-1" /> Search
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      <div>
        {loading ? (
          <Card className="p-5 text-center text-muted">Loading reservations...</Card>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data || data.bookings.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No bookings found"
            message={q || status ? 'No bookings match your current filter parameters.' : 'No reservations have been recorded yet.'}
          />
        ) : (
          <div className="d-flex flex-column gap-3">
            {data.bookings.map((b) => {
              const allowed = NEXT[b.status] || [];
              const isTodayOrPast = new Date(b.checkIn).toISOString().slice(0, 10) <= todayStr;

              return (
                <Card key={b._id} className="border shadow-sm overflow-hidden">
                  <Card.Body className="p-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="font-monospace fw-bold fs-6">{b.reference}</span>
                          <StatusBadge status={b.status} />
                        </div>
                        <div className="fw-semibold text-dark">
                          {b.hotelSnapshot.name} · {b.roomSnapshot.name}
                        </div>
                        <div className="small text-muted mt-1">
                          Guest: <strong>{b.guestDetails.fullName}</strong> ({b.guestDetails.email}) ·{' '}
                          {formatDate(b.checkIn)} to {formatDate(b.checkOut)} ({b.nights}n, {b.rooms}r) ·{' '}
                          <span className="text-dark fw-bold">{formatINR(b.pricing.total)}</span>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap gap-2">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="btn-sm"
                          onClick={() => setOpenDetailId(openDetailId === b._id ? null : b._id)}
                          aria-expanded={openDetailId === b._id}
                        >
                          {openDetailId === b._id ? 'Hide Details' : 'View Details'}
                        </Button>

                        {/* Workflow Action Buttons (Check-in, Check-out, Cancel) */}
                        {allowed.map((nextSt) => {
                          const config = ACTION_CONFIG[nextSt] || { label: nextSt, variant: 'primary', icon: CalendarCheck };
                          const Icon = config.icon;
                          const isCheckInDisabled = nextSt === 'checked_in' && !isTodayOrPast;

                          return (
                            <Button
                              key={nextSt}
                              variant={config.variant}
                              size="sm"
                              disabled={isCheckInDisabled}
                              title={isCheckInDisabled ? `Check-in is only available on or after ${formatDate(b.checkIn)}` : undefined}
                              className={`btn-sm d-inline-flex align-items-center gap-1 ${
                                nextSt === 'cancelled'
                                  ? 'btn-danger'
                                  : nextSt === 'checked_in'
                                  ? 'btn-success text-white'
                                  : 'btn-primary'
                              }`}
                              onClick={() => setChange({ booking: b, status: nextSt })}
                            >
                              <Icon size={14} /> {config.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Collapsible Details */}
                    {openDetailId === b._id && (
                      <div className="mt-4 pt-3 border-top">
                        <Row className="gy-3">
                          <Col md={6}>
                            <h6 className="eyebrow mb-2">Price Breakdown</h6>
                            <PriceBreakdown pricing={b.pricing} />
                          </Col>
                          <Col md={6}>
                            <h6 className="eyebrow mb-2">Reservation Info</h6>
                            <dl className="row small mb-0">
                              <dt className="col-4 text-muted">Customer:</dt>
                              <dd className="col-8">{b.user?.name} ({b.user?.email})</dd>

                              <dt className="col-4 text-muted">Contact Phone:</dt>
                              <dd className="col-8">{b.guestDetails.phone || 'None provided'}</dd>

                              <dt className="col-4 text-muted">Stay Capacity:</dt>
                              <dd className="col-8">{b.nights} nights, {b.rooms} rooms, {b.guests} guests</dd>

                              <dt className="col-4 text-muted">Booked At:</dt>
                              <dd className="col-8">{formatDateTime(b.createdAt)}</dd>

                              {b.guestDetails.specialRequests && (
                                <>
                                  <dt className="col-4 text-muted">Special Requests:</dt>
                                  <dd className="col-8">{b.guestDetails.specialRequests}</dd>
                                </>
                              )}

                              {b.cancellation?.cancelledAt && (
                                <>
                                  <dt className="col-4 text-danger">Cancelled At:</dt>
                                  <dd className="col-8 text-danger">{formatDateTime(b.cancellation.cancelledAt)}</dd>
                                  {b.cancellation.reason && (
                                    <>
                                      <dt className="col-4 text-danger">Cancel Reason:</dt>
                                      <dd className="col-8 text-danger">{b.cancellation.reason}</dd>
                                    </>
                                  )}
                                </>
                              )}
                            </dl>
                          </Col>
                        </Row>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              );
            })}

            <div className="mt-4 d-flex justify-content-center">
              <AppPagination
                page={data.pagination.page}
                pages={data.pagination.pages}
                onChange={(p) => setQuery({ page: String(p) })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Status Transitions */}
      <ConfirmDialog
        open={Boolean(change)}
        danger={change?.status === 'cancelled'}
        busy={busy}
        title={
          change?.status === 'checked_in'
            ? `Check In Guest: ${change?.booking?.guestDetails?.fullName}?`
            : change?.status === 'checked_out'
            ? `Check Out Guest: ${change?.booking?.guestDetails?.fullName}?`
            : change?.status === 'cancelled'
            ? `Cancel Booking ${change?.booking?.reference}?`
            : `Mark booking ${change?.booking?.reference} as ${change?.status}?`
        }
        message={
          change?.status === 'checked_in'
            ? `Confirm check-in for stay starting ${change?.booking && formatDate(change.booking.checkIn)}. Room keys will be issued.`
            : change?.status === 'checked_out'
            ? `Confirm departure for room ${change?.booking?.roomSnapshot?.name}. This finalizes the stay on record.`
            : change?.status === 'cancelled'
            ? 'The guest room inventory is released immediately. This cancellation cannot be undone.'
            : 'Status changes follow a strict progression and cannot be reversed.'
        }
        confirmLabel={
          change?.status === 'checked_in'
            ? 'Confirm Check-In'
            : change?.status === 'checked_out'
            ? 'Confirm Check-Out'
            : change?.status === 'cancelled'
            ? 'Cancel Booking'
            : `Mark ${change?.status}`
        }
        cancelLabel="Keep as is"
        onConfirm={applyStatusChange}
        onCancel={() => setChange(null)}
      />
    </div>
  );
}
