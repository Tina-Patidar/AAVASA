import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { LogoEmblem } from '../components/Logo.jsx';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <section className="container-page d-flex flex-column align-items-center text-center py-5 my-5">
      <LogoEmblem style={{ width: '64px', height: '64px' }} />
      <p className="eyebrow mt-4">Error 404</p>
      <h1 className="mt-3 font-serif" style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)' }}>
        This room does not exist.
      </h1>
      <p className="mt-3 text-muted" style={{ maxWidth: '400px' }}>
        The page you were looking for may have moved. Let us take you somewhere comfortable instead.
      </p>
      <div className="mt-4 d-flex gap-3">
        <Link to="/" className="btn btn-primary btn-primary">Back to home</Link>
        <Link to="/explore" className="btn btn-secondary">Explore stays</Link>
      </div>
    </section>
  );
}
