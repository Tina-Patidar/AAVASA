import { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import Badge from 'react-bootstrap/Badge';
import { Search, User, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi, getErrorMessage } from '../../services/api.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import AppPagination from '../../components/Pagination.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { formatDate, formatINR } from '../../utils/format.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

export default function AdminGuests() {
  useDocumentTitle('Guest Management | AAVASA');
  const [guests, setGuests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected guest for profile modal
  const [selectedGuestId, setSelectedGuestId] = useState(null);
  const [guestDetail, setGuestDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchGuests = (page = 1, query = search) => {
    setLoading(true);
    setError(null);
    adminApi
      .guests({ page, limit: 10, q: query || undefined })
      .then((data) => {
        setGuests(data.guests || []);
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      })
      .catch((err) => setError(getErrorMessage(err, 'Could not load guests.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGuests(1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGuests(1, search);
  };

  const openGuestModal = (guestId) => {
    setSelectedGuestId(guestId);
    setDetailLoading(true);
    adminApi
      .guest(guestId)
      .then((data) => {
        setGuestDetail(data);
        setNotes(data.guest.staffNotes || '');
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Failed to load guest profile.')))
      .finally(() => setDetailLoading(false));
  };

  const closeGuestModal = () => {
    setSelectedGuestId(null);
    setGuestDetail(null);
  };

  const saveStaffNotes = async () => {
    if (!selectedGuestId) return;
    setSavingNotes(true);
    try {
      await adminApi.updateGuestNotes(selectedGuestId, { staffNotes: notes });
      toast.success('Internal staff notes saved.');
      // Update local state
      setGuestDetail((prev) => prev && { ...prev, guest: { ...prev.guest, staffNotes: notes } });
      setGuests((prev) =>
        prev.map((g) => (g.id === selectedGuestId ? { ...g, staffNotes: notes } : g))
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save internal notes.'));
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <span className="eyebrow">Front Desk & CRM</span>
          <h1 className="font-serif fs-2 mb-0">Guest Management</h1>
        </div>
        <Form onSubmit={handleSearchSubmit} className="d-flex gap-2" style={{ maxWidth: '360px', width: '100%' }}>
          <Form.Control
            type="search"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control-sm"
          />
          <Button type="submit" variant="primary" size="sm" className="btn-primary">
            <Search size={15} />
          </Button>
        </Form>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => fetchGuests(pagination.page)} />
      ) : loading ? (
        <Card className="p-5 text-center text-muted">Loading guests...</Card>
      ) : guests.length === 0 ? (
        <EmptyState
          title="No guests found"
          message={search ? `No guests match "${search}". Try searching for another name or email.` : 'No guests have registered on AAVASA yet.'}
          action={
            search && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  setSearch('');
                  fetchGuests(1, '');
                }}
              >
                Clear search
              </Button>
            )
          }
        />
      ) : (
        <Card className="border shadow-sm overflow-hidden">
          <Table responsive hover className="table-aavasa mb-0">
            <thead className="bg-light">
              <tr>
                <th>Guest</th>
                <th>Contact</th>
                <th>Total Stays</th>
                <th>Total Spend</th>
                <th>Internal Notes</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.id}>
                  <td>
                    <div className="fw-semibold text-dark">{g.name}</div>
                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                      Member since {formatDate(g.createdAt)}
                    </div>
                  </td>
                  <td>
                    <div className="small">{g.email}</div>
                    {g.phone && <div className="text-muted small">{g.phone}</div>}
                  </td>
                  <td>
                    <Badge bg="secondary" className="bg-sage text-forest fw-semibold">
                      {g.bookingCount} booking{g.bookingCount !== 1 ? 's' : ''}
                    </Badge>
                  </td>
                  <td className="fw-medium text-dark">
                    {formatINR(g.totalSpend || 0)}
                  </td>
                  <td>
                    {g.staffNotes ? (
                      <span className="small text-truncate d-inline-block text-muted" style={{ maxWidth: '200px' }}>
                        {g.staffNotes}
                      </span>
                    ) : (
                      <span className="text-muted small fst-italic">None</span>
                    )}
                  </td>
                  <td className="text-end">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => openGuestModal(g.id)}
                      className="btn-sm"
                    >
                      View Profile
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="p-3 border-top d-flex justify-content-between align-items-center">
            <span className="small text-muted">Showing {guests.length} of {pagination.total} guests</span>
            <AppPagination
              page={pagination.page}
              pages={pagination.pages}
              onChange={(p) => fetchGuests(p)}
            />
          </div>
        </Card>
      )}

      {/* Guest Profile & Booking History Modal */}
      <Modal show={Boolean(selectedGuestId)} onHide={closeGuestModal} size="lg" centered>
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title as="h4" className="font-serif">
            Guest Profile & History
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {detailLoading || !guestDetail ? (
            <div className="text-center py-5 text-muted">Loading guest details...</div>
          ) : (
            <div>
              {/* Profile Overview */}
              <Row className="gy-3 mb-4 pb-3 border-bottom">
                <Col md={6}>
                  <h5 className="font-serif fs-5 mb-1">{guestDetail.guest.name}</h5>
                  <p className="text-muted small mb-1">{guestDetail.guest.email}</p>
                  <p className="text-muted small mb-0">Phone: {guestDetail.guest.phone || 'Not provided'}</p>
                  {guestDetail.guest.city && <p className="text-muted small mb-0">City: {guestDetail.guest.city}</p>}
                </Col>
                <Col md={6} className="d-flex flex-column justify-content-center align-items-md-end">
                  <div className="small text-muted text-uppercase mb-1">Total Recorded Spend</div>
                  <div className="font-serif fs-4 fw-bold text-forest">{formatINR(guestDetail.guest.totalSpend || 0)}</div>
                  <Badge bg="secondary" className="mt-1 bg-sage text-forest">
                    {guestDetail.guest.bookingCount} Stays on Record
                  </Badge>
                </Col>
              </Row>

              {/* Internal Staff Notes */}
              <Card className="mb-4 bg-light border p-3">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <FileText size={16} className="text-forest" />
                  <span className="fw-semibold text-dark small text-uppercase">Internal Staff Notes</span>
                  <Badge bg="warning" className="text-dark small ms-auto fw-normal">
                    Visible only to Staff / Admin
                  </Badge>
                </div>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record guest preferences, dietary requirements, room requests, VIP status, or past check-in feedback..."
                  className="mb-2 bg-white"
                />
                <div className="d-flex justify-content-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={saveStaffNotes}
                    disabled={savingNotes}
                    className="btn-primary"
                  >
                    {savingNotes ? 'Saving...' : 'Save Internal Note'}
                  </Button>
                </div>
              </Card>

              {/* Booking History */}
              <h5 className="font-serif fs-6 mb-3">Booking History ({guestDetail.bookings?.length || 0})</h5>
              {(!guestDetail.bookings || guestDetail.bookings.length === 0) ? (
                <p className="text-muted small">No bookings made by this guest yet.</p>
              ) : (
                <Table responsive hover className="table-aavasa small mb-0 border">
                  <thead className="bg-light">
                    <tr>
                      <th>Reference</th>
                      <th>Hotel</th>
                      <th>Stay Dates</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guestDetail.bookings.map((b) => (
                      <tr key={b._id}>
                        <td className="fw-semibold font-monospace">{b.reference}</td>
                        <td>{b.hotelSnapshot?.name || b.hotel?.name || 'Property'}</td>
                        <td>{formatDate(b.checkIn)} - {formatDate(b.checkOut)}</td>
                        <td className="fw-medium">{formatINR(b.pricing?.total)}</td>
                        <td><StatusBadge status={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="secondary" size="sm" onClick={closeGuestModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

