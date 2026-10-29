import { Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import SmartImage from '../components/SmartImage.jsx';
import Reveal from '../components/Reveal.jsx';
import { LogoEmblem } from '../components/Logo.jsx';

const PILLARS = [
  ['Honest availability', 'A property only shows as available when its room inventory says so. We check every night of your stay, never just the first.'],
  ['Clear prices', 'The total is calculated on our server and broken down into room, tax and service fee before you confirm anything.'],
  ['Calm by design', 'Soft colours, generous space and no countdown timers. Booking a stay should feel like the beginning of a holiday.'],
];

export default function OurStory() {
  useDocumentTitle('Our Story');
  return (
    <>
      {/* Hero split section */}
      <section className="container-page py-5 py-lg-6">
        <Row className="align-items-center g-5">
          <Col lg={6}>
            <p className="eyebrow">Our story</p>
            <h1 className="mt-3 font-serif" style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', lineHeight: 1.2 }}>
              A word for <em className="text-forest">home</em>, and a promise to keep it.
            </h1>
            <p className="mt-4 lh-base text-muted" style={{ maxWidth: '520px' }}>
              Aavaas is an old word in Hindi and Sanskrit for a dwelling, a place where someone lives. AAVASA takes its name from that idea: the best stays are not the grandest ones, they are the ones where you feel looked after from the first evening.
            </p>
            <p className="mt-3 lh-base text-muted" style={{ maxWidth: '520px' }}>
              We built this platform as a full-stack capstone project to explore what a calmer, more honest hotel booking experience could look like: real availability, clear prices, and no pressure.
            </p>
            <Link to="/explore" className="btn btn-primary btn-primary mt-4">
              Explore stays
            </Link>
          </Col>

          <Col lg={6}>
            <Row className="g-3">
              <Col xs={7}>
                <SmartImage
                  src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=70"
                  alt="Warm heritage room with carved wooden furniture"
                  className="w-100 rounded-4 object-fit-cover"
                  style={{ aspectRatio: '3/4' }}
                  eager
                />
              </Col>
              <Col xs={5} className="mt-5 pt-4">
                <SmartImage
                  src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=700&q=70"
                  alt="Wooden cottage beside a mountain lake"
                  className="w-100 rounded-4 object-fit-cover"
                  style={{ aspectRatio: '3/5' }}
                  eager
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </section>

      {/* Pillars section */}
      <section className="py-5" style={{ background: 'rgba(220,231,221,0.5)' }}>
        <div className="container-page">
          <Row className="g-4">
            {PILLARS.map(([title, body], i) => (
              <Col md={4} key={title}>
                <Reveal delay={i * 90}>
                  <h2 className="font-serif fs-4">{title}</h2>
                  <p className="mt-2 small lh-base text-muted">{body}</p>
                </Reveal>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Brand tagline */}
      <section className="container-page d-flex flex-column align-items-center py-5 text-center">
        <LogoEmblem className="h-14 w-14" style={{ width: '56px', height: '56px' }} />
        <p className="mt-4 font-serif fs-4 fst-italic text-forest">Har safar mein, ghar jaisa sukoon.</p>
        <p className="mt-2 small text-muted" style={{ maxWidth: '400px' }}>Peace that feels like home, on every journey.</p>
        <p className="mt-5 text-muted" style={{ maxWidth: '540px', fontSize: '0.75rem', lineHeight: 1.7 }}>
          AAVASA is an academic demonstration. Properties, photographs and ratings shown on this site are illustrative samples and do not represent real partner hotels.
        </p>
      </section>
    </>
  );
}
