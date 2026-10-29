import { Star } from 'lucide-react';

/** Shows a rating only when real or clearly-labelled demo data exists. */
export default function Rating({ value, count, isDemo = false, className = '' }) {
  if (!value || value <= 0) {
    return <span className={`small text-muted ${className}`}>New on AAVASA</span>;
  }
  return (
    <span className={`d-inline-flex align-items-center gap-1 small ${className}`}>
      <Star size={14} className="fill-peach text-peach" style={{ fill: '#D8B4A0', color: '#D8B4A0' }} aria-hidden="true" />
      <span className="fw-bold">{value.toFixed(1)}</span>
      {count > 0 && <span className="text-muted">({count})</span>}
      {isDemo && (
        <span className="ms-1 badge bg-sand text-dark fw-normal" style={{ fontSize: '0.65rem' }}>
          Demo rating
        </span>
      )}
    </span>
  );
}
