import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import { Clock, ExternalLink, MapPin, ShieldCheck, Star } from 'lucide-react';
import Gallery from '../components/Gallery.jsx';
import RoomCard from '../components/RoomCard.jsx';
import Rating from '../components/Rating.jsx';
import HotelCard from '../components/HotelCard.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { PageSkeleton } from '../components/Skeletons.jsx';
import { PriceBreakdown } from '../components/BookingSummary.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { bookingApi, getErrorMessage, hotelApi } from '../services/api.js';
import { dayFromToday, formatDate, formatINR, nightsBetween, plural, validateStayInputs } from '../utils/format.js';

export default function HotelDetails() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const stay = {
    checkIn: params.get('checkIn') || '',
    checkOut: params.get('checkOut') || '',
    guests: Number(params.get('guests')) || 2,
    rooms: Number(params.get('rooms')) || 1,
  };
  const stayError = validateStayInputs(stay);
  const datesGiven = Boolean(stay.checkIn && stay.checkOut) && !stayError;
  const apiQuery = datesGiven ? stay : { guests: stay.guests, rooms: stay.rooms };

  const { data, loading, error, reload } = useFetch(
    () => hotelApi.detail(slug, apiQuery),
    [slug, datesGiven, stay.checkIn, stay.checkOut, stay.guests, stay.rooms]
  );
  useDocumentTitle(data?.hotel?.name ? `${data.hotel.name} | AAVASA` : 'Stay Details');

  const [roomId, setRoomId] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoting, setQuoting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Real-Time Availability: re-poll room availability every 30s while the browser tab is visible
  useEffect(() => {
    let intervalId;

    const pollAvailability = () => {
      if (document.visibilityState === 'visible') {
        reload();
        setLastUpdated(new Date());
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        pollAvailability();
      }
    };

    intervalId = setInterval(pollAvailability, 30000);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [slug, datesGiven, reload]);

  const setStay = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === '' || v == null) next.delete(k);
      else next.set(k, String(v));
    }
    setParams(next, { replace: true });
  };

  const rooms = data?.rooms || [];
  const room = rooms.find((r) => r._id === roomId);

  // Live price quote calculation
  useEffect(() => {
    setQuote(null);
    setQuoteError('');
    if (!user || !room || !datesGiven || !data) return undefined;
    let active = true;
    setQuoting(true);
    bookingApi
      .quote({
        hotelId: data.hotel._id,
        roomTypeId: room._id,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        rooms: stay.rooms,
        guests: stay.guests,
      })
      .then((r) => active && setQuote(r.quote))
      .catch((e) => active && setQuoteError(getErrorMessage(e)))
      .finally(() => active && setQuoting(false));

    return () => {
      active = false;
    };
  }, [user, roomId, datesGiven, stay.checkIn, stay.checkOut, stay.guests, stay.rooms, data?.hotel?._id]);

  const mapUrl = useMemo(() => {
    const h = data?.hotel;
    if (!h) return '';
    return h.location?.lat != null
      ? `https://www.google.com/maps/search/?api=1&query=${h.location.lat},${h.location.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h.name} ${h.city}`)}`;
  }, [data]);

  if (loading && !data) return <PageSkeleton />;
  if (error) {
    return (
      <Container fluid="xl" className="py-5">
        <ErrorState message={error} onRetry={reload} />
      </Container>
    );
  }

  const { hotel, reviews, reviewsAreSample, similar } = data;

  const goCheckout = () => {
    const p = new URLSearchParams({
      hotel: hotel.slug,
      room: room._id,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      rooms: stay.rooms,
      guests: stay.guests,
    });
    if (!user) {
      return navigate('/login', { state: { from: `/stays/${hotel.slug}?${params.toString()}` } });
    }
    navigate(`/checkout?${p.toString()}`);
  };

  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const canBook = datesGiven && room && room.availability?.available;
  const similarSearch = ['checkIn', 'checkOut', 'guests', 'rooms']
    .filter((k) => params.get(k))
    .map((k) => `${k}=${params.get(k)}`)
    .join('&');

  const bookingPanel = (
    <Card className="p-4 border shadow-sm sticky-top bg-white" style={{ top: '90px' }} id="booking-panel">
      <div className="small text-muted text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
        Starting From
      </div>
      <div className="font-serif fs-3 fw-bold text-dark mb-3">
        {formatINR(hotel.startingPrice)}{' '}
        <span className="small fw-normal text-muted font-sans" style={{ fontSize: '0.85rem' }}>
          / night
        </span>
      </div>

      <Row className="g-2 mb-3">
        <Col xs={6}>
          <Form.Group controlId="bp-in">
            <Form.Label className="form-label text-forest small">Check-in</Form.Label>
            <Form.Control
              type="date"
              size="sm"
              min={dayFromToday(0)}
              value={stay.checkIn}
              onChange={(e) =>
                setStay({
                  checkIn: e.target.value,
                  ...(stay.checkOut && stay.checkOut <= e.target.value ? { checkOut: '' } : {}),
                })
              }
            />
          </Form.Group>
        </Col>
        <Col xs={6}>
          <Form.Group controlId="bp-out">
            <Form.Label className="form-label text-forest small">Check-out</Form.Label>
            <Form.Control
              type="date"
              size="sm"
              min={stay.checkIn || dayFromToday(1)}
              value={stay.checkOut}
              onChange={(e) => setStay({ checkOut: e.target.value })}
            />
          </Form.Group>
        </Col>
        <Col xs={6}>
          <Form.Group controlId="bp-guests">
            <Form.Label className="form-label text-forest small">Guests</Form.Label>
            <Form.Control
              type="number"
              size="sm"
              min="1"
              max="40"
              value={stay.guests}
              onChange={(e) => setStay({ guests: e.target.value })}
            />
          </Form.Group>
        </Col>
        <Col xs={6}>
          <Form.Group controlId="bp-rooms">
            <Form.Label className="form-label text-forest small">Rooms</Form.Label>
            <Form.Control
              type="number"
              size="sm"
              min="1"
              max="10"
              value={stay.rooms}
              onChange={(e) => setStay({ rooms: e.target.value })}
            />
          </Form.Group>
        </Col>
      </Row>

      {stayError && (
        <div className="text-danger small mb-3" role="alert">
          {stayError}
        </div>
      )}

      <div className="border-top pt-3 my-2 small" aria-live="polite">
        {!datesGiven ? (
          <p className="text-muted mb-0">Choose your dates, then select a room below to see the full price.</p>
        ) : !room ? (
          <p className="text-muted mb-0">Select a room type below to continue.</p>
        ) : !user ? (
          <p className="text-muted mb-0">
            {room.name} · {plural(nights, 'night')}. Sign in to see the exact total and book.
          </p>
        ) : quoting ? (
          <p className="text-muted mb-0">Calculating exact price breakdown...</p>
        ) : quoteError ? (
          <p className="text-danger mb-0" role="alert">
            {quoteError}
          </p>
        ) : quote ? (
          <div>
            <div className="fw-semibold text-dark mb-1">{room.name}</div>
            <PriceBreakdown pricing={quote.pricing} />
          </div>
        ) : null}
      </div>

      <Button
        variant="primary"
        className="w-100 btn-primary py-2 mt-3"
        onClick={goCheckout}
        disabled={!canBook || (user && (quoting || Boolean(quoteError)))}
      >
        {user ? 'Reserve (Demo Checkout)' : 'Sign In to Book'}
      </Button>

      <div className="d-flex align-items-center gap-2 small text-muted mt-3" style={{ fontSize: '0.78rem' }}>
        <ShieldCheck size={16} className="text-forest flex-shrink-0" />
        <span>No payment is taken. AAVASA runs in demo mode.</span>
      </div>
    </Card>
  );

  return (
    <Container fluid="xl" className="py-4 py-md-5">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="small text-muted mb-3">
        <Link to="/explore" className="text-forest text-decoration-none">
          Explore stays
        </Link>{' '}
        / <span className="text-dark">{hotel.name}</span>
      </nav>

      {/* Title & Rating */}
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <span className="eyebrow">
            {hotel.propertyType} · {'★'.repeat(hotel.starCategory)}
          </span>
          <h1 className="font-serif fs-1 mt-1 mb-2 text-dark">{hotel.name}</h1>
          <p className="small text-muted d-flex align-items-center gap-1 mb-0">
            <MapPin size={16} className="text-forest" aria-hidden="true" />
            {hotel.city}, {hotel.state}
          </p>
        </div>
        <Rating value={hotel.rating} count={hotel.reviewCount} isDemo={hotel.ratingIsDemo} />
      </div>

      {/* Gallery */}
      <Gallery images={hotel.images} name={hotel.name} />

      <Row className="gy-5 mt-2">
        <Col lg={8}>
          {/* About */}
          <section aria-labelledby="about" className="mb-5">
            <h2 id="about" className="font-serif fs-3 mb-2">
              About this stay
            </h2>
            {hotel.tagline && <p className="fst-italic text-forest mb-3">{hotel.tagline}</p>}
            <p className="text-dark" style={{ lineHeight: '1.7' }}>
              {hotel.description}
            </p>

            <h3 className="eyebrow mt-4 mb-2">Key Amenities</h3>
            <div className="d-flex flex-wrap gap-2">
              {hotel.amenities.map((a) => (
                <span key={a} className="chip">
                  {a}
                </span>
              ))}
            </div>
          </section>

          {/* Rooms Section with Live Availability Indicator */}
          <section aria-labelledby="rooms" className="mb-5">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div>
                <h2 id="rooms" className="font-serif fs-3 mb-1">
                  Rooms & Suites
                </h2>
                <p className="small text-muted mb-0">
                  {datesGiven
                    ? `Availability for ${formatDate(stay.checkIn)} to ${formatDate(stay.checkOut)}`
                    : 'Pick dates in the booking panel to check live availability.'}
                </p>
              </div>

              {/* Lightweight Live Availability experience (Course Spec Requirement) */}
              <div
                className="d-inline-flex align-items-center gap-2 small text-muted bg-white border rounded-pill px-3 py-1 shadow-sm"
                title="Auto-refreshes every 30 seconds while this tab is active"
              >
                <span className="pulse-indicator" aria-hidden="true" />
                <span style={{ fontSize: '0.78rem' }}>Live availability · Updated just now</span>
              </div>
            </div>

            <div className="d-flex flex-column gap-3">
              {rooms.length === 0 && (
                <p className="text-muted small">No rooms are currently listed for this property.</p>
              )}
              {rooms.map((r) => (
                <RoomCard
                  key={r._id}
                  room={r}
                  image={hotel.images[0]}
                  selected={roomId === r._id}
                  rooms={stay.rooms}
                  datesSelected={datesGiven}
                  onSelect={(x) => {
                    setRoomId(x._id);
                    document.getElementById('booking-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                />
              ))}
            </div>
          </section>

          {/* Policies & Location */}
          <section aria-labelledby="policies" className="mb-5">
            <h2 id="policies" className="font-serif fs-3 mb-3">
              Policies and Location
            </h2>
            <Row className="gy-3 small">
              <Col sm={6}>
                <div className="p-3 bg-white border rounded-3 h-100">
                  <div className="fw-semibold text-dark d-flex align-items-center gap-2 mb-1">
                    <Clock size={16} className="text-forest" /> Check-in & Check-out
                  </div>
                  <div className="text-muted">
                    Check-in from {hotel.policies?.checkInTime || '14:00'}. Check-out by{' '}
                    {hotel.policies?.checkOutTime || '11:00'}.
                  </div>
                </div>
              </Col>
              <Col sm={6}>
                <div className="p-3 bg-white border rounded-3 h-100">
                  <div className="fw-semibold text-dark mb-1">Cancellation Policy</div>
                  <div className="text-muted">{hotel.policies?.cancellation || 'Flexible cancellation.'}</div>
                </div>
              </Col>
              <Col sm={6}>
                <div className="p-3 bg-white border rounded-3 h-100">
                  <div className="fw-semibold text-dark mb-1">House Rules</div>
                  <div className="text-muted">{hotel.policies?.houseRules || 'Standard hotel conduct.'}</div>
                </div>
              </Col>
              <Col sm={6}>
                <div className="p-3 bg-white border rounded-3 h-100">
                  <div className="fw-semibold text-dark mb-1">Address</div>
                  <div className="text-muted">
                    {hotel.address}
                    <div className="mt-1">
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-forest text-decoration-underline d-inline-flex align-items-center gap-1"
                      >
                        View on Google Maps <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </section>

          {/* Guest Reviews */}
          <section aria-labelledby="reviews" className="mb-5">
            <h2 id="reviews" className="font-serif fs-3 mb-2">
              Guest Reviews
            </h2>
            {reviewsAreSample && (
              <Badge bg="secondary" className="bg-sand text-dark fw-normal mb-3">
                Sample reviews for demonstration. Real guest reviews replace these once guests complete stays.
              </Badge>
            )}
            {reviews.length === 0 ? (
              <p className="text-muted small">No reviews recorded yet.</p>
            ) : (
              <Row className="gy-3">
                {reviews.map((r, i) => (
                  <Col md={6} key={r.id || i}>
                    <Card className="p-4 border shadow-sm h-100 bg-white">
                      <div className="d-flex align-items-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star
                            key={s}
                            size={14}
                            className={s < r.rating ? 'fill-peach text-peach' : 'text-muted opacity-25'}
                            style={s < r.rating ? { fill: '#D8B4A0', color: '#D8B4A0' } : {}}
                          />
                        ))}
                      </div>
                      {r.title && <div className="fw-semibold text-dark mb-1">{r.title}</div>}
                      <p className="small text-muted mb-3 flex-grow-1">{r.comment}</p>
                      <div className="small text-muted fst-italic" style={{ fontSize: '0.78rem' }}>
                        {r.author}
                        {r.stay ? ` · ${r.stay}` : ''}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </section>
        </Col>

        {/* Right Sticky Booking Panel */}
        <Col lg={4}>
          <aside aria-label="Booking reservation panel">{bookingPanel}</aside>
        </Col>
      </Row>

      {/* Similar Stays */}
      {similar.length > 0 && (
        <section className="mt-5 pt-4 border-top" aria-labelledby="similar">
          <h2 id="similar" className="font-serif fs-3 mb-4">
            Similar Stays You May Like
          </h2>
          <Row className="gy-4">
            {similar.map((h) => (
              <Col md={4} sm={6} xs={12} key={h._id}>
                <HotelCard hotel={h} search={similarSearch} />
              </Col>
            ))}
          </Row>
        </section>
      )}
    </Container>
  );
}
