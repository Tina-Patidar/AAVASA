import { Link } from 'react-router-dom';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { BedDouble, CalendarCheck, IndianRupee, Users } from 'lucide-react';
import ErrorState from '../../components/ErrorState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { adminApi } from '../../services/api.js';
import { formatINR } from '../../utils/format.js';

const COLORS = {
  pending: '#D8B4A0',
  confirmed: '#52634E',
  checked_in: '#78866B',
  checked_out: '#41464b',
  completed: '#78866B',
  cancelled: '#a33b3b',
};

function StatCard({ icon: Icon, label, value, note }) {
  return (
    <Card className="p-4 border shadow-sm h-100 bg-white">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="small text-muted text-uppercase fw-semibold">{label}</span>
        <Icon size={20} className="text-forest" aria-hidden="true" />
      </div>
      <div className="font-serif fs-2 fw-bold text-dark my-1">{value}</div>
      {note && <div className="small text-muted mt-auto" style={{ fontSize: '0.78rem' }}>{note}</div>}
    </Card>
  );
}

export default function AdminOverview() {
  useDocumentTitle('Management Overview | AAVASA');
  const { data, loading, error, reload } = useFetch(() => adminApi.stats(), []);

  if (loading) return <Card className="p-5 text-center text-muted">Loading live analytics...</Card>;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const s = data.stats;
  const dist = s.statusDistribution.filter((d) => d.count > 0);
  const hasTrend = s.bookingTrend && s.bookingTrend.length >= 2;

  return (
    <div>
      <div className="mb-4">
        <span className="eyebrow">Real-Time Metrics</span>
        <h1 className="font-serif fs-2 mb-1">Management Overview</h1>
        <p className="text-muted small mb-0">Live data derived continuously from the database.</p>
      </div>

      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard icon={BedDouble} label="Properties" value={s.totalProperties} note={`${s.activeProperties} active destinations`} />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard icon={CalendarCheck} label="Bookings" value={s.totalBookings} note="Total reservations" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard icon={Users} label="Registered Users" value={s.totalUsers} note="Guests, staff & admins" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            icon={IndianRupee}
            label="Recorded Value"
            value={formatINR(s.revenue.total)}
            note={`${s.revenue.bookingCount} active/completed stays (Demo)`}
          />
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={6}>
          <Card className="p-4 border shadow-sm h-100 bg-white" aria-labelledby="dist">
            <h3 id="dist" className="font-serif fs-5 mb-3">Booking Status Distribution</h3>
            {dist.length === 0 ? (
              <p className="text-muted small my-4">No bookings recorded yet.</p>
            ) : (
              <div className="d-flex flex-column flex-sm-row align-items-center justify-content-around gap-4 mt-2">
                <div style={{ width: '180px', height: '180px' }} role="img" aria-label="Status distribution pie chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dist} dataKey="count" nameKey="status" innerRadius={45} outerRadius={75} paddingAngle={2}>
                        {dist.map((d) => (
                          <Cell key={d.status} fill={COLORS[d.status] || '#78866B'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="d-flex flex-column gap-2 small">
                  {s.statusDistribution.map((d) => (
                    <div key={d.status} className="d-flex align-items-center gap-2">
                      <span
                        className="rounded-1 d-inline-block"
                        style={{ width: '12px', height: '12px', backgroundColor: COLORS[d.status] || '#78866B' }}
                        aria-hidden="true"
                      />
                      <span className="text-capitalize text-muted" style={{ width: '100px' }}>{d.status.replace('_', ' ')}:</span>
                      <span className="fw-bold text-dark">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="p-4 border shadow-sm h-100 bg-white" aria-labelledby="trend">
            <h3 id="trend" className="font-serif fs-5 mb-3">Bookings Trend (Last 30 Days)</h3>
            {hasTrend ? (
              <div style={{ height: '220px' }} role="img" aria-label="Line chart of bookings created per day">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={s.bookingTrend}>
                    <CartesianGrid stroke="#E9DFD1" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                    <Tooltip />
                    <Line type="monotone" dataKey="bookings" stroke="#52634E" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted small my-4">
                A live trend line appears once reservations exist across multiple days. Figures reflect real database entries without estimation.
              </p>
            )}
          </Card>
        </Col>
      </Row>

      <Card className="border shadow-sm p-4 bg-white" aria-labelledby="recent">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 id="recent" className="font-serif fs-5 mb-0">Recent Reservations</h3>
          <Link to="/admin/bookings" className="text-forest small text-decoration-none">
            View all bookings &rarr;
          </Link>
        </div>

        {s.recentBookings.length === 0 ? (
          <p className="text-muted small mb-0">No bookings recorded yet.</p>
        ) : (
          <div className="table-responsive">
            <Table hover className="table-aavasa small mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Reference</th>
                  <th>Guest</th>
                  <th>Property</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {s.recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="fw-semibold font-monospace">{b.reference}</td>
                    <td>{b.guest}</td>
                    <td>{b.hotel}</td>
                    <td className="fw-medium">{formatINR(b.total)}</td>
                    <td><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
