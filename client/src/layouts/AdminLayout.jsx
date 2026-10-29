import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import {
  BedDouble,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Users,
  ArrowLeft,
  CalendarDays,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuth();
  const [showMobile, setShowMobile] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => setShowMobile(false);
  const handleShow = () => setShowMobile(true);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out of management portal.');
    navigate('/');
  };

  // Staff sees limited options: Overview, Bookings, Guests, Room Inventory.
  // Admins also see Properties and User Management.
  const navItems = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true, roles: ['admin', 'staff'] },
    { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck, roles: ['admin', 'staff'] },
    { to: '/admin/guests', label: 'Guest Management', icon: UserCheck, roles: ['admin', 'staff'] },
    { to: '/admin/inventory', label: 'Room Inventory', icon: CalendarDays, roles: ['admin', 'staff'] },
    { to: '/admin/hotels', label: 'Properties', icon: BedDouble, roles: ['admin'] },
    { to: '/admin/users', label: 'User Accounts', icon: Users, roles: ['admin'] },
  ].filter((item) => item.roles.includes(user?.role || 'staff'));

  const renderNavLinks = () => (
    <Nav className="flex-column gap-1">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <Nav.Link
          key={to}
          as={NavLink}
          to={to}
          end={end}
          onClick={handleClose}
          className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-dark fw-medium text-decoration-none"
          style={({ isActive }) => ({
            backgroundColor: isActive ? 'var(--color-forest)' : 'transparent',
            color: isActive ? '#ffffff' : 'var(--color-charcoal)',
          })}
        >
          <Icon size={18} aria-hidden="true" />
          <span>{label}</span>
        </Nav.Link>
      ))}
    </Nav>
  );

  return (
    <div className="min-vh-100 bg-ivory d-flex flex-column flex-lg-row">
      {/* Desktop Sidebar */}
      <aside
        className="d-none d-lg-flex flex-column border-end bg-white p-4"
        style={{ width: '270px', minHeight: '100vh', position: 'sticky', top: 0 }}
      >
        <div className="mb-4">
          <Logo variant="compact" to="/admin" />
          <div className="d-flex align-items-center gap-2 mt-2">
            <span className="eyebrow" style={{ fontSize: '0.68rem' }}>Management Portal</span>
            <Badge bg={isAdmin ? 'dark' : 'secondary'} className="text-uppercase" style={{ fontSize: '0.65rem' }}>
              {user?.role}
            </Badge>
          </div>
        </div>

        <div className="flex-grow-1">{renderNavLinks()}</div>

        <div className="pt-4 border-top mt-auto small">
          <div className="fw-semibold text-dark text-truncate">{user?.name}</div>
          <div className="text-muted text-truncate mb-3" style={{ fontSize: '0.75rem' }}>{user?.email}</div>
          <div className="d-flex flex-column gap-2">
            <Link to="/" className="text-forest text-decoration-none d-flex align-items-center gap-2 small">
              <ArrowLeft size={16} /> Back to hotel site
            </Link>
            <Button
              variant="link"
              onClick={handleLogout}
              className="p-0 text-danger text-start text-decoration-none d-flex align-items-center gap-2 small"
            >
              <LogOut size={16} /> Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <header className="d-lg-none bg-white border-bottom px-3 py-2 d-flex justify-content-between align-items-center sticky-top">
        <Logo variant="compact" to="/admin" />
        <Button variant="outline-secondary" size="sm" onClick={handleShow} aria-label="Open management menu">
          Menu
        </Button>

        {/* Mobile Sidebar Offcanvas */}
        <Offcanvas show={showMobile} onHide={handleClose} placement="start">
          <Offcanvas.Header closeButton className="border-bottom">
            <Offcanvas.Title>
              <Logo variant="compact" to="/admin" />
              <div className="mt-1">
                <Badge bg={isAdmin ? 'dark' : 'secondary'}>{user?.role?.toUpperCase()}</Badge>
              </div>
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="d-flex flex-column justify-content-between p-3">
            <div>{renderNavLinks()}</div>
            <div className="pt-3 border-top mt-4">
              <div className="fw-bold">{user?.name}</div>
              <div className="text-muted small mb-3">{user?.email}</div>
              <Button as={Link} to="/" variant="outline-primary" size="sm" className="w-100 mb-2" onClick={handleClose}>
                <ArrowLeft size={14} className="me-1" /> Back to hotel site
              </Button>
              <Button variant="danger" size="sm" className="w-100" onClick={handleLogout}>
                <LogOut size={14} className="me-1" /> Sign out
              </Button>
            </div>
          </Offcanvas.Body>
        </Offcanvas>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow-1 p-3 p-md-5 overflow-auto" id="admin-main">
        <Container fluid="xl" className="px-0">
          <Outlet />
        </Container>
      </main>
    </div>
  );
}
