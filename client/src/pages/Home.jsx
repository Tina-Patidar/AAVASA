import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { ArrowRight, Compass, HeartHandshake, ShieldCheck, Sprout } from 'lucide-react';
import toast from 'react-hot-toast';
import SearchForm from '../components/SearchForm.jsx';
import HotelCard from '../components/HotelCard.jsx';
import SmartImage from '../components/SmartImage.jsx';
import Reveal from '../components/Reveal.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { HotelCardSkeleton } from '../components/Skeletons.jsx';
import { useFetch } from '../hooks/useFetch.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { hotelApi } from '../services/api.js';
import { formatINR } from '../utils/format.js';

const HERO = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=70';

const why = [
  {
    icon: ShieldCheck,
    title: 'Honest availability',
    text: 'Rooms are checked night by night on our server, so what you see is what is really free.',
  },
  {
    icon: HeartHandshake,
    title: 'Clear, fair prices',
    text: 'Room rate, taxes, and service fees are itemised transparently before you confirm.',
  },
  {
    icon: Sprout,
    title: 'Chosen with care',
    text: 'A curated collection of distinctive properties that prioritize comfort, craft, and location.',
  },
  {
    icon: Compass,
    title: 'Easy to change plans',
    text: 'Cancel directly from My Bookings. Each property states its free cancellation timeframe.',
  },
];

const inspiration = [
  {
    title: 'Slow mornings in the hills',
    text: 'Cedar cottages, hot chai, and mountain horizons that transform with the sun.',
    q: 'Mountain Retreat',
    img: 'photo-1506905925346-21bda4d32df4',
    alt: 'Snow-capped mountains at dawn',
  },
  {
    title: 'Courtyards and carved doors',
    text: 'Heritage havelis where every arch holds history and mornings begin under shaded neem trees.',
    q: 'Heritage Haveli',
    img: 'photo-1564501049412-61c2a3083791',
    alt: 'Heritage room with carved wooden bed',
  },
  {
    title: 'Barefoot by the sea',
    text: 'Sun-bleached villas, swaying palms, and the soothing cadence of ocean tides.',
    q: 'Beach Villa',
    img: 'photo-1507525428034-b723cf961d3e',
    alt: 'Quiet tropical beach with palm trees',
  },
];

function Newsletter() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setDone(true);
    toast.success('Thank you! This is a demo form, so no personal data was stored.');
  };

  return (
    <Form onSubmit={submit} noValidate className="mt-4" style={{ maxWidth: '440px' }}>
      <div className="d-flex flex-column flex-sm-row gap-2">
        <div className="flex-grow-1">
          <Form.Control
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
              setDone(false);
            }}
            placeholder="you@example.com"
            isInvalid={Boolean(error)}
            aria-label="Email address"
          />
          {error && <Form.Control.Feedback type="invalid" className="small mt-1">{error}</Form.Control.Feedback>}
        </div>
        <Button type="submit" variant="primary" className="btn-primary text-nowrap">
          Subscribe
        </Button>
      </div>
      {done && <p className="small text-forest mt-2 mb-0">You are on the list (demo).</p>}
    </Form>
  );
}

export default function Home() {
  useDocumentTitle('A Stay That Feels Like Home');
  const navigate = useNavigate();
  const featured = useFetch(() => hotelApi.featured(), []);
  const dest = useFetch(() => hotelApi.destinations(), []);

  const onSearch = ({ q, checkIn, checkOut, guests, rooms }) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (checkIn && checkOut) {
      p.set('checkIn', checkIn);
      p.set('checkOut', checkOut);
    }
    p.set('guests', guests);
    p.set('rooms', rooms);
    navigate(`/explore?${p.toString()}`);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="position-relative">
        <div
          className="position-relative overflow-hidden"
          style={{ height: '36rem', minHeight: '520px' }}
        >
          <SmartImage
            src={HERO}
            alt="Warm boutique hotel facade at dusk"
            width={2000}
            eager
            className="w-100 h-100 object-fit-cover position-absolute top-0 start-0"
          />
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              background: 'linear-gradient(to top, rgba(41,45,41,0.78) 0%, rgba(41,45,41,0.3) 60%, rgba(41,45,41,0.15) 100%)',
            }}
            aria-hidden="true"
          />
          <Container fluid="xl" className="position-relative h-100 d-flex flex-column justify-content-center text-white pb-5">
            <span className="eyebrow text-sage mb-2" style={{ color: '#DCE7DD' }}>
              A Stay That Feels Like Home
            </span>
            <h1 className="font-serif display-4 fw-normal mb-3 text-white" style={{ maxWidth: '640px' }}>
              Find your place to unwind.
            </h1>
            <p className="fs-5 text-white-50 mb-0" style={{ maxWidth: '480px' }}>
              Thoughtfully chosen stays across India for the journeys that matter.
            </p>
          </Container>
        </div>

        {/* Floating Search Bar */}
        <Container fluid="xl" className="position-relative" style={{ marginTop: '-4rem' }}>
          <SearchForm onSubmit={onSearch} />
        </Container>
      </section>

      {/* Featured Stays */}
      <section className="py-5 mt-4">
        <Container fluid="xl">
          <Reveal className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
            <div>
              <span className="eyebrow">Featured Stays</span>
              <h2 className="font-serif fs-2 mb-0">Places Worth The Journey</h2>
            </div>
            <Link to="/explore" className="text-forest fw-medium text-decoration-none d-inline-flex align-items-center gap-1">
              See all stays <ArrowRight size={16} />
            </Link>
          </Reveal>

          {featured.error ? (
            <ErrorState message={featured.error} onRetry={featured.reload} />
          ) : (
            <Row className="gy-4">
              {featured.loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Col md={4} sm={6} key={i}>
                      <HotelCardSkeleton />
                    </Col>
                  ))
                : featured.data?.hotels?.slice(0, 6).map((h, i) => (
                    <Col lg={4} md={6} xs={12} key={h._id}>
                      <Reveal delay={(i % 3) * 80}>
                        <HotelCard hotel={h} variant={i === 0 ? 'feature' : 'default'} />
                      </Reveal>
                    </Col>
                  ))}
            </Row>
          )}
          <p className="small text-muted mt-3 mb-0">
            Properties, photographs, and ratings are illustrative demo samples.
          </p>
        </Container>
      </section>

      {/* Popular Destinations */}
      {dest.data?.destinations?.length > 0 && (
        <section className="py-5 bg-white border-top border-bottom">
          <Container fluid="xl">
            <Reveal className="mb-4">
              <span className="eyebrow">Popular Destinations</span>
              <h2 className="font-serif fs-2 mb-0">Where Would You Like To Wake Up?</h2>
            </Reveal>

            <Row className="gy-3">
              {dest.data.destinations.map((d, i) => (
                <Col md={4} sm={6} xs={12} key={d.city}>
                  <Reveal delay={(i % 3) * 70}>
                    <Link
                      to={`/explore?q=${encodeURIComponent(d.city)}`}
                      className="position-relative d-block rounded-4 overflow-hidden shadow-sm text-decoration-none"
                      style={{ height: '240px' }}
                      aria-label={`Stays in ${d.city}`}
                    >
                      <SmartImage
                        src={d.image?.url}
                        alt={d.image?.alt || d.city}
                        width={800}
                        className="w-100 h-100 object-fit-cover"
                      />
                      <div
                        className="position-absolute top-0 start-0 w-100 h-100"
                        style={{ background: 'linear-gradient(to top, rgba(41,45,41,0.8) 0%, transparent 60%)' }}
                        aria-hidden="true"
                      />
                      <div className="position-absolute bottom-0 start-0 p-3 text-white">
                        <h3 className="font-serif fs-4 mb-0 text-white">{d.city}</h3>
                        <p className="small text-white-50 mb-0">
                          {d.properties} {d.properties === 1 ? 'stay' : 'stays'} · from {formatINR(d.fromPrice)}
                        </p>
                      </div>
                    </Link>
                  </Reveal>
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}

      {/* Why AAVASA */}
      <section className="py-5" style={{ backgroundColor: 'rgba(220, 231, 221, 0.45)' }}>
        <Container fluid="xl" className="py-4">
          <Row className="gy-4 align-items-center">
            <Col lg={4}>
              <Reveal>
                <span className="eyebrow">Why AAVASA?</span>
                <h2 className="font-serif fs-2 mb-3">Travel is better when the details are taken care of.</h2>
                <p className="text-muted small">
                  From atomic availability booking safeguards to transparent pricing breakdowns, our architecture ensures absolute peace of mind.
                </p>
              </Reveal>
            </Col>
            <Col lg={8}>
              <Row className="gy-4">
                {why.map(({ icon: Icon, title, text }, i) => (
                  <Col sm={6} key={title}>
                    <Reveal delay={i * 70} className="p-3 bg-white rounded-3 border h-100">
                      <Icon size={24} className="text-forest mb-2" aria-hidden="true" />
                      <h4 className="font-serif fs-5 mb-1">{title}</h4>
                      <p className="small text-muted mb-0">{text}</p>
                    </Reveal>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Brand Story Snippet */}
      <section className="py-5">
        <Container fluid="xl">
          <Row className="gy-4 align-items-center">
            <Col lg={6}>
              <Reveal>
                <div className="rounded-4 overflow-hidden shadow-sm" style={{ height: '380px' }}>
                  <SmartImage
                    src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=70"
                    alt="Serene boutique hotel room"
                    width={1200}
                    className="w-100 h-100 object-fit-cover"
                  />
                </div>
              </Reveal>
            </Col>
            <Col lg={6} className="ps-lg-5">
              <Reveal delay={100}>
                <span className="eyebrow">Our Philosophy</span>
                <h2 className="font-serif fs-2 mb-3">Aavaas: The timeless word for home.</h2>
                <p className="text-muted mb-3" style={{ lineHeight: '1.7' }}>
                  AAVASA borrows its name from the Sanskrit and Hindi word for a sanctuary or dwelling. We believe a hotel stay should feel less like a clinical transaction and more like being welcomed back somewhere you truly belong.
                </p>
                <p className="font-serif fs-4 fst-italic text-forest mb-4">
                  "Har safar mein, ghar jaisa sukoon."
                </p>
                <Button as={Link} to="/our-story" variant="outline-primary" className="btn-secondary">
                  Read Our Story
                </Button>
              </Reveal>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Travel Inspiration */}
      <section className="py-5 bg-white border-top">
        <Container fluid="xl">
          <Reveal className="mb-4">
            <span className="eyebrow">Curated Collections</span>
            <h2 className="font-serif fs-2 mb-0">Start With A Feeling</h2>
          </Reveal>

          <Row className="gy-4">
            {inspiration.map((s, i) => (
              <Col md={4} sm={12} key={s.title}>
                <Reveal delay={i * 90}>
                  <Link
                    to={`/explore?propertyType=${encodeURIComponent(s.q)}`}
                    className="text-decoration-none text-dark d-block"
                  >
                    <div className="rounded-4 overflow-hidden mb-3" style={{ height: '260px' }}>
                      <SmartImage
                        src={`https://images.unsplash.com/${s.img}?auto=format&fit=crop&w=900&q=70`}
                        alt={s.alt}
                        width={900}
                        className="w-100 h-100 object-fit-cover"
                      />
                    </div>
                    <h4 className="font-serif fs-5 mb-1">{s.title}</h4>
                    <p className="small text-muted mb-2">{s.text}</p>
                    <span className="text-forest small fw-semibold d-inline-flex align-items-center gap-1">
                      Browse {s.q}s <ArrowRight size={14} />
                    </span>
                  </Link>
                </Reveal>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Newsletter */}
      <section className="py-5">
        <Container fluid="xl">
          <Reveal className="p-5 rounded-4 bg-sand bg-opacity-75">
            <span className="eyebrow">Letters From AAVASA</span>
            <h2 className="font-serif fs-2 mb-2">Quiet travel notes, a few times a year.</h2>
            <Newsletter />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
