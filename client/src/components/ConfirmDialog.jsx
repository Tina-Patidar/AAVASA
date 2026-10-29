import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

/** Accessible modal confirmation built with React-Bootstrap Modal. */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Keep it',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
  children,
}) {
  return (
    <Modal
      show={open}
      onHide={busy ? undefined : onCancel}
      centered
      backdrop="static"
      keyboard={!busy}
    >
      <Modal.Header closeButton={!busy} className="border-bottom-0 pb-0">
        <Modal.Title as="h4" className="font-serif">
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-3">
        {message && <p className="text-muted mb-3">{message}</p>}
        {children}
      </Modal.Body>
      <Modal.Footer className="border-top-0 pt-0 gap-2">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={busy}
          className="btn-secondary"
        >
          {cancelLabel}
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={onConfirm}
          disabled={busy}
          className={danger ? 'btn-danger' : 'btn-primary'}
        >
          {busy ? 'Please wait...' : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
