import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, bookingPayload, day, seed, signUp, startDb, stopDb } from './helpers.js';
import { Hotel } from '../models/Hotel.js';
import { RoomType } from '../models/RoomType.js';

beforeAll(async () => {
  await startDb();
  await seed();
});
afterAll(stopDb);

describe('hotel listing and filtering', () => {
  it('lists seeded properties with pagination', async () => {
    const res = await request(app).get('/api/hotels?limit=4');
    expect(res.status).toBe(200);
    expect(res.body.hotels).toHaveLength(4);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(8);
    expect(res.body.pagination.pages).toBeGreaterThanOrEqual(2);
  });

  it('is idempotent: seeding twice does not duplicate data', async () => {
    const before = await Hotel.countDocuments();
    const roomsBefore = await RoomType.countDocuments();
    await seed();
    expect(await Hotel.countDocuments()).toBe(before);
    expect(await RoomType.countDocuments()).toBe(roomsBefore);
  });

  it('filters by city, property type and amenities', async () => {
    const jaipur = await request(app).get('/api/hotels?q=jaipur');
    expect(jaipur.body.hotels.length).toBeGreaterThan(0);
    expect(jaipur.body.hotels.every((h) => h.city === 'Jaipur')).toBe(true);

    const resorts = await request(app).get('/api/hotels?propertyType=Resort');
    expect(resorts.body.hotels.every((h) => h.propertyType === 'Resort')).toBe(true);

    const spa = await request(app).get('/api/hotels?amenities=Spa,Swimming%20Pool');
    expect(spa.body.hotels.every((h) => h.amenities.includes('Spa') && h.amenities.includes('Swimming Pool'))).toBe(true);
  });

  it('filters by price range using room prices', async () => {
    const res = await request(app).get('/api/hotels?minPrice=3000&maxPrice=4000');
    expect(res.body.hotels.length).toBeGreaterThan(0);
    expect(res.body.hotels.every((h) => h.fromPrice >= 3000 && h.fromPrice <= 4000)).toBe(true);
  });

  it('sorts by price both ways', async () => {
    const asc = (await request(app).get('/api/hotels?sort=price_asc')).body.hotels.map((h) => h.fromPrice);
    const desc = (await request(app).get('/api/hotels?sort=price_desc')).body.hotels.map((h) => h.fromPrice);
    expect([...asc].sort((a, b) => a - b)).toEqual(asc);
    expect([...desc].sort((a, b) => b - a)).toEqual(desc);
  });

  it('applies guest capacity: a party of 6 only matches rooms that can host it', async () => {
    const res = await request(app).get('/api/hotels?guests=6&rooms=1');
    expect(res.status).toBe(200);
    for (const h of res.body.hotels) expect(h.maxGuests).toBeGreaterThanOrEqual(6);
  });

  it('never claims availability without dates', async () => {
    const res = await request(app).get('/api/hotels');
    expect(res.body.hotels.every((h) => h.availability.checked === false)).toBe(true);
  });

  it('rejects invalid search dates', async () => {
    const res = await request(app).get(`/api/hotels?checkIn=${day(10)}&checkOut=${day(8)}`);
    expect(res.status).toBe(400);
  });

  it('returns hotel details by slug with rooms, similar stays and labelled sample reviews', async () => {
    const list = await request(app).get('/api/hotels?q=Kesari');
    const slug = list.body.hotels[0].slug;
    const res = await request(app).get(`/api/hotels/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.rooms.length).toBeGreaterThanOrEqual(2);
    expect(res.body.similar.length).toBeGreaterThan(0);
    expect(res.body.reviewsAreSample).toBe(true);
    expect(res.body.reviews.every((r) => r.isSample)).toBe(true);
  });
});

describe('room availability', () => {
  it('reports availability per room type and hides fully booked hotels from date searches', async () => {
    const hotel = await Hotel.findOne({ name: 'Upper Lake Retreat' });
    const villa = await RoomType.findOne({ hotel: hotel._id, name: 'Family Villa' }); // 2 rooms
    const { agent } = await signUp();

    const before = await request(app).get(`/api/hotels/${hotel.slug}/availability?checkIn=${day(30)}&checkOut=${day(32)}&rooms=1&guests=2`);
    expect(before.body.rooms.find((r) => r.name === 'Family Villa').availability.availableRooms).toBe(2);

    const res = await agent.post('/api/bookings').send(bookingPayload(hotel._id, villa._id, { checkIn: day(30), checkOut: day(32), rooms: 2, guests: 4 }));
    expect(res.status).toBe(201);

    const after = await request(app).get(`/api/hotels/${hotel.slug}/availability?checkIn=${day(30)}&checkOut=${day(32)}&rooms=1&guests=2`);
    const row = after.body.rooms.find((r) => r.name === 'Family Villa');
    expect(row.availability.availableRooms).toBe(0);
    expect(row.availability.available).toBe(false);

    // Overlapping partial dates are also blocked; non-overlapping dates are still free
    const overlap = await request(app).get(`/api/hotels/${hotel.slug}/availability?checkIn=${day(31)}&checkOut=${day(33)}&rooms=1&guests=2`);
    expect(overlap.body.rooms.find((r) => r.name === 'Family Villa').availability.available).toBe(false);
    const free = await request(app).get(`/api/hotels/${hotel.slug}/availability?checkIn=${day(32)}&checkOut=${day(34)}&rooms=1&guests=2`);
    expect(free.body.rooms.find((r) => r.name === 'Family Villa').availability.available).toBe(true);
  });
});
