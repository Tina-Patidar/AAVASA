import Card from 'react-bootstrap/Card';
import { SearchX } from 'lucide-react';

export default function EmptyState({ icon: Icon = SearchX, title, message, action }) {
  return (
    <Card className="text-center p-5 border-dashed bg-white">
      <Card.Body className="d-flex flex-column align-items-center">
        <span
          className="mb-3 rounded-circle bg-sage text-forest d-inline-flex align-items-center justify-content-center"
          style={{ width: '48px', height: '48px' }}
        >
          <Icon size={24} aria-hidden="true" />
        </span>
        <h4 className="font-serif mb-2">{title}</h4>
        {message && <p className="text-muted small mb-4" style={{ maxWidth: '420px' }}>{message}</p>}
        {action && <div>{action}</div>}
      </Card.Body>
    </Card>
  );
}
