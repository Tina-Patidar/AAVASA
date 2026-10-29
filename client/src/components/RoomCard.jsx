import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Check, Maximize2, Users } from 'lucide-react';
import SmartImage from './SmartImage.jsx';
import { formatINR } from '../utils/format.js';

export default function RoomCard({ room, image, selected, onSelect, rooms = 1, datesSelected = false }) {
  const av = room.availability;
  const unavailable = datesSelected && av?.checked && !av.available;
  const fitsGuests = room.fitsGuests !== false;
  const disabled = unavailable || !fitsGuests;

  let statusText = 'Select dates to check availability';
  let statusColor = 'text-muted';
  if (!fitsGuests) {
    statusText = `Too small for your group (sleeps ${room.maxGuests} per room)`;
    statusColor = 'text-danger';
  } else if (av?.checked) {
    if (av.available) {
      statusText = av.availableRooms <= 3 ? `Only ${av.availableRooms} left for your dates` : 'Available for your dates';
      statusColor = 'text-forest';
    } else {
      statusText = av.availableRooms === 0 ? 'Sold out for your dates' : `Only ${av.availableRooms} left, you asked for ${rooms}`;
      statusColor = 'text-danger';
    }
  }

  return (
    <Card className={`overflow-hidden mb-3 border ${selected ? 'border-2 border-forest shadow-sm' : ''} ${disabled ? 'opacity-75' : ''}`}>
      <Row className="g-0">
        {image && (
          <Col md={4} sm={12} className="position-relative">
            <div style={{ height: '100%', minHeight: '180px', overflow: 'hidden' }}>
              <SmartImage
                src={room.images?.[0]?.url || image.url}
                alt={room.images?.[0]?.alt || `${room.name} room`}
                width={500}
                className="w-100 h-100 object-fit-cover"
              />
            </div>
          </Col>
        )}
        <Col md={image ? 8 : 12}>
          <Card.Body className="d-flex flex-column h-100 p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
              <Card.Title as="h4" className="font-serif fs-5 mb-0 text-dark">
                {room.name}
              </Card.Title>
              <div className="text-end">
                <span className="font-serif fs-5 text-dark fw-bold">{formatINR(room.pricePerNight)}</span>
                <span className="d-block small text-muted" style={{ fontSize: '0.72rem' }}>
                  per night, per room
                </span>
              </div>
            </div>

            {room.description && <Card.Text className="small text-muted mb-2">{room.description}</Card.Text>}

            <div className="d-flex flex-wrap gap-3 small text-muted mb-3">
              <span className="d-inline-flex align-items-center gap-1">
                <Users size={14} aria-hidden="true" /> Up to {room.maxGuests} guests
              </span>
              {room.sizeSqFt && (
                <span className="d-inline-flex align-items-center gap-1">
                  <Maximize2 size={14} aria-hidden="true" /> {room.sizeSqFt} sq ft
                </span>
              )}
            </div>

            <div className="d-flex flex-wrap gap-1 mb-3">
              {(room.amenities || []).map((a) => (
                <span key={a} className="chip">
                  {a}
                </span>
              ))}
            </div>

            <div className="mt-auto d-flex flex-wrap justify-content-between align-items-center gap-2 pt-2 border-top">
              <span className={`small fw-medium ${statusColor}`} aria-live="polite">
                {statusText}
              </span>
              <Button
                type="button"
                variant={selected ? 'primary' : 'outline-primary'}
                size="sm"
                disabled={disabled}
                onClick={() => onSelect(room)}
                aria-pressed={selected}
                className={`btn-sm ${selected ? 'btn-primary' : 'btn-secondary'}`}
              >
                {selected ? (
                  <>
                    <Check size={14} className="me-1" aria-hidden="true" /> Selected
                  </>
                ) : (
                  'Select room'
                )}
              </Button>
            </div>
          </Card.Body>
        </Col>
      </Row>
    </Card>
  );
}
