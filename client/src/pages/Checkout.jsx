import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import BookingSummary from '../components/BookingSummary.jsx';
import FormField from '../components/FormField.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { PageSkeleton } from '../components/Skeletons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { bookingApi, getErrorMessage, hotelApi } from '../services/api.js';

export default function Checkout() {
  useDocumentTitle('Checkout');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');
  // One key per checkout visit: double-clicks and retries can never create two bookings
  const idempotencyKey = useRef(
    crypto.randomUUID
      ? crypto.randomUUID()
      : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  const q = useMemo(() => ({
    hotel: params.get('hotel'),
    roomTypeId: params.get('room'),
    checkIn: params.get('checkIn'),
    checkOut: params.get('checkOut'),
    rooms: Number(params.get('rooms')) || 1,
    guests: Number(params.get('guests')) || 1,
  }), [params]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      specialRequests: '',
      accept: false,
    },
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const detail = await hotelApi.detail(q.hotel);
        const res = await bookingApi.quote({
          hotelId: detail.hotel._id,
          roomTypeId: q.roomTypeId,
          checkIn: q.checkIn,
          checkOut: q.checkOut,
          rooms: q.rooms,
          guests: q.guests,
        });
        if (active) setQuote({ ...res.quote, hotelId: detail.hotel._id });
      } catch (e) {
        if (active) setError(getErrorMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [q]);

  const onSubmit = async (v) => {
    setServerError('');
    try {
      const res = await bookingApi.create({
        hotelId: quote.hotelId,
        roomTypeId: q.roomTypeId,
        checkIn: q.checkIn,
        checkOut: q.checkOut,
        rooms: q.rooms,
        guests: q.guests,
        guestDetails: { fullName: v.fullName, email: v.email, phone: v.phone, specialRequests: v.specialRequests },
        idempotencyKey: idempotencyKey.current,
        acceptDemoPayment: true,
      });
      toast.success('Your stay is booked.');
      navigate(`/bookings/${res.booking._id}/confirmation`, { replace: true });
    } catch (e) {
      setServerError(getErrorMessage(e));
    }
  };

  if (loading) return <PageSkeleton />;
  if (error) return (
    <div className="container-page py-5">
      <ErrorState message={error} />
      <div className="mt-4 text-center">
        <Link to={`/stays/${q.hotel}`} className="btn btn-secondary">Back to the property</Link>
      </div>
    </div>
  );

  return (
    <div className="container-page py-4 py-md-5">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-3 font-serif fs-1">Confirm your stay</h1>

      <Row className="mt-4 g-5 align-items-start">
        {/* Guest details form */}
        <Col lg={8}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="card p-4 p-md-5">
            <h2 className="font-serif fs-4 mb-4">Guest details</h2>

            {serverError && (
              <Alert variant="danger" role="alert" className="py-2 px-3 small mb-4">
                {serverError}
              </Alert>
            )}

            <Row className="g-4">
              <Col xs={12}>
                <FormField
                  label="Full name"
                  error={errors.fullName?.message}
                  {...register('fullName', {
                    required: 'Guest name is required',
                    minLength: { value: 2, message: 'Enter the guest name' },
                  })}
                />
              </Col>
              <Col sm={6}>
                <FormField
                  label="Email"
                  type="email"
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
                  })}
                />
              </Col>
              <Col sm={6}>
                <FormField
                  label="Phone (optional)"
                  type="tel"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </Col>
              <Col xs={12}>
                <FormField
                  as="textarea"
                  rows={3}
                  label="Special requests (optional)"
                  error={errors.specialRequests?.message}
                  {...register('specialRequests', { maxLength: { value: 500, message: 'Please keep this under 500 characters' } })}
                />
              </Col>
            </Row>

            {/* Demo payment notice */}
            <div className="rounded-3 border p-4 mt-4" style={{ borderColor: 'rgba(82,99,78,0.25)', background: 'rgba(220,231,221,0.4)' }}>
              <h3 className="font-serif fs-5 mb-2">Payment: demo mode</h3>
              <p className="small text-muted mb-3">
                This project does not process real money, so no card details are requested. Confirming records your booking only.
              </p>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="accept"
                  {...register('accept', { required: 'Please acknowledge the demo checkout to continue' })}
                />
                <label className="form-check-label small" htmlFor="accept">
                  I understand this is a demo booking and no payment will be taken.
                </label>
              </div>
              {errors.accept && (
                <p role="alert" className="small text-danger mt-1 mb-0">{errors.accept.message}</p>
              )}
            </div>

            <p className="small text-muted mt-3">Cancellation: {quote.policies.cancellation}</p>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary mt-2"
            >
              {isSubmitting ? 'Confirming…' : 'Confirm booking'}
            </Button>
          </form>
        </Col>

        {/* Booking summary sidebar */}
        <Col lg={4}>
          <BookingSummary
            hotelName={quote.hotel.name}
            city={quote.hotel.city}
            image={quote.hotel.image}
            roomName={quote.roomType.name}
            checkIn={quote.checkIn}
            checkOut={quote.checkOut}
            nights={quote.nights}
            rooms={quote.rooms}
            guests={quote.guests}
            pricing={quote.pricing}
          />
        </Col>
      </Row>
    </div>
  );
}
