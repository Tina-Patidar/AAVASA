import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <Alert variant="danger" className="text-center p-4 rounded-3 d-flex flex-column align-items-center">
      <AlertTriangle size={32} className="text-danger mb-2" aria-hidden="true" />
      <h4 className="font-serif text-dark mb-2">We could not load this</h4>
      <p className="small text-muted mb-3" style={{ maxWidth: '420px' }}>{message}</p>
      {onRetry && (
        <Button variant="outline-secondary" onClick={onRetry} className="btn-sm d-inline-flex align-items-center gap-2">
          <RefreshCw size={14} /> Try again
        </Button>
      )}
    </Alert>
  );
}
