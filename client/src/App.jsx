import { lazy, Suspense } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { PageSkeleton } from './components/Skeletons.jsx';
import Home from './pages/Home.jsx';
import Explore from './pages/Explore.jsx';
import HotelDetails from './pages/HotelDetails.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import OurStory from './pages/OurStory.jsx';
import Policy from './pages/Policy.jsx';
import NotFound from './pages/NotFound.jsx';
import Checkout from './pages/Checkout.jsx';
import BookingConfirmation from './pages/BookingConfirmation.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Profile from './pages/Profile.jsx';

// The management area is split into lazy bundles
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview.jsx'));
const AdminHotels = lazy(() => import('./pages/admin/AdminHotels.jsx'));
const AdminHotelForm = lazy(() => import('./pages/admin/AdminHotelForm.jsx'));
const AdminRooms = lazy(() => import('./pages/admin/AdminRooms.jsx'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings.jsx'));
const AdminGuests = lazy(() => import('./pages/admin/AdminGuests.jsx'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'));

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { background: '#292D29', color: '#FAF8F4', fontSize: '0.875rem', borderRadius: '12px' },
          success: { iconTheme: { primary: '#DCE7DD', secondary: '#292D29' } },
        }}
      />
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="explore" element={<Explore />} />
          <Route path="stays/:slug" element={<HotelDetails />} />
          <Route path="our-story" element={<OurStory />} />
          <Route path="policies/:topic" element={<Policy />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<Checkout />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="bookings/:id/confirmation" element={<BookingConfirmation />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <Outlet />
                </Suspense>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="guests" element={<AdminGuests />} />
              <Route path="inventory" element={<AdminInventory />} />

              {/* Admin-only routes */}
              <Route element={<ProtectedRoute adminOnly />}>
                <Route path="hotels" element={<AdminHotels />} />
                <Route path="hotels/new" element={<AdminHotelForm />} />
                <Route path="hotels/:id/edit" element={<AdminHotelForm />} />
                <Route path="hotels/:id/rooms" element={<AdminRooms />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
}
