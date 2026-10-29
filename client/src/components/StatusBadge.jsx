import Badge from 'react-bootstrap/Badge';

const statusLabels = {
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  completed: 'Completed',
  pending: 'Pending',
  cancelled: 'Cancelled',
  active: 'Active',
  inactive: 'Inactive',
};

export default function StatusBadge({ status }) {
  const normalized = status ? String(status).toLowerCase() : 'pending';
  const label = statusLabels[normalized] || normalized.replace('_', ' ');

  return (
    <Badge
      bg=""
      className={`badge-status badge-${normalized}`}
    >
      {label}
    </Badge>
  );
}
