import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Badge from 'react-bootstrap/Badge';
import { Pencil, Plus, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import FormField from '../../components/FormField.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { adminApi, getErrorMessage } from '../../services/api.js';
import { formatDate, formatINR } from '../../utils/format.js';

// Keep in sync with server/models/RoomType.js
const ROOM_AMENITIES = [
  'King Bed',
  'Twin Beds',
  'Queen Bed',
  'Private Balcony',
  'Garden View',
  'Mountain View',
  'Sea View',
  'Pool Access',
  'Bathtub',
  'Rain Shower',
  'Work Desk',
  'Mini Bar',
  'Tea & Coffee Maker',
  'Living Area',
];

const blank = {
  name: '',
  description: '',
  pricePerNight: 5000,
  maxGuests: 2,
  totalRooms: 1,
  sizeSqFt: 300,
  amenities: [],
  isActive: true,
};

function RoomForm({ initial, onSave, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { ...blank, ...initial } });

  return (
    <Card className="my-4 border shadow-sm p-4 bg-white" aria-label={initial?._id ? 'Edit room type' : 'New room type'}>
      <Form onSubmit={handleSubmit(onSave)} noValidate>
        <h3 className="font-serif fs-4 mb-3">{initial?._id ? 'Edit Room Type' : 'New Room Type'}</h3>
        <Row className="gy-3">
          <Col md={12}>
            <FormField label="Name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          </Col>
          <Col md={12}>
            <FormField as="textarea" rows={2} label="Description" {...register('description')} />
          </Col>
          <Col md={6}>
            <FormField
              label="Price per night (INR)"
              type="number"
              min="100"
              error={errors.pricePerNight?.message}
              {...register('pricePerNight', { required: 'Price is required', min: { value: 100, message: 'At least 100' } })}
            />
          </Col>
          <Col md={6}>
            <FormField
              label="Max guests per room"
              type="number"
              min="1"
              max="12"
              error={errors.maxGuests?.message}
              {...register('maxGuests', {
                required: 'Required',
                min: { value: 1, message: 'At least 1' },
                max: { value: 12, message: 'At most 12' },
              })}
            />
          </Col>
          <Col md={6}>
            <FormField
              label="Room inventory (total count)"
              type="number"
              min="0"
              max="200"
              hint="Cannot be set below count of rooms already booked on future dates."
              error={errors.totalRooms?.message}
              {...register('totalRooms', { required: 'Required', min: { value: 0, message: 'Cannot be negative' } })}
            />
          </Col>
          <Col md={6}>
            <FormField label="Size (sq ft)" type="number" min="50" {...register('sizeSqFt')} />
          </Col>
          <Col md={12}>
            <Form.Label className="form-label">Room Amenities</Form.Label>
            <div className="d-flex flex-wrap gap-3 p-3 bg-light rounded-3">
              {ROOM_AMENITIES.map((a) => (
                <Form.Check
                  key={a}
                  type="checkbox"
                  id={`room-amenity-${a}`}
                  label={a}
                  value={a}
                  className="small"
                  {...register('amenities')}
                />
              ))}
            </div>
          </Col>
          <Col md={12}>
            <Form.Check
              type="checkbox"
              id="room-active"
              label="Active (visible and bookable by guests)"
              className="fw-medium small"
              {...register('isActive')}
            />
          </Col>
          <Col md={12} className="d-flex gap-2 mt-4">
            <Button type="submit" variant="primary" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : 'Save room type'}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel} className="btn-secondary">
              Cancel
            </Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}

export default function AdminRooms() {
  const { id } = useParams();
  useDocumentTitle('Property Room Inventory | AAVASA');
  const { data, loading, error, reload } = useFetch(() => adminApi.rooms(id), [id]);
  const [editing, setEditing] = useState(null); // null | 'new' | room
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async (v) => {
    const body = {
      name: v.name,
      description: v.description || '',
      pricePerNight: Number(v.pricePerNight),
      maxGuests: Number(v.maxGuests),
      totalRooms: Number(v.totalRooms),
      sizeSqFt: Number(v.sizeSqFt) || undefined,
      amenities: v.amenities || [],
      isActive: Boolean(v.isActive),
    };
    try {
      if (editing === 'new') await adminApi.createRoom(id, body);
      else await adminApi.updateRoom(editing._id, body);
      toast.success('Room type saved.');
      setEditing(null);
      reload();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const r = await adminApi.deleteRoom(target._id);
      toast.success(r.message);
      setTarget(null);
      reload();
    } catch (e) {
      toast.error(getErrorMessage(e));
      setTarget(null);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Card className="p-5 text-center text-muted">Loading room types...</Card>;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <Link to="/admin/hotels" className="text-forest small text-decoration-none d-inline-flex align-items-center gap-1 mb-1">
            <ArrowLeft size={14} /> Back to Properties
          </Link>
          <h1 className="font-serif fs-2 mb-0">Rooms · {data.hotel.name}</h1>
        </div>
        <Button variant="primary" size="sm" className="btn-primary d-inline-flex align-items-center gap-1" onClick={() => setEditing('new')}>
          <Plus size={16} /> Add Room Type
        </Button>
      </div>

      {editing && (
        <RoomForm
          key={editing === 'new' ? 'new' : editing._id}
          initial={editing === 'new' ? undefined : editing}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="d-flex flex-column gap-3 mt-4">
        {data.rooms.length === 0 && (
          <p className="text-muted small">No room types yet. Add one so guests can book this property.</p>
        )}
        {data.rooms.map((r) => {
          // Today's occupancy calculation
          const todayOcc = r.occupancy?.[0] || { booked: 0, free: r.totalRooms };
          const bookedToday = todayOcc.booked || 0;
          const total = r.totalRooms || 0;
          const occupancyRate = total > 0 ? Math.round((bookedToday / total) * 100) : 0;
          const progressVariant = occupancyRate >= 100 ? 'danger' : occupancyRate >= 50 ? 'warning' : 'success';

          return (
            <Card key={r._id} className="border shadow-sm p-4">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                <div>
                  <h3 className="font-serif fs-4 mb-1 text-dark">{r.name}</h3>
                  <div className="small text-muted">
                    {formatINR(r.pricePerNight)} / night · up to {r.maxGuests} guests · {r.totalRooms} rooms total
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <StatusBadge status={r.isActive ? 'active' : 'inactive'} />
                  <Button variant="outline-secondary" size="sm" className="btn-sm" onClick={() => setEditing(r)} aria-label={`Edit ${r.name}`}>
                    <Pencil size={14} />
                  </Button>
                  <Button variant="outline-danger" size="sm" className="btn-sm text-danger" onClick={() => setTarget(r)} aria-label={`Delete ${r.name}`}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {/* Today's Occupancy Progress Bar (Course Spec Requirement) */}
              <div className="p-3 bg-light rounded-3 my-2 border">
                <div className="d-flex justify-content-between align-items-center small mb-1">
                  <span className="fw-semibold text-dark">Today's Real-Time Occupancy:</span>
                  <span className="fw-bold text-dark">
                    {bookedToday} / {total} rooms booked ({occupancyRate}%)
                  </span>
                </div>
                <ProgressBar
                  now={occupancyRate}
                  variant={progressVariant}
                  style={{ height: '10px' }}
                  className="rounded-pill"
                />
              </div>

              {/* 14-day upcoming booked counter */}
              <div className="mt-3">
                <span className="eyebrow mb-2">Booked rooms, next 14 days</span>
                {r.occupancy.length > 0 && (
                  <div className="d-flex flex-wrap gap-1 mt-2">
                    {r.occupancy.map((o) => (
                      <span
                        key={o.date}
                        className={`badge p-2 fw-normal ${o.free === 0 ? 'bg-danger text-white' : 'bg-sage text-forest'}`}
                        title={`${o.free} free`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {formatDate(o.date, { day: 'numeric', month: 'short' })}: {o.booked}/{r.totalRooms}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={Boolean(target)}
        danger
        busy={busy}
        title="Remove this room type?"
        message="If it has booking history it will be deactivated instead of deleted. Room types with upcoming bookings cannot be removed."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={remove}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
