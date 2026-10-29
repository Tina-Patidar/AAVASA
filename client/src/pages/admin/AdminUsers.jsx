import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import { Users, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import AppPagination from '../../components/Pagination.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { adminApi, getErrorMessage } from '../../services/api.js';
import { formatDate, formatINR } from '../../utils/format.js';

export default function AdminUsers() {
  useDocumentTitle('User Accounts Admin | AAVASA');
  const { user: me } = useAuth();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const roleFilter = params.get('role') || '';
  const page = Number(params.get('page')) || 1;

  const { data, loading, error, reload } = useFetch(
    () => adminApi.users({ q: q || undefined, role: roleFilter || undefined, page, limit: 10 }),
    [q, roleFilter, page]
  );
  const [text, setText] = useState(q);
  const [history, setHistory] = useState(null);
  const [change, setChange] = useState(null);
  const [busy, setBusy] = useState(false);

  const setQuery = (patch) => {
    const n = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    if (!('page' in patch)) n.delete('page');
    setParams(n);
  };

  const showHistory = async (u) => {
    try {
      const r = await adminApi.user(u.id);
      setHistory({ user: r.user, bookings: r.bookings });
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const applyChange = async () => {
    setBusy(true);
    try {
      await adminApi.updateUser(change.user.id, change.patch);
      toast.success('Account updated successfully.');
      setChange(null);
      reload();
    } catch (e) {
      toast.error(getErrorMessage(e));
      setChange(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <span className="eyebrow">User Administration</span>
          <h1 className="font-serif fs-2 mb-0">Registered Accounts</h1>
        </div>
      </div>

      <Card className="p-3 mb-4 border shadow-sm bg-white">
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            setQuery({ q: text.trim() });
          }}
        >
          <Row className="g-2 align-items-center">
            <Col md={7} xs={12}>
              <Form.Control
                type="search"
                placeholder="Search accounts by name or email..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                size="sm"
              />
            </Col>
            <Col md={3} xs={8}>
              <Form.Select
                value={roleFilter}
                onChange={(e) => setQuery({ role: e.target.value })}
                size="sm"
                aria-label="Filter by role"
              >
                <option value="">All roles</option>
                <option value="user">Guests</option>
                <option value="staff">Staff</option>
                <option value="admin">Administrators</option>
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
          <Card className="p-5 text-center text-muted">Loading user accounts...</Card>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data || data.users.length === 0 ? (
          <EmptyState icon={Users} title="No user accounts found" />
        ) : (
          <Card className="border shadow-sm overflow-hidden">
            <Table responsive hover className="table-aavasa mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Account</th>
                  <th>Assigned Role</th>
                  <th>Reservations</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th className="text-end">Role & Access Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => {
                  const isSelf = u.id === me?.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="fw-semibold text-dark">{u.name}</div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                          {u.email}
                        </div>
                      </td>
                      <td>
                        <Badge
                          bg={u.role === 'admin' ? 'dark' : u.role === 'staff' ? 'primary' : 'secondary'}
                          className="text-uppercase fw-normal"
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td>
                        <span className="small text-muted">{u.bookingCount} bookings</span>
                      </td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td>
                        <StatusBadge status={u.isActive ? 'active' : 'inactive'} />
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex flex-wrap justify-content-end gap-1">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="btn-sm"
                            onClick={() => showHistory(u)}
                          >
                            History
                          </Button>

                          {!isSelf && (
                            <>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="btn-sm"
                                onClick={() =>
                                  setChange({
                                    user: u,
                                    patch: { isActive: !u.isActive },
                                    label: u.isActive ? 'deactivate' : 'activate',
                                  })
                                }
                              >
                                {u.isActive ? 'Deactivate' : 'Activate'}
                              </Button>

                              {/* Role Assignment Buttons */}
                              {u.role !== 'admin' && (
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="btn-sm"
                                  onClick={() =>
                                    setChange({
                                      user: u,
                                      patch: { role: 'admin' },
                                      label: 'promote to Administrator',
                                    })
                                  }
                                >
                                  Make Admin
                                </Button>
                              )}
                              {u.role !== 'staff' && (
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="btn-sm"
                                  onClick={() =>
                                    setChange({
                                      user: u,
                                      patch: { role: 'staff' },
                                      label: 'assign Staff role to',
                                    })
                                  }
                                >
                                  Make Staff
                                </Button>
                              )}
                              {u.role !== 'user' && (
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="btn-sm"
                                  onClick={() =>
                                    setChange({
                                      user: u,
                                      patch: { role: 'user' },
                                      label: 'change to regular Guest',
                                    })
                                  }
                                >
                                  Make Guest
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <div className="p-3 border-top d-flex justify-content-center">
              <AppPagination
                page={data.pagination.page}
                pages={data.pagination.pages}
                onChange={(p) => setQuery({ page: String(p) })}
              />
            </div>
          </Card>
        )}
      </div>

      {history && (
        <Card className="mt-4 p-4 border shadow-sm bg-white" aria-label="Booking history">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="font-serif fs-5 mb-0">Booking History: {history.user.name}</h4>
            <Button variant="outline-secondary" size="sm" onClick={() => setHistory(null)}>
              Close History
            </Button>
          </div>
          {history.bookings.length === 0 ? (
            <p className="text-muted small mb-0">No bookings on record for this user.</p>
          ) : (
            <Table hover responsive className="table-aavasa small mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Reference</th>
                  <th>Property</th>
                  <th>Dates</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.bookings.map((b) => (
                  <tr key={b._id}>
                    <td className="fw-semibold font-monospace">{b.reference}</td>
                    <td>{b.hotelSnapshot?.name || 'Property'}</td>
                    <td>{formatDate(b.checkIn)}</td>
                    <td className="fw-medium">{formatINR(b.pricing?.total)}</td>
                    <td><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(change)}
        busy={busy}
        title="Confirm Account Change"
        message={change ? `You are about to ${change.label} ${change.user.name} (${change.user.email}).` : ''}
        confirmLabel="Apply Change"
        cancelLabel="Cancel"
        onConfirm={applyChange}
        onCancel={() => setChange(null)}
      />
    </div>
  );
}
