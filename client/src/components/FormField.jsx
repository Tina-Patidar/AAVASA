import { forwardRef, useId } from 'react';
import Form from 'react-bootstrap/Form';

/** Label + input + error, wired together for screen readers. Works with react-hook-form's register(). */
const FormField = forwardRef(function FormField(
  { label, error, hint, as = 'input', className = '', children, ...props },
  ref
) {
  const id = useId();
  const isSelect = as === 'select';

  return (
    <Form.Group className={`mb-3 ${className}`}>
      {label && (
        <Form.Label htmlFor={id} className="form-label">
          {label}
        </Form.Label>
      )}
      {isSelect ? (
        <Form.Select
          id={id}
          ref={ref}
          isInvalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        >
          {children}
        </Form.Select>
      ) : (
        <Form.Control
          as={as}
          id={id}
          ref={ref}
          isInvalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        >
          {children}
        </Form.Control>
      )}
      {hint && !error && (
        <Form.Text id={`${id}-hint`} className="text-muted small">
          {hint}
        </Form.Text>
      )}
      {error && (
        <Form.Control.Feedback id={`${id}-error`} type="invalid" role="alert" className="d-block small text-danger mt-1">
          {error}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
});

export default FormField;
