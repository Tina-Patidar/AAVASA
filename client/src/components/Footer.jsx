import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from 'lucide-react';
import Logo from './Logo.jsx';

const cols = [
  {
    title: 'Explore',
    links: [
      { to: '/explore', label: 'All stays' },
      { to: '/explore?propertyType=Heritage%20Haveli', label: 'Heritage havelis' },
      { to: '/explore?propertyType=Mountain%20Retreat', label: 'Mountain retreats' },
      { to: '/explore?propertyType=Beach%20Villa', label: 'Beach villas' },
    ],
  },
  {
    title: 'AAVASA',
    links: [
      { to: '/our-story', label: 'Our story' },
      { to: '/bookings', label: 'My bookings' },
      { to: '/profile', label: 'My account' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { to: '/policies/cancellation', label: 'Cancellation policy' },
      { to: '/policies/privacy', label: 'Privacy policy' },
      { to: '/policies/terms', label: 'Terms of use' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-5 bg-charcoal text-white pt-5">
      <Container fluid="xl" className="py-4">
        <Row className="gy-5">
          <Col lg={4} md={12}>
            <Logo variant="full" tone="light" />
            <p className="mt-3 text-white-50" style={{ maxWidth: '320px', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Thoughtfully chosen stays for the journeys that matter.{' '}
              <span className="fst-italic text-peach">Har safar mein, ghar jaisa sukoon.</span>
            </p>
            <ul className="list-unstyled mt-4 d-flex flex-column gap-2 text-white-50" style={{ fontSize: '0.875rem' }}>
              <li className="d-flex align-items-center gap-2">
                <Mail size={16} className="text-peach" /> hello@aavasa.example
              </li>
              <li className="d-flex align-items-center gap-2">
                <Phone size={16} className="text-peach" /> +91 00000 00000 (demo)
              </li>
              <li className="d-flex align-items-center gap-2">
                <MapPin size={16} className="text-peach" /> India
              </li>
            </ul>
          </Col>

          <Col lg={8} md={12}>
            <Row className="gy-4">
              {cols.map((c) => (
                <Col sm={4} xs={6} key={c.title}>
                  <h6 className="eyebrow text-peach mb-3">{c.title}</h6>
                  <ul className="list-unstyled d-flex flex-column gap-2" style={{ fontSize: '0.875rem' }}>
                    {c.links.map((l) => (
                      <li key={l.to}>
                        <Link to={l.to} className="text-white-50 text-decoration-none hover-white">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Container>

      <div className="border-top border-secondary border-opacity-25 mt-4 py-4">
        <Container fluid="xl" className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 text-white-50 small">
          <div>
            &copy; {new Date().getFullYear()} AAVASA. Academic demonstration project (HotelPro capstone). Properties and photographs are illustrative samples; payments are demo only.
          </div>
          <div className="d-flex align-items-center gap-3">
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="AAVASA on Instagram" className="text-white-50">
              <Instagram size={18} />
            </a>
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="AAVASA on Facebook" className="text-white-50">
              <Facebook size={18} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="AAVASA on Twitter" className="text-white-50">
              <Twitter size={18} />
            </a>
          </div>
        </Container>
      </div>
    </footer>
  );
}
