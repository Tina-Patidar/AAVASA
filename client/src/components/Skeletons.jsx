import Card from 'react-bootstrap/Card';
import Placeholder from 'react-bootstrap/Placeholder';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export function HotelCardSkeleton() {
  return (
    <Card className="h-100 overflow-hidden" aria-hidden="true">
      <div className="skeleton w-100" style={{ height: '220px' }} />
      <Card.Body className="p-4">
        <Placeholder as="div" animation="glow" className="mb-2">
          <Placeholder xs={4} size="sm" bg="secondary" />
        </Placeholder>
        <Placeholder as="h5" animation="glow" className="mb-2">
          <Placeholder xs={8} bg="dark" />
        </Placeholder>
        <Placeholder as="p" animation="glow" className="mb-3">
          <Placeholder xs={12} size="sm" bg="secondary" />
          <Placeholder xs={7} size="sm" bg="secondary" />
        </Placeholder>
        <div className="d-flex justify-content-between align-items-center pt-2">
          <Placeholder xs={3} size="lg" bg="secondary" />
          <Placeholder xs={4} size="lg" className="rounded-pill" bg="primary" />
        </div>
      </Card.Body>
    </Card>
  );
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="d-flex flex-column gap-3" aria-hidden="true" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} className="p-3">
          <div className="d-flex gap-3 align-items-center">
            <div className="skeleton rounded-3 flex-shrink-0" style={{ width: '120px', height: '90px' }} />
            <div className="flex-grow-1">
              <Placeholder as="div" animation="glow" className="mb-2">
                <Placeholder xs={5} bg="dark" />
              </Placeholder>
              <Placeholder as="div" animation="glow" className="mb-2">
                <Placeholder xs={8} size="sm" bg="secondary" />
              </Placeholder>
              <Placeholder as="div" animation="glow">
                <Placeholder xs={4} size="xs" bg="secondary" />
              </Placeholder>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <Container fluid="xl" className="py-5" role="status" aria-label="Loading">
      <div className="skeleton mb-4 rounded-3" style={{ height: '40px', width: '280px' }} />
      <div className="skeleton mb-4 rounded-4 w-100" style={{ height: '320px' }} />
      <Row className="gy-4">
        <Col lg={8}>
          <div className="skeleton mb-3 rounded-2 w-100" style={{ height: '24px' }} />
          <div className="skeleton mb-3 rounded-2 w-75" style={{ height: '20px' }} />
          <div className="skeleton mb-3 rounded-2 w-50" style={{ height: '20px' }} />
        </Col>
        <Col lg={4}>
          <div className="skeleton rounded-4 w-100" style={{ height: '240px' }} />
        </Col>
      </Row>
    </Container>
  );
}
