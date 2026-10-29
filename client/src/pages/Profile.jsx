import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import FormField from '../components/FormField.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { authApi, bookingApi, getErrorMessage, getFieldErrors } from '../services/api.js';
import { formatDate, formatINR } from '../utils/format.js';

export default function Profile() {
  useDocumentTitle('My profile');
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  // Fetch 5 most recent bookings across all groups for the mini history panel
  const history = useFetch(() => bookingApi.list({ group: 'all', limit: 5 }), []);
  const [pwError, setPwError] = useState('');

  const profile = useForm({
    defaultValues: { name: user.name, phone: user.phone || '', city: user.city || '' },
  });
  const password = useForm();

  const saveProfile = async (values) => {
    try {
      const res = await authApi.updateProfile(values);
      setUser(res.user);
      profile.reset({ name: res.user.name, phone: res.user.phone, city: res.user.city });
      toast.success('Profile updated.');
    } catch (e) {
      Object.entries(getFieldErrors(e)).forEach(([f, m]) => profile.setError(f, { message: m }));
      toast.error(getErrorMessage(e));
    }
  };

  const savePassword = async ({ currentPassword, newPassword }) => {
    setPwError('');
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      password.reset();
      toast.success('Password changed.');
    } catch (e) {
      setPwError(getErrorMessage(e));
    }
  };

  const signOut = async () => {
    await logout();
    toast.success('You have been signed out.');
    navigate('/');
  };

  return (
    <div className="container-page py-4 py-md-5" style={{ maxWidth: '960px' }}>
      <p className="eyebrow">Account</p>
      <h1 className="mt-3 font-serif fs-1">My profile</h1>

      <Row className="mt-5 g-4">
        {/* Personal details */}
        <Col md={6}>
          <form onSubmit={profile.handleSubmit(saveProfile)} noValidate className="card p-4">
            <h2 className="font-serif fs-4 mb-4">Personal details</h2>
            <div className="d-flex flex-column gap-4">
              <FormField label="Email" value={user.email} disabled readOnly hint="Email cannot be changed." />
              <FormField
                label="Full name"
                error={profile.formState.errors.name?.message}
                {...profile.register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'At least 2 characters' },
                })}
              />
              <FormField
                label="Phone"
                type="tel"
                error={profile.formState.errors.phone?.message}
                {...profile.register('phone', { maxLength: { value: 20, message: 'Too long' } })}
              />
              <FormField
                label="City"
                error={profile.formState.errors.city?.message}
                {...profile.register('city', { maxLength: { value: 80, message: 'Too long' } })}
              />
            </div>
            <Button
              type="submit"
              className="btn-primary mt-4"
              disabled={profile.formState.isSubmitting}
            >
              Save changes
            </Button>
          </form>
        </Col>

        {/* Change password */}
        <Col md={6}>
          <form onSubmit={password.handleSubmit(savePassword)} noValidate className="card p-4">
            <h2 className="font-serif fs-4 mb-4">Change password</h2>
            {pwError && (
              <Alert variant="danger" className="py-2 px-3 small mb-3" role="alert">
                {pwError}
              </Alert>
            )}
            <div className="d-flex flex-column gap-4">
              <FormField
                label="Current password"
                type="password"
                autoComplete="current-password"
                error={password.formState.errors.currentPassword?.message}
                {...password.register('currentPassword', { required: 'Enter your current password' })}
              />
              <FormField
                label="New password"
                type="password"
                autoComplete="new-password"
                hint="At least 8 characters with a letter and a number."
                error={password.formState.errors.newPassword?.message}
                {...password.register('newPassword', {
                  required: 'Enter a new password',
                  minLength: { value: 8, message: 'At least 8 characters' },
                  validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || 'Use at least one letter and one number',
                })}
              />
            </div>
            <Button
              type="submit"
              className="btn-primary mt-4"
              disabled={password.formState.isSubmitting}
            >
              Update password
            </Button>
          </form>
        </Col>
      </Row>

      {/* Recent bookings mini-history */}
      <section className="mt-5" aria-labelledby="hist">
        <div className="d-flex align-items-end justify-content-between mb-3">
          <h2 id="hist" className="font-serif fs-4 mb-0">Recent bookings</h2>
          <Link to="/bookings" className="text-forest small">View all</Link>
        </div>

        {history.loading ? (
          <p className="small text-muted">Loading…</p>
        ) : history.data?.bookings?.length ? (
          <ul className="list-unstyled mb-0 rounded-3 border bg-white overflow-hidden">
            {history.data.bookings.map((b) => (
              <li key={b._id} className="d-flex flex-wrap align-items-center justify-content-between gap-3 px-4 py-3 small border-bottom">
                <div>
                  <p className="fw-medium mb-0">{b.hotelSnapshot.name}</p>
                  <p className="text-muted mb-0">{b.reference} · {formatDate(b.checkIn)} to {formatDate(b.checkOut)}</p>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span>{formatINR(b.pricing.total)}</span>
                  <StatusBadge status={b.status} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small text-muted">No bookings yet.</p>
        )}
      </section>

      {/* Sign out */}
      <div className="mt-5 pt-4 border-top">
        <button type="button" onClick={signOut} className="btn btn-secondary">
          Log out
        </button>
      </div>
    </div>
  );
}
