import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Logo from '../components/Logo.jsx';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function Login() {
  useDocumentTitle('Sign in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`);
      navigate(location.state?.from || (user.role === 'admin' || user.role === 'staff' ? '/admin' : '/'), { replace: true });
    } catch (e) {
      setServerError(getErrorMessage(e));
    }
  };

  return (
    <div className="container-page d-flex justify-content-center py-5">
      <div style={{ width: '100%', maxWidth: '448px' }}>
        <div className="mb-4 d-flex justify-content-center">
          <Logo variant="full" />
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="card p-4 p-md-5">
          <h1 className="font-serif fs-3 mb-4">Welcome back</h1>

          {serverError && (
            <Alert variant="danger" role="alert" className="py-2 px-3 small">
              {serverError}
            </Alert>
          )}

          <div className="d-flex flex-column gap-4">
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
              label="Password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-100 mt-4"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>

          <p className="text-center small text-muted mt-3 mb-0">
            New to AAVASA?{' '}
            <Link to="/register" className="text-forest">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
