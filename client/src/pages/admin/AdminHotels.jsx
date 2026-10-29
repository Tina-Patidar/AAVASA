import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Pencil, Plus, BedDouble, Trash2, Search, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import AppPagination from '../../components/Pagination.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { adminApi, getErrorMessage } from '../../services/api.js';
import { formatINR } from '../../utils/format.js';

export default function AdminHotels() {
  useDocumentTitle('Property Management | AAVASA');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const status = params.get('status') || '';
  const page = Number(params.get('page')) || 1;

  const { data, loading, error, reload } = useFetch(
    () => adminApi.hotels({ q: q || undefined, status: status || undefined, page, limit: 10 }),
    [q, status, page]
  );
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState(q);

  const setQuery = (patch) => {
    const n = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    if (!('page' in patch)) n.delete('page');
    setParams(n);
  };

  const remove = async () => {
    setBusy(true);
    try {
      const r = await adminApi.deleteHotel(target._id);
      toast.success(r.message);
      setTarget(null);
      reload();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (h) => {
    try {
      await adminApi.updateHotel(h._id, { isActive: !h.isActive });
      toast.success(h.isActive ? 'Property deactivated.' : 'Property activated.');
      reload();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <span className="eyebrow">Catalogue Admin</span>
          <h1 className="font-serif fs-2 mb-0">Hotel Properties</h1>
        </div>
        <Button as={Link} to="/admin/hotels/new" variant="primary" size="sm" className="btn-primary d-inline-flex align-items-center gap-1">
          <Plus size={16} /> Add Property
        </Button>
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
                placeholder="Search by hotel name or city..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                size="sm"
              />
            </Col>
            <Col md={3} xs={8}>
              <Form.Select
                value={status}
                onChange={(e) => setQuery({ status: e.target.value })}
                size="sm"
                aria-label="Filter by property status"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
          <Card className="p-5 text-center text-muted">Loading properties...</Card>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data || data.hotels.length === 0 ? (
          <EmptyState icon={BedDouble} title="No properties found" />
        ) : (
          <Card className="border shadow-sm overflow-hidden">
            <Table responsive hover className="table-aavasa mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Rooms Inventory</th>
                  <th>Starting Rate</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.hotels.map((h) => (
                  <tr key={h._id}>
                    <td>
                      <div className="fw-semibold text-dark">{h.name}</div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        {h.city}, {h.state}
                      </div>
                    </td>
                    <td>{h.propertyType}</td>
                    <td>
                      <span className="small text-muted">
                        {h.roomTypeCount} types · {h.roomCount} rooms
                      </span>
                    </td>
                    <td className="fw-medium text-dark">{formatINR(h.startingPrice)}</td>
                    <td>
                      <StatusBadge status={h.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        <Button
                          as={Link}
                          to={`/admin/hotels/${h._id}/rooms`}
                          variant="outline-secondary"
                          size="sm"
                          className="btn-sm"
                        >
                          Rooms
                        </Button>
                        <Button
                          as={Link}
                          to={`/admin/hotels/${h._id}/edit`}
                          variant="outline-secondary"
                          size="sm"
                          className="btn-sm"
                          aria-label={`Edit ${h.name}`}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => toggle(h)}
                          className="btn-sm"
                        >
                          {h.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => setTarget(h)}
                          className="btn-sm text-danger"
                          aria-label={`Delete ${h.name}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      <ConfirmDialog
        open={Boolean(target)}
        danger
        busy={busy}
        title="Delete this property?"
        message={`${target?.name}: If this property has booking history, it will be deactivated instead of deleted so guest records remain preserved. Otherwise, it and its rooms are removed.`}
        confirmLabel="Delete Property"
        cancelLabel="Keep Property"
        onConfirm={remove}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
