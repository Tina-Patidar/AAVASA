import { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { Calendar, MapPin, Search, Users, BedDouble } from 'lucide-react';
import { hotelApi } from '../services/api.js';
import { dayFromToday, validateStayInputs } from '../utils/format.js';

function nextDay(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function SearchForm({
  initial = {},
  onSubmit,
  variant = 'hero',
  submitLabel = 'Search stays',
}) {
  const [values, setValues] = useState({
    q: '',
    checkIn: '',
    checkOut: '',
    guests: 2,
    rooms: 1,
    ...initial,
  });
  const [error, setError] = useState('');
  const [cities, setCities] = useState([]);

  const initialKey = JSON.stringify(initial);
  useEffect(() => {
    setValues((v) => ({
      q: '',
      checkIn: '',
      checkOut: '',
      guests: 2,
      rooms: 1,
      ...JSON.parse(initialKey),
    }));
    setError('');
  }, [initialKey]);

  useEffect(() => {
    hotelApi
      .meta()
      .then((m) => setCities(m.cities || []))
      .catch(() => {});
  }, []);

  const set = (key) => (e) => {
    const value = e.target.value;
    setValues((v) => {
      const next = { ...v, [key]: value };
      if (key === 'checkIn' && next.checkOut && next.checkOut <= value) next.checkOut = '';
      return next;
    });
    setError('');
  };

  const submit = (e) => {
    e.preventDefault();
    const payload = { ...values, guests: Number(values.guests), rooms: Number(values.rooms) };
    const message = validateStayInputs(payload);
    if (message) {
      setError(message);
      return;
    }
    onSubmit(payload);
  };

  const today = dayFromToday(0);
  const minOut = values.checkIn
    ? dayFromToday(0) > values.checkIn
      ? today
      : nextDay(values.checkIn)
    : dayFromToday(1);
  const hero = variant === 'hero';

  return (
    <Form
      onSubmit={submit}
      noValidate
      aria-label="Search stays"
      className={`rounded-4 bg-white p-3 p-md-4 ${hero ? 'shadow' : 'border'}`}
    >
      <Row className="g-2 g-lg-3 align-items-end">
        {/* Destination */}
        <Col xs={12} md={6} lg={3}>
          <Form.Group controlId="search-destination">
            <Form.Label className="form-label d-flex align-items-center gap-1 text-forest">
              <MapPin size={14} /> Destination
            </Form.Label>
            <Form.Control
              type="text"
              list="aavasa-cities"
              value={values.q}
              onChange={set('q')}
              placeholder="City or property name"
              autoComplete="off"
            />
            <datalist id="aavasa-cities">
              {cities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Form.Group>
        </Col>

        {/* Check-in */}
        <Col xs={6} md={3} lg={2}>
          <Form.Group controlId="search-checkin">
            <Form.Label className="form-label d-flex align-items-center gap-1 text-forest">
              <Calendar size={14} /> Check-in
            </Form.Label>
            <Form.Control
              type="date"
              min={today}
              value={values.checkIn}
              onChange={set('checkIn')}
            />
          </Form.Group>
        </Col>

        {/* Check-out */}
        <Col xs={6} md={3} lg={2}>
          <Form.Group controlId="search-checkout">
            <Form.Label className="form-label d-flex align-items-center gap-1 text-forest">
              <Calendar size={14} /> Check-out
            </Form.Label>
            <Form.Control
              type="date"
              min={minOut}
              value={values.checkOut}
              onChange={set('checkOut')}
            />
          </Form.Group>
        </Col>

        {/* Guests */}
        <Col xs={6} md={3} lg={2}>
          <Form.Group controlId="search-guests">
            <Form.Label className="form-label d-flex align-items-center gap-1 text-forest">
              <Users size={14} /> Guests
            </Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="40"
              value={values.guests}
              onChange={set('guests')}
            />
          </Form.Group>
        </Col>

        {/* Rooms */}
        <Col xs={6} md={3} lg={1}>
          <Form.Group controlId="search-rooms">
            <Form.Label className="form-label d-flex align-items-center gap-1 text-forest">
              <BedDouble size={14} /> Rooms
            </Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="10"
              value={values.rooms}
              onChange={set('rooms')}
            />
          </Form.Group>
        </Col>

        {/* Submit Button */}
        <Col xs={12} lg={2} className="mt-3 mt-lg-0">
          <Button
            type="submit"
            variant="primary"
            className="w-100 btn-primary py-2 d-flex align-items-center justify-content-center gap-2"
            style={{ height: '42px' }}
          >
            <Search size={16} /> {submitLabel}
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mt-3 mb-0 py-2 px-3 small" role="alert">
          {error}
        </Alert>
      )}
    </Form>
  );
}
