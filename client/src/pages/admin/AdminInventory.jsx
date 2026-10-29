import { useEffect, useState } from 'react';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { ChevronLeft, ChevronRight, Calendar, Building, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi, getErrorMessage } from '../../services/api.js';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { formatINR } from '../../utils/format.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

export default function AdminInventory() {
  useDocumentTitle('Room Inventory Grid | AAVASA');
  const [data, setData] = useState(null);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInventory = (hotelId = selectedHotelId, start = startDate) => {
    setLoading(true);
    setError(null);
    adminApi
      .inventory({ hotelId: hotelId || undefined, startDate: start, days: 14 })
      .then((res) => {
        setData(res);
        if (res.selectedHotel && !hotelId) {
          setSelectedHotelId(String(res.selectedHotel._id));
        }
      })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load inventory grid.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleHotelChange = (e) => {
    const newId = e.target.value;
    setSelectedHotelId(newId);
    fetchInventory(newId, startDate);
  };

  const shiftDays = (delta) => {
    const cur = new Date(`${startDate}T00:00:00Z`);
    cur.setUTCDate(cur.getUTCDate() + delta);
    const nextStr = cur.toISOString().slice(0, 10);
    setStartDate(nextStr);
    fetchInventory(selectedHotelId, nextStr);
  };

  const jumpToToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    fetchInventory(selectedHotelId, today);
  };

  // Helper for cell styling
  const getCellBadge = (booked, total) => {
    if (total === 0) return { bg: 'light', text: 'text-muted', label: '0/0' };
    const pct = Math.round((booked / total) * 100);
    if (pct >= 100) {
      return {
        bg: '#f8d7da',
        border: '#f5c2c7',
        textColor: '#842029',
        status: 'Full',
      };
    }
    if (pct >= 50) {
      return {
        bg: '#fff3cd',
        border: '#ffecb5',
        textColor: '#664d03',
        status: 'Busy',
      };
    }
    return {
      bg: '#d1e7dd',
      border: '#badbcc',
      textColor: '#0f5132',
      status: 'Open',
    };
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <span className="eyebrow">Real-Time Inventory</span>
          <h1 className="font-serif fs-2 mb-0">14-Day Room Inventory Grid</h1>
        </div>

        {/* Controls: Hotel dropdown + Date shift */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          {data?.hotels?.length > 0 && (
            <Form.Select
              value={selectedHotelId}
              onChange={handleHotelChange}
              size="sm"
              style={{ width: '220px' }}
              aria-label="Select property"
            >
              {data.hotels.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name} ({h.city})
                </option>
              ))}
            </Form.Select>
          )}

          <div className="btn-group btn-group-sm" role="group">
            <Button variant="outline-secondary" size="sm" onClick={() => shiftDays(-14)} title="Previous 14 days">
              <ChevronLeft size={16} /> -14d
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={jumpToToday}>
              Today
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={() => shiftDays(14)} title="Next 14 days">
              +14d <ChevronRight size={16} />
            </Button>
          </div>

          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => fetchInventory(selectedHotelId, startDate)}
            title="Refresh inventory"
          >
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="d-flex flex-wrap align-items-center gap-3 mb-3 small">
        <span className="text-muted fw-semibold">Occupancy Legend:</span>
        <span className="d-inline-flex align-items-center gap-1">
          <span className="badge" style={{ backgroundColor: '#d1e7dd', color: '#0f5132', border: '1px solid #badbcc' }}>
            Booked / Total
          </span>
          <span className="text-muted">Plenty Available (&lt; 50%)</span>
        </span>
        <span className="d-inline-flex align-items-center gap-1">
          <span className="badge" style={{ backgroundColor: '#fff3cd', color: '#664d03', border: '1px solid #ffecb5' }}>
            Booked / Total
          </span>
          <span className="text-muted">Limited (50% - 99%)</span>
        </span>
        <span className="d-inline-flex align-items-center gap-1">
          <span className="badge" style={{ backgroundColor: '#f8d7da', color: '#842029', border: '1px solid #f5c2c7' }}>
            Booked / Total
          </span>
          <span className="text-muted">Fully Booked (100%)</span>
        </span>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => fetchInventory()} />
      ) : loading ? (
        <Card className="p-5 text-center text-muted">Loading 14-day inventory matrix...</Card>
      ) : !data || data.matrix.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No room types configured"
          message="This property does not have any active room types. Configure room inventory first."
        />
      ) : (
        <Card className="border shadow-sm overflow-hidden">
          <div className="table-responsive">
            <Table bordered hover className="align-middle text-center mb-0" style={{ minWidth: '950px' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '220px', textAlign: 'left' }} className="py-3 px-3">
                    Room Type
                  </th>
                  {data.dates.map((dStr) => {
                    const dateObj = new Date(`${dStr}T00:00:00Z`);
                    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
                    const dayNum = dateObj.getUTCDate();
                    const month = dateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
                    const isToday = dStr === new Date().toISOString().slice(0, 10);

                    return (
                      <th
                        key={dStr}
                        className={`small py-2 px-1 ${isToday ? 'table-warning border-primary' : ''}`}
                        style={{ minWidth: '65px' }}
                      >
                        <div className="fw-semibold text-uppercase" style={{ fontSize: '0.68rem' }}>{weekday}</div>
                        <div className="fs-6 fw-bold">{dayNum}</div>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>{month}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {data.matrix.map((row) => (
                  <tr key={row.roomType._id}>
                    <td style={{ textAlign: 'left' }} className="px-3 py-3">
                      <div className="fw-semibold text-dark">{row.roomType.name}</div>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        {formatINR(row.roomType.pricePerNight)}/night · {row.roomType.totalRooms} rooms total
                      </div>
                    </td>
                    {row.days.map((day) => {
                      const badge = getCellBadge(day.booked, day.total);
                      return (
                        <td key={day.date} className="p-1">
                          <div
                            className="rounded-2 p-1 d-flex flex-column justify-content-center"
                            style={{
                              backgroundColor: badge.bg,
                              border: `1px solid ${badge.border}`,
                              color: badge.textColor,
                              fontSize: '0.78rem',
                              height: '48px',
                            }}
                          >
                            <span className="fw-bold">
                              {day.booked} / {day.total}
                            </span>
                            <span style={{ fontSize: '0.65rem' }}>
                              {day.free} free
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <Card.Footer className="bg-light py-2 px-3 small text-muted d-flex justify-content-between align-items-center">
            <span>
              Showing stay dates from <strong>{data.startDate}</strong> to <strong>{data.endDate}</strong>
            </span>
            <span className="fst-italic">
              Changes reflect instantly as bookings are confirmed or cancelled.
            </span>
          </Card.Footer>
        </Card>
      )}
    </div>
  );
}

