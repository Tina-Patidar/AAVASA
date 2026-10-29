import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Button from 'react-bootstrap/Button';
import { CalendarCheck, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Explore Stays' },
  { to: '/our-story', label: 'Our Story' },
  { to: '/bookings', label: 'My Bookings' },
];

export default function AppNavbar() {
  const { user, isStaffOrAdmin, logout } = useAuth();
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => setShowOffcanvas(false);
  const handleShow = () => setShowOffcanvas(true);

  const handleLogout = async () => {
    handleClose();
    await logout();
    toast.success('You have been signed out.');
    navigate('/');
  };

  return (
    <>
      <Navbar expand="lg" className="navbar-aavasa">
        <Container fluid="xl">
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <Logo variant="compact" />
          </Navbar.Brand>

          <Navbar.Toggle
            aria-controls="navbar-offcanvas"
            onClick={handleShow}
            className="border-0 shadow-none px-2"
          />

          {/* Desktop Navigation */}
          <Navbar.Collapse className="d-none d-lg-flex justify-content-between">
            <Nav className="mx-auto gap-2">
              {navItems.map((item) => (
                <Nav.Link
                  key={item.to}
                  as={NavLink}
                  to={item.to}
                  className="px-3"
                >
                  {item.label}
                </Nav.Link>
              ))}
            </Nav>

            <div className="d-flex align-items-center gap-2">
              {user ? (
                <NavDropdown
                  title={
                    <span className="d-inline-flex align-items-center gap-2">
                      <span
                        className="rounded-circle bg-sage text-forest fw-semibold d-inline-flex align-items-center justify-content-center"
                        style={{ width: '28px', height: '28px', fontSize: '0.85rem' }}
                      >
                        {user.name?.[0]?.toUpperCase()}
                      </span>
                      <span className="text-charcoal fw-medium" style={{ fontSize: '0.9rem' }}>
                        {user.name.split(' ')[0]}
                      </span>
                    </span>
                  }
                  id="user-nav-dropdown"
                  align="end"
                  className="border rounded-pill px-2 py-0 bg-white"
                >
                  <div className="px-3 py-1 text-muted" style={{ fontSize: '0.75rem' }}>
                    {user.email}
                  </div>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={Link} to="/profile" className="d-flex align-items-center gap-2 py-2">
                    <UserIcon size={16} /> My profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/bookings" className="d-flex align-items-center gap-2 py-2">
                    <CalendarCheck size={16} /> My bookings
                  </NavDropdown.Item>
                  {isStaffOrAdmin && (
                    <NavDropdown.Item as={Link} to="/admin" className="d-flex align-items-center gap-2 py-2">
                      <LayoutDashboard size={16} /> Management Portal
                    </NavDropdown.Item>
                  )}
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout} className="d-flex align-items-center gap-2 py-2 text-danger">
                    <LogOut size={16} /> Log out
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <Button as={Link} to="/login" variant="ghost" className="btn-ghost">
                    Sign in
                  </Button>
                  <Button as={Link} to="/register" variant="primary" className="btn-primary btn-sm">
                    Create account
                  </Button>
                </div>
              )}
            </div>
          </Navbar.Collapse>

          {/* Mobile Offcanvas Drawer */}
          <Navbar.Offcanvas
            id="navbar-offcanvas"
            aria-labelledby="offcanvas-navbar-label"
            placement="end"
            show={showOffcanvas}
            onHide={handleClose}
            className="d-lg-none"
          >
            <Offcanvas.Header closeButton>
              <Offcanvas.Title id="offcanvas-navbar-label">
                <Logo variant="compact" />
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="d-flex flex-column justify-content-between">
              <Nav className="flex-column gap-2">
                {navItems.map((item) => (
                  <Nav.Link
                    key={item.to}
                    as={NavLink}
                    to={item.to}
                    onClick={handleClose}
                    className="py-2 fs-5"
                  >
                    {item.label}
                  </Nav.Link>
                ))}
              </Nav>

              <div className="pt-4 border-top">
                {user ? (
                  <div className="d-flex flex-column gap-2">
                    <div className="text-muted small px-1">{user.email}</div>
                    <Button as={Link} to="/profile" variant="outline-primary" onClick={handleClose} className="w-100 justify-content-start">
                      <UserIcon size={16} className="me-2" /> My Profile
                    </Button>
                    <Button as={Link} to="/bookings" variant="outline-primary" onClick={handleClose} className="w-100 justify-content-start">
                      <CalendarCheck size={16} className="me-2" /> My Bookings
                    </Button>
                    {isStaffOrAdmin && (
                      <Button as={Link} to="/admin" variant="outline-primary" onClick={handleClose} className="w-100 justify-content-start">
                        <LayoutDashboard size={16} className="me-2" /> Management Portal
                      </Button>
                    )}
                    <Button variant="danger" onClick={handleLogout} className="w-100 justify-content-start mt-2">
                      <LogOut size={16} className="me-2" /> Log out
                    </Button>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    <Button as={Link} to="/login" variant="outline-primary" onClick={handleClose} className="w-100">
                      Sign in
                    </Button>
                    <Button as={Link} to="/register" variant="primary" onClick={handleClose} className="w-100">
                      Create account
                    </Button>
                  </div>
                )}
              </div>
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Container>
      </Navbar>
    </>
  );
}
