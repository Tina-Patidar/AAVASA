import axios from 'axios';

// "/api" in development (Vite proxy) or the full API URL in production
const baseURL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export const api = axios.create({
  baseURL,
  withCredentials: true, // send the httpOnly session cookie
  timeout: 20000,
});

/** Turns any axios error into a friendly message plus optional per-field details. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (error?.message === 'Network Error') return 'Cannot reach the server. Check your connection and try again.';
  return fallback;
}

export const getFieldErrors = (error) => {
  const details = error?.response?.data?.details;
  if (!Array.isArray(details)) return {};
  return Object.fromEntries(details.map((d) => [d.field, d.message]));
};

const get = (url, params) => api.get(url, { params }).then((r) => r.data);
const post = (url, body) => api.post(url, body).then((r) => r.data);
const patch = (url, body) => api.patch(url, body).then((r) => r.data);
const del = (url) => api.delete(url).then((r) => r.data);

export const authApi = {
  register: (body) => post('/auth/register', body),
  login: (body) => post('/auth/login', body),
  logout: () => post('/auth/logout'),
  me: () => get('/auth/me'),
  updateProfile: (body) => patch('/auth/me', body),
  changePassword: (body) => patch('/auth/me/password', body),
};

export const hotelApi = {
  list: (params) => get('/hotels', params),
  featured: () => get('/hotels/featured'),
  meta: () => get('/hotels/meta'),
  destinations: () => get('/hotels/destinations'),
  detail: (idOrSlug, params) => get(`/hotels/${idOrSlug}`, params),
  availability: (idOrSlug, params) => get(`/hotels/${idOrSlug}/availability`, params),
  createReview: (idOrSlug, body) => post(`/hotels/${idOrSlug}/reviews`, body),
};

export const bookingApi = {
  quote: (body) => post('/bookings/quote', body),
  create: (body) => post('/bookings', body),
  list: (params) => get('/bookings', params),
  get: (id) => get(`/bookings/${id}`),
  cancel: (id, reason) => patch(`/bookings/${id}/cancel`, { reason }),
};

export const adminApi = {
  stats: () => get('/admin/stats'),
  hotels: (params) => get('/admin/hotels', params),
  hotel: (id) => get(`/admin/hotels/${id}`),
  createHotel: (body) => post('/admin/hotels', body),
  updateHotel: (id, body) => patch(`/admin/hotels/${id}`, body),
  deleteHotel: (id) => del(`/admin/hotels/${id}`),
  rooms: (hotelId) => get(`/admin/hotels/${hotelId}/rooms`),
  createRoom: (hotelId, body) => post(`/admin/hotels/${hotelId}/rooms`, body),
  updateRoom: (id, body) => patch(`/admin/rooms/${id}`, body),
  deleteRoom: (id) => del(`/admin/rooms/${id}`),
  bookings: (params) => get('/admin/bookings', params),
  booking: (id) => get(`/admin/bookings/${id}`),
  updateBookingStatus: (id, body) => patch(`/admin/bookings/${id}/status`, body),
  users: (params) => get('/admin/users', params),
  user: (id) => get(`/admin/users/${id}`),
  updateUser: (id, body) => patch(`/admin/users/${id}`, body),
  guests: (params) => get('/admin/guests', params),
  guest: (id) => get(`/admin/guests/${id}`),
  updateGuestNotes: (id, body) => patch(`/admin/guests/${id}/notes`, body),
  inventory: (params) => get('/admin/inventory', params),
};
