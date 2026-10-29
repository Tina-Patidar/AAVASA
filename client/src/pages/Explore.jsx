import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { SlidersHorizontal } from 'lucide-react';
import SearchForm from '../components/SearchForm.jsx';
import FilterPanel, { FilterDrawer } from '../components/FilterPanel.jsx';
import HotelCard from '../components/HotelCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import AppPagination from '../components/Pagination.jsx';
import { HotelCardSkeleton } from '../components/Skeletons.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { hotelApi } from '../services/api.js';

const LIST_KEYS = ['propertyType', 'amenities'];
const SORTS = [
  ['recommended', 'Recommended'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['rating_desc', 'Rating'],
];

export default function Explore() {
  useDocumentTitle('Explore Stays');
  const [params, setParams] = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const meta = useFetch(() => hotelApi.meta(), []);

  // The URL is the single source of truth, so a search can be refreshed or shared
  const filters = useMemo(() => {
    const f = Object.fromEntries(params.entries());
    for (const k of LIST_KEYS) f[k] = params.get(k) ? params.get(k).split(',') : [];
    return f;
  }, [params]);

  const apiParams = useMemo(() => {
    const p = {};
    for (const [k, v] of params.entries()) if (v !== '') p[k] = v;
    p.limit = 9;
    return p;
  }, [params]);

  const result = useFetch(() => hotelApi.list(apiParams), [apiParams]);

  const update = useCallback((partial, { resetPage = true } = {}) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(partial)) {
      const empty = v === '' || v == null || (Array.isArray(v) && v.length === 0);
      if (empty) next.delete(k);
      else next.set(k, Array.isArray(v) ? v.join(',') : String(v));
    }
    if (resetPage) next.delete('page');
    setParams(next, { replace: false });
  }, [params, setParams]);

  const clearAll = () => {
    const keep = new URLSearchParams();
    for (const k of ['q', 'checkIn', 'checkOut', 'guests', 'rooms']) if (params.get(k)) keep.set(k, params.get(k));
    setParams(keep);
  };

  const activeCount = ['minPrice', 'maxPrice', 'stars'].filter((k) => filters[k]).length + filters.propertyType.length + filters.amenities.length;
  const page = Number(params.get('page')) || 1;
  const stay = new URLSearchParams();
  for (const k of ['checkIn', 'checkOut', 'guests', 'rooms']) if (params.get(k)) stay.set(k, params.get(k));

  useEffect(() => { document.getElementById('results-top')?.scrollIntoView({ block: 'start' }); }, [page]);

  const onSearch = ({ q, checkIn, checkOut, guests, rooms }) => update({ q, checkIn, checkOut, guests, rooms });
  const panel = <FilterPanel filters={filters} meta={meta.data} onChange={update} onClear={clearAll} activeCount={activeCount} />;
  const total = result.data?.pagination?.total;
  const dateError = result.error && /date|night/i.test(result.error);

  return (
    <div className="container-page py-4 py-md-5">
      <p className="eyebrow">Explore stays</p>
      <h1 className="mt-3 font-serif fs-1">Find the right place to stay</h1>
      <div className="mt-4">
        <SearchForm
          variant="page"
          initial={{
            q: filters.q || '',
            checkIn: filters.checkIn || '',
            checkOut: filters.checkOut || '',
            guests: Number(filters.guests) || 2,
            rooms: Number(filters.rooms) || 1,
          }}
          onSubmit={onSearch}
          submitLabel="Update"
        />
      </div>

      <div id="results-top" className="mt-5">
        <Row className="g-4">
          {/* Sidebar filter — hidden on mobile, shown on lg+ */}
          <Col lg={3} className="d-none d-lg-block" as="aside" aria-label="Filters">
            {panel}
          </Col>

          <Col lg={9} as="section" aria-live="polite">
            {/* Toolbar: result count + sort + mobile filter button */}
            <div className="mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <p className="small text-muted mb-0">
                {result.loading
                  ? 'Searching…'
                  : result.error
                  ? ''
                  : `${total} ${total === 1 ? 'stay' : 'stays'} found${params.get('checkIn') ? ' for your dates' : ''}`}
              </p>
              <div className="d-flex align-items-center gap-3">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="d-lg-none d-inline-flex align-items-center gap-2"
                  onClick={() => setDrawer(true)}
                >
                  <SlidersHorizontal size={15} aria-hidden="true" />
                  Filters{activeCount ? ` (${activeCount})` : ''}
                </Button>
                <Form.Group controlId="sortSelect" className="d-flex align-items-center gap-2">
                  <Form.Label className="mb-0 small text-muted">Sort</Form.Label>
                  <Form.Select
                    size="sm"
                    style={{ width: 'auto' }}
                    value={filters.sort || 'recommended'}
                    onChange={(e) => update({ sort: e.target.value === 'recommended' ? '' : e.target.value })}
                  >
                    {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            {/* Date hint banner */}
            {!params.get('checkIn') && !result.loading && !result.error && (
              <p className="mb-4 rounded-3 px-3 py-2 small text-muted bg-sand">
                Add check-in and check-out dates to see which stays have rooms free. Availability is only shown once dates are chosen.
              </p>
            )}

            {/* Results / loading / empty / error */}
            {result.error ? (
              <ErrorState message={result.error} onRetry={dateError ? clearAll : result.reload} />
            ) : result.loading ? (
              <Row className="g-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Col key={i} sm={6} xl={4}><HotelCardSkeleton /></Col>
                ))}
              </Row>
            ) : result.data.hotels.length === 0 ? (
              <EmptyState
                title="No stays match your search"
                message="Try different dates, fewer filters or a wider price range."
                action={
                  <Button variant="primary" className="btn-primary" onClick={clearAll}>
                    Clear all filters
                  </Button>
                }
              />
            ) : (
              <>
                <Row className="g-4">
                  {result.data.hotels.map((h) => (
                    <Col key={h._id} sm={6} xl={4}>
                      <HotelCard hotel={h} search={stay.toString()} />
                    </Col>
                  ))}
                </Row>
                <AppPagination
                  page={result.data.pagination.page}
                  pages={result.data.pagination.pages}
                  onChange={(p) => update({ page: p }, { resetPage: false })}
                />
              </>
            )}
          </Col>
        </Row>
      </div>

      {/* Mobile filter drawer */}
      <FilterDrawer open={drawer} onClose={() => setDrawer(false)} resultCount={total}>
        {panel}
      </FilterDrawer>
    </div>
  );
}
