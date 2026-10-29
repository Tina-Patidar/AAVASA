import { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';
import InputGroup from 'react-bootstrap/InputGroup';

const STARS = [
  { value: '', label: 'Any' },
  { value: '3', label: '3 stars & up' },
  { value: '4', label: '4 stars & up' },
  { value: '5', label: '5 stars' },
];

function Group({ title, children }) {
  return (
    <div className="border-bottom py-3">
      <h6 className="eyebrow mb-2">{title}</h6>
      {children}
    </div>
  );
}

/**
 * Filter controls. `filters` holds the current query values (strings or arrays).
 * Every change calls onChange(partial) which the Explore page writes into the URL.
 */
export default function FilterPanel({ filters, meta, onChange, onClear, activeCount = 0 }) {
  const [price, setPrice] = useState({ min: filters.minPrice || '', max: filters.maxPrice || '' });
  useEffect(() => {
    setPrice({ min: filters.minPrice || '', max: filters.maxPrice || '' });
  }, [filters.minPrice, filters.maxPrice]);

  const toggle = (key, value) => {
    const current = filters[key] || [];
    onChange({ [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] });
  };

  const applyPrice = () => {
    let { min, max } = price;
    if (min !== '' && max !== '' && Number(min) > Number(max)) [min, max] = [max, min];
    onChange({ minPrice: min, maxPrice: max });
  };

  return (
    <div className="filter-panel">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="font-serif mb-0 fs-5">Filters</h4>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="btn btn-link p-0 text-decoration-underline text-forest small"
            style={{ fontSize: '0.85rem' }}
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <Group title="Nightly price (INR)">
        <div className="d-flex align-items-center gap-2">
          <Form.Control
            type="number"
            min="0"
            size="sm"
            placeholder={meta?.priceRange?.min ? String(meta.priceRange.min) : 'Min'}
            value={price.min}
            onChange={(e) => setPrice((p) => ({ ...p, min: e.target.value }))}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            aria-label="Minimum price"
          />
          <span className="text-muted">-</span>
          <Form.Control
            type="number"
            min="0"
            size="sm"
            placeholder={meta?.priceRange?.max ? String(meta.priceRange.max) : 'Max'}
            value={price.max}
            onChange={(e) => setPrice((p) => ({ ...p, max: e.target.value }))}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            aria-label="Maximum price"
          />
        </div>
      </Group>

      <Group title="Property type">
        <div className="d-flex flex-column gap-2">
          {(meta?.propertyTypes || []).map((t) => (
            <Form.Check
              key={t}
              type="checkbox"
              id={`filter-type-${t}`}
              label={t}
              checked={(filters.propertyType || []).includes(t)}
              onChange={() => toggle('propertyType', t)}
              className="small"
            />
          ))}
        </div>
      </Group>

      <Group title="Star category">
        <div className="d-flex flex-column gap-2">
          {STARS.map((s) => (
            <Form.Check
              key={s.value}
              type="radio"
              name="stars"
              id={`filter-star-${s.value || 'any'}`}
              label={s.label}
              checked={(filters.stars || '') === s.value}
              onChange={() => onChange({ stars: s.value })}
              className="small"
            />
          ))}
        </div>
      </Group>

      <Group title="Amenities">
        <div className="d-flex flex-column gap-2">
          {(meta?.amenities || []).map((a) => (
            <Form.Check
              key={a}
              type="checkbox"
              id={`filter-amenity-${a}`}
              label={a}
              checked={(filters.amenities || []).includes(a)}
              onChange={() => toggle('amenities', a)}
              className="small"
            />
          ))}
        </div>
      </Group>
    </div>
  );
}

/** Offcanvas slide-in drawer for small screens using React-Bootstrap Offcanvas */
export function FilterDrawer({ open, onClose, children, resultCount }) {
  return (
    <Offcanvas
      show={open}
      onHide={onClose}
      placement="end"
      className="d-lg-none"
      aria-label="Filters drawer"
    >
      <Offcanvas.Header closeButton className="border-bottom">
        <Offcanvas.Title as="h5" className="font-serif">
          Refine your stay
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="p-4 d-flex flex-column justify-content-between">
        <div className="overflow-y-auto mb-4">{children}</div>
        <div className="pt-3 border-top">
          <Button
            variant="primary"
            onClick={onClose}
            className="w-100 btn-primary"
          >
            Show {resultCount ?? ''} {resultCount === 1 ? 'stay' : 'stays'}
          </Button>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
}
