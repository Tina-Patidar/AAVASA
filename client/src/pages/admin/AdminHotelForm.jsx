import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import FormField from '../../components/FormField.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { adminApi, getErrorMessage, getFieldErrors } from '../../services/api.js';

// Keep in sync with server/models/Hotel.js
const TYPES = ['Boutique Hotel', 'Resort', 'Heritage Haveli', 'Mountain Retreat', 'Beach Villa', 'City Hotel'];
const AMENITIES = [
  'Free Wi-Fi',
  'Swimming Pool',
  'Spa',
  'Restaurant',
  'Breakfast Included',
  'Air Conditioning',
  'Parking',
  'Gym',
  'Bar & Lounge',
  'Garden',
  'Airport Transfer',
  'Pet Friendly',
  'Yoga Deck',
  'Bonfire',
];

const blank = {
  name: '',
  tagline: '',
  description: '',
  propertyType: 'Boutique Hotel',
  starCategory: 3,
  city: '',
  state: '',
  address: '',
  lat: '',
  lng: '',
  images: [{ url: '', alt: '' }],
  amenities: [],
  checkInTime: '14:00',
  checkOutTime: '11:00',
  cancellation: '',
  freeCancellationHours: 48,
  houseRules: '',
  featured: false,
  isActive: true,
};

export default function AdminHotelForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  useDocumentTitle(editing ? 'Edit property | AAVASA' : 'New property | AAVASA');
  const navigate = useNavigate();
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(editing);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: blank });

  const { fields, append, remove } = useFieldArray({ control, name: 'images' });

  useEffect(() => {
    if (!editing) return;
    adminApi
      .hotel(id)
      .then(({ hotel: h }) => {
        reset({
          ...blank,
          ...h,
          lat: h.location?.lat ?? '',
          lng: h.location?.lng ?? '',
          checkInTime: h.policies?.checkInTime,
          checkOutTime: h.policies?.checkOutTime,
          cancellation: h.policies?.cancellation,
          freeCancellationHours: h.policies?.freeCancellationHours,
          houseRules: h.policies?.houseRules,
        });
      })
      .catch((e) => setLoadError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, editing, reset]);

  const onSubmit = async (v) => {
    const payload = {
      name: v.name,
      tagline: v.tagline,
      description: v.description,
      propertyType: v.propertyType,
      starCategory: Number(v.starCategory),
      city: v.city,
      state: v.state,
      address: v.address,
      ...(v.lat !== '' && v.lng !== '' ? { location: { lat: Number(v.lat), lng: Number(v.lng) } } : {}),
      images: v.images.filter((i) => i.url.trim()),
      amenities: v.amenities || [],
      policies: {
        checkInTime: v.checkInTime,
        checkOutTime: v.checkOutTime,
        cancellation: v.cancellation || undefined,
        freeCancellationHours: Number(v.freeCancellationHours),
        houseRules: v.houseRules || undefined,
      },
      featured: Boolean(v.featured),
      isActive: Boolean(v.isActive),
    };
    try {
      const res = editing ? await adminApi.updateHotel(id, payload) : await adminApi.createHotel(payload);
      toast.success(editing ? 'Property updated.' : 'Property created. Now add its rooms.');
      navigate(editing ? '/admin/hotels' : `/admin/hotels/${res.hotel._id}/rooms`);
    } catch (e) {
      Object.entries(getFieldErrors(e)).forEach(([f, m]) => setError(f.split('.')[0], { message: m }));
      toast.error(getErrorMessage(e));
    }
  };

  if (loading) return <Card className="p-5 text-center text-muted">Loading property details...</Card>;
  if (loadError) return <ErrorState message={loadError} />;

  return (
    <Form onSubmit={handleSubmit(onSubmit)} noValidate className="d-flex flex-column gap-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <Link to="/admin/hotels" className="text-forest small text-decoration-none d-inline-flex align-items-center gap-1 mb-1">
            <ArrowLeft size={14} /> Back to Properties
          </Link>
          <h1 className="font-serif fs-2 mb-0">{editing ? 'Edit Property' : 'Create New Property'}</h1>
        </div>
        <div className="d-flex gap-2">
          <Button as={Link} to="/admin/hotels" variant="secondary" size="sm" className="btn-secondary">
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Saving...' : editing ? 'Update Property' : 'Save & Continue'}
          </Button>
        </div>
      </div>

      {/* Property Basics */}
      <Card className="p-4 border shadow-sm bg-white" aria-label="Basics">
        <h3 className="font-serif fs-5 mb-3 text-dark">Basic Information</h3>
        <Row className="gy-3">
          <Col md={12}>
            <FormField label="Property Name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          </Col>
          <Col md={12}>
            <FormField label="Tagline" error={errors.tagline?.message} {...register('tagline')} />
          </Col>
          <Col md={12}>
            <FormField as="textarea" rows={4} label="Full Description" error={errors.description?.message} {...register('description', { required: 'Description is required' })} />
          </Col>
          <Col md={6}>
            <FormField as="select" label="Property Type" {...register('propertyType')}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </FormField>
          </Col>
          <Col md={6}>
            <FormField as="select" label="Star Category" {...register('starCategory')}>
              {[1, 2, 3, 4, 5].map((s) => (
                <option key={s} value={s}>
                  {s} star{s > 1 ? 's' : ''}
                </option>
              ))}
            </FormField>
          </Col>
          <Col md={6}>
            <FormField label="City" error={errors.city?.message} {...register('city', { required: 'City is required' })} />
          </Col>
          <Col md={6}>
            <FormField label="State / Province" {...register('state')} />
          </Col>
          <Col md={12}>
            <FormField label="Complete Address" error={errors.address?.message} {...register('address', { required: 'Address is required' })} />
          </Col>
          <Col md={6}>
            <FormField label="Latitude (Optional)" type="number" step="any" {...register('lat')} />
          </Col>
          <Col md={6}>
            <FormField label="Longitude (Optional)" type="number" step="any" {...register('lng')} />
          </Col>
        </Row>
      </Card>

      {/* Photography & Media */}
      <Card className="p-4 border shadow-sm bg-white" aria-label="Images">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3 className="font-serif fs-5 mb-0 text-dark">Photographs</h3>
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            onClick={() => append({ url: '', alt: '' })}
            disabled={fields.length >= 12}
            className="btn-sm d-inline-flex align-items-center gap-1"
          >
            <Plus size={14} /> Add photo
          </Button>
        </div>
        <p className="text-muted small mb-3">
          Provide image URLs (e.g., Unsplash). The first photograph serves as the primary card cover.
        </p>

        {fields.map((f, i) => (
          <Row key={f.id} className="gy-2 align-items-center mb-3 p-2 bg-light rounded-3">
            <Col md={6}>
              <FormField
                label={`Photo ${i + 1} URL`}
                type="url"
                className="mb-0"
                error={errors.images?.[i]?.url?.message}
                {...register(`images.${i}.url`, { required: i === 0 ? 'Primary photo is required' : false })}
              />
            </Col>
            <Col md={5}>
              <FormField
                label="Alt Text / Caption"
                className="mb-0"
                error={errors.images?.[i]?.alt?.message}
                {...register(`images.${i}.alt`, { required: i === 0 ? 'Alt text is required' : false })}
              />
            </Col>
            <Col md={1} className="d-flex justify-content-center pt-md-3">
              <Button
                type="button"
                variant="outline-danger"
                size="sm"
                onClick={() => remove(i)}
                disabled={fields.length === 1}
                aria-label={`Remove photo ${i + 1}`}
                className="border-0 p-1"
              >
                <Trash2 size={16} />
              </Button>
            </Col>
          </Row>
        ))}
        {errors.images?.message && <p className="text-danger small mt-1">{errors.images.message}</p>}
      </Card>

      {/* Amenities */}
      <Card className="p-4 border shadow-sm bg-white" aria-label="Amenities">
        <h3 className="font-serif fs-5 mb-3 text-dark">Property Amenities</h3>
        <Row className="gy-2">
          {AMENITIES.map((a) => (
            <Col md={4} sm={6} key={a}>
              <Form.Check
                type="checkbox"
                id={`amenity-${a}`}
                label={a}
                value={a}
                className="small"
                {...register('amenities')}
              />
            </Col>
          ))}
        </Row>
      </Card>

      {/* Policies & Settings */}
      <Card className="p-4 border shadow-sm bg-white" aria-label="Policies">
        <h3 className="font-serif fs-5 mb-3 text-dark">Policies & Visibility</h3>
        <Row className="gy-3">
          <Col md={6}>
            <FormField label="Standard Check-in Time" type="time" {...register('checkInTime')} />
          </Col>
          <Col md={6}>
            <FormField label="Standard Check-out Time" type="time" {...register('checkOutTime')} />
          </Col>
          <Col md={6}>
            <FormField label="Free Cancellation (Hours before Check-in)" type="number" min="0" {...register('freeCancellationHours')} />
          </Col>
          <Col md={6}>
            <FormField label="Cancellation Policy Description" {...register('cancellation')} />
          </Col>
          <Col md={12}>
            <FormField as="textarea" rows={2} label="House Rules" {...register('houseRules')} />
          </Col>
          <Col md={6}>
            <Form.Check
              type="checkbox"
              id="hotel-featured"
              label="Feature this property on the home page hero"
              className="small fw-medium"
              {...register('featured')}
            />
          </Col>
          <Col md={6}>
            <Form.Check
              type="checkbox"
              id="hotel-active"
              label="Active (visible and searchable by guests)"
              className="small fw-medium"
              {...register('isActive')}
            />
          </Col>
        </Row>
      </Card>

      <div className="d-flex justify-content-end gap-2 pb-5">
        <Button as={Link} to="/admin/hotels" variant="secondary" className="btn-secondary">
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Saving...' : editing ? 'Update Property' : 'Save Property'}
        </Button>
      </div>
    </Form>
  );
}
