import Pagination from 'react-bootstrap/Pagination';
import Button from 'react-bootstrap/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AppPagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-4 d-flex align-items-center justify-content-center gap-3">
      <Button
        variant="outline-secondary"
        size="sm"
        className="btn-sm d-inline-flex align-items-center gap-1"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft size={16} aria-hidden="true" /> Previous
      </Button>
      <span className="small text-muted" aria-live="polite">
        Page {page} of {pages}
      </span>
      <Button
        variant="outline-secondary"
        size="sm"
        className="btn-sm d-inline-flex align-items-center gap-1"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
      >
        Next <ChevronRight size={16} aria-hidden="true" />
      </Button>
    </nav>
  );
}
