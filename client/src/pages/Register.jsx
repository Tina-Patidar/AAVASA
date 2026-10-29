import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Logo from '../components/Logo.jsx';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage, getFieldErrors } from '../services/api.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function Register() {
  useDocumentTitle('Create account');
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ confirm: _confirm, ...values }) => {
    setServerError('');
    try {
      await signUp(values);
      toast.success('Your AAVASA account is ready.');
      navigate('/', { replace: true });
    } catch (e) {
      const fields = getFieldErrors(e);
      Object.entries(fields).forEach(([f, message]) => setError(f, { message }));
      setServerError(Object.keys(fields).length ? '' : getErrorMessage(e));
    }
  };

  return (
    <div className="container-page d-flex justify-content-center py-5">
      <div style={{ width: '100%', maxWidth: '448px' }}>
        <div className="mb-4 d-flex justify-content-center">
          <Logo variant="full" />
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="card p-4 p-md-5">
          <h1 className="font-serif fs-3 mb-4">Create your account</h1>

          {serverError && (
            <Alert variant="danger" role="alert" className="py-2 px-3 small">
              {serverError}
            </Alert>
          )}

          <div className="d-flex flex-column gap-4">
            <FormField
              label="Full name"
              autoComplete="name"
              error={errors.name?.message}
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
            />
            <FormField
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
              })}
            />
            <FormField
              label="Phone (optional)"
              type="tel"
              autoComplete="tel"
              error={errors.phone?.message}
              {...register('phone', { maxLength: { value: 20, message: 'Phone number is too long' } })}
            />
            <FormField
              label="Password"
              type="password"
              autoComplete="new-password"
              hint="At least 8 characters with a letter and a number."
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || 'Use at least one letter and one number',
              })}
            />
            <FormField
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              error={errors.confirm?.message}
              {...register('confirm', {
                required: 'Please confirm your password',
                validate: (v) => v === watch('password') || 'Passwords do not match',
              })}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="btn-primary w-100 mt-4">
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>

          <p className="text-center small text-muted mt-3 mb-0">
            Already have an account?{' '}
            <Link to="/login" className="text-forest">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
