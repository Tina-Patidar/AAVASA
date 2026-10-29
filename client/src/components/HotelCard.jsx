import { Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import { MapPin, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import SmartImage from './SmartImage.jsx';
import Rating from './Rating.jsx';
import { formatINR } from '../utils/format.js';

export default function HotelCard({ hotel, variant = 'default', search = '' }) {
  const price = hotel.fromPrice ?? hotel.startingPrice;
  const image = hotel.images?.[0];
  const to = `/stays/${hotel.slug}${search ? `?${search}` : ''}`;
  const tall = variant === 'feature';

  return (
    <Card className="card-hover h-100 overflow-hidden d-flex flex-column border">
      <Link to={to} className="position-relative d-block overflow-hidden text-decoration-none" aria-label={`View ${hotel.name}`}>
        <div style={{ height: tall ? '320px' : '230px', overflow: 'hidden' }}>
          <SmartImage
            src={image?.url}
            alt={image?.alt || `${hotel.name} in ${hotel.city}`}
            width={tall ? 900 : 700}
            className="w-100 h-100 object-fit-cover"
          />
        </div>
        <Badge
          bg=""
          className="position-absolute top-0 start-0 m-3 px-3 py-1 bg-ivory text-forest fw-semibold text-uppercase shadow-sm"
          style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}
        >
          {hotel.propertyType}
        </Badge>
        {hotel.availability?.checked && hotel.availability.available && (
          <Badge
            bg=""
            className="position-absolute bottom-0 start-0 m-3 d-inline-flex align-items-center gap-1 bg-forest text-white px-3 py-1 fw-normal"
            style={{ fontSize: '0.75rem' }}
          >
            <CheckCircle2 size={13} aria-hidden="true" /> Rooms free for your dates
          </Badge>
        )}
      </Link>

      <Card.Body className="d-flex flex-column p-4 flex-grow-1">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <span className="small text-muted d-flex align-items-center gap-1">
            <MapPin size={13} aria-hidden="true" />
            {hotel.city}
            {hotel.state ? `, ${hotel.state}` : ''}
          </span>
          <Rating value={hotel.rating} count={hotel.reviewCount} isDemo={hotel.ratingIsDemo} />
        </div>

        <Card.Title as="h3" className="font-serif fs-5 mb-1 text-dark">
          {hotel.name}
        </Card.Title>

        {hotel.tagline && (
          <Card.Text className="small text-muted mb-3" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {hotel.tagline}
          </Card.Text>
        )}

        <div className="d-flex flex-wrap gap-1 mb-4" aria-label="Key amenities">
          {(hotel.amenities || []).slice(0, 3).map((a) => (
            <span key={a} className="chip">
              {a}
            </span>
          ))}
          {hotel.amenities?.length > 3 && (
            <span className="chip">+{hotel.amenities.length - 3}</span>
          )}
        </div>

        <div className="mt-auto d-flex justify-content-between align-items-end pt-3 border-top">
          <div>
            <div className="text-muted text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
              From
            </div>
            <div className="font-serif fs-5 text-dark fw-bold">
              {formatINR(price)} <span className="small fw-normal text-muted font-sans" style={{ fontSize: '0.75rem' }}>/ night</span>
            </div>
          </div>
          <Link to={to} className="btn btn-outline-primary btn-sm rounded-pill text-decoration-none">
            View stay <ArrowUpRight size={14} className="ms-1" aria-hidden="true" />
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
}
