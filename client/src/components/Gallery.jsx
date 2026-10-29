import { useCallback, useEffect, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import SmartImage from './SmartImage.jsx';

/** Editorial gallery grid with a keyboard-accessible modal lightbox. */
export default function Gallery({ images = [], name }) {
  const [index, setIndex] = useState(null);
  const open = index !== null;

  const move = useCallback(
    (dir) => setIndex((i) => (i === null ? i : (i + dir + images.length) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, move]);

  if (!images.length) return null;
  const thumbs = images.slice(1, 5);

  return (
    <>
      <Row className="g-2 g-md-3 mb-4">
        <Col md={7} xs={12}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIndex(0)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIndex(0)}
            className="position-relative rounded-4 overflow-hidden shadow-sm"
            style={{ height: '380px', cursor: 'pointer' }}
            aria-label={`Open photo 1 of ${images.length}: ${images[0].alt}`}
          >
            <SmartImage
              src={images[0].url}
              alt={images[0].alt}
              width={1400}
              eager
              className="w-100 h-100 object-fit-cover"
            />
            <span
              className="position-absolute bottom-0 end-0 m-3 d-inline-flex align-items-center gap-1 rounded-pill bg-white px-3 py-1 small fw-medium text-forest shadow"
              style={{ fontSize: '0.78rem' }}
            >
              <Expand size={14} aria-hidden="true" /> {images.length} photos
            </span>
          </div>
        </Col>

        <Col md={5} className="d-none d-md-block">
          <Row className="g-2 g-md-3">
            {thumbs.map((img, i) => (
              <Col xs={6} key={img.url + i}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setIndex(i + 1)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIndex(i + 1)}
                  className="rounded-4 overflow-hidden shadow-sm"
                  style={{ height: '182px', cursor: 'pointer' }}
                  aria-label={`Open photo ${i + 2} of ${images.length}: ${img.alt}`}
                >
                  <SmartImage
                    src={img.url}
                    alt={img.alt}
                    width={700}
                    className="w-100 h-100 object-fit-cover"
                  />
                </div>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      {/* Lightbox Modal */}
      <Modal
        show={open}
        onHide={() => setIndex(null)}
        fullscreen
        centered
        contentClassName="bg-dark text-white border-0"
      >
        <Modal.Header className="border-0 p-3 px-4 d-flex justify-content-between align-items-center">
          <span className="small text-white-50" aria-live="polite">
            {index !== null ? index + 1 : 1} / {images.length}
          </span>
          <Button
            variant="link"
            onClick={() => setIndex(null)}
            className="text-white p-1 text-decoration-none"
            aria-label="Close gallery"
          >
            <X size={24} />
          </Button>
        </Modal.Header>
        <Modal.Body className="d-flex align-items-center justify-content-center position-relative p-2 p-md-4">
          {images.length > 1 && (
            <Button
              variant="light"
              onClick={() => move(-1)}
              className="position-absolute start-0 ms-3 rounded-circle p-2 shadow z-3"
              aria-label="Previous photo"
            >
              <ChevronLeft size={20} className="text-forest" />
            </Button>
          )}

          {index !== null && (
            <div className="text-center" style={{ maxHeight: '80vh' }}>
              <SmartImage
                src={images[index].url}
                alt={images[index].alt}
                width={1600}
                eager
                className="img-fluid rounded-3"
                style={{ maxHeight: '72vh', objectFit: 'contain' }}
              />
              <p className="mt-3 text-white-50 small mb-0">{images[index].alt}</p>
            </div>
          )}

          {images.length > 1 && (
            <Button
              variant="light"
              onClick={() => move(1)}
              className="position-absolute end-0 me-3 rounded-circle p-2 shadow z-3"
              aria-label="Next photo"
            >
              <ChevronRight size={20} className="text-forest" />
            </Button>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
