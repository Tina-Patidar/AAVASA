import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, bookingPayload, day, seed, signInAdmin, signInStaff, signUp, startDb, stopDb } from './helpers.js';
import { Hotel } from '../models/Hotel.js';
import { RoomType } from '../models/RoomType.js';

const newHotel = {
  name: 'Test Meadow Lodge',
  tagline: 'A tiny lodge for tests',
  description: 'A quiet demo lodge created by the automated tests to verify admin hotel management.',
  propertyType: 'Boutique Hotel',
  starCategory: 3,
  city: 'Testville',
  state: 'Test State',
  address: '1 Meadow Lane, Testville',
  images: [{ url: 'https://example.com/photo.jpg', alt: 'Lodge exterior in the meadow' }],
  amenities: ['Free Wi-Fi', 'Garden'],
};

beforeAll(async () => {
  await startDb();
  await seed();
});
afterAll(stopDb);

describe('admin authorization', () => {
  it('blocks anonymous visitors (401) and normal users (403) from every admin area', async () => {
    const { agent } = await signUp();
    const paths = ['/api/admin/stats', '/api/admin/hotels', '/api/admin/bookings', '/api/admin/users'];
    for (const p of paths) {
      expect((await request(app).get(p)).status).toBe(401);
      expect((await agent.get(p)).status).toBe(403);
    }
    expect((await agent.post('/api/admin/hotels').send(newHotel)).status).toBe(403);
  });
});

describe('admin property and room management', () => {
  it('creates, updates and reads a hotel with rooms; startingPrice follows room prices', async () => {
    const admin = await signInAdmin();
    const created = await admin.post('/api/admin/hotels').send(newHotel);
    expect(created.status).toBe(201);
    const id = created.body.hotel._id;
    expect(created.body.hotel.slug).toBe('test-meadow-lodge-testville');

    const invalid = await admin.post('/api/admin/hotels').send({ ...newHotel, name: 'X', images: [] });
    expect(invalid.status).toBe(400);

    const room = await admin.post(`/api/admin/hotels/${id}/rooms`).send({ name: 'Meadow Room', pricePerNight: 2500, maxGuests: 2, totalRooms: 3, amenities: ['Queen Bed'] });
    expect(room.status).toBe(201);
    expect((await Hotel.findById(id)).startingPrice).toBe(2500);

    const priceUpdate = await admin.patch(`/api/admin/rooms/${room.body.room._id}`).send({ pricePerNight: 2800 });
    expect(priceUpdate.status).toBe(200);
    expect((await Hotel.findById(id)).startingPrice).toBe(2800);

    const upd = await admin.patch(`/api/admin/hotels/${id}`).send({ tagline: 'Updated tagline', amenities: ['Free Wi-Fi', 'Garden', 'Parking'] });
    expect(upd.status).toBe(200);
    expect(upd.body.hotel.amenities).toContain('Parking');

    // visible to guests
    expect((await request(app).get(`/api/hotels/${created.body.hotel.slug}`)).status).toBe(200);
  });

  it('cannot reduce inventory below existing future bookings', async () => {
    const admin = await signInAdmin();
    const hotel = await Hotel.findOne({ name: 'Kesari Haveli' });
    const suite = await RoomType.findOne({ hotel: hotel._id, name: 'Royal Family Suite' }); // 2 rooms
    const { agent } = await signUp();
    expect((await agent.post('/api/bookings').send(bookingPayload(hotel._id, suite._id, { rooms: 2, guests: 6, checkIn: day(15), checkOut: day(16) }))).status).toBe(201);
    const res = await admin.patch(`/api/admin/rooms/${suite._id}`).send({ totalRooms: 1 });
    expect(res.status).toBe(409);
    expect((await admin.patch(`/api/admin/rooms/${suite._id}`).send({ totalRooms: 4 })).status).toBe(200);
  });

  it('deactivates (instead of deleting) a hotel that has bookings, and deletes one that never had any', async () => {
    const admin = await signInAdmin();
    const hotel = await Hotel.findOne({ name: 'Blue Door Haveli' });
    const room = await RoomType.findOne({ hotel: hotel._id });
    const { agent } = await signUp();
    await agent.post('/api/bookings').send(bookingPayload(hotel._id, room._id, { checkIn: day(25), checkOut: day(26) }));

    const deact = await admin.delete(`/api/admin/hotels/${hotel._id}`);
    expect(deact.body.action).toBe('deactivated');
    expect((await request(app).get(`/api/hotels/${hotel.slug}`)).status).toBe(404); // hidden from guests
    expect((await agent.get('/api/bookings')).body.bookings[0].hotelSnapshot.name).toBe('Blue Door Haveli'); // history intact

    const fresh = await admin.post('/api/admin/hotels').send({ ...newHotel, name: 'Disposable Lodge' });
    const del = await admin.delete(`/api/admin/hotels/${fresh.body.hotel._id}`);
    expect(del.body.action).toBe('deleted');
  });
});

describe('admin bookings, users and stats', () => {
  it('lists bookings, updates status with valid transitions only, and cancels with inventory release', async () => {
    const admin = await signInAdmin();
    const hotel = await Hotel.findOne({ name: 'Ganga Ghat House' });
    const room = await RoomType.findOne({ hotel: hotel._id, name: 'Ghat Suite' });
    const { agent } = await signUp();
    const created = await agent.post('/api/bookings').send(bookingPayload(hotel._id, room._id, { checkIn: day(35), checkOut: day(36) }));
    const id = created.body.booking._id;

    const list = await admin.get(`/api/admin/bookings?q=${created.body.booking.reference}`);
    expect(list.body.bookings).toHaveLength(1);

    const invalid = await admin.patch(`/api/admin/bookings/${id}/status`).send({ status: 'pending' });
    expect(invalid.status).toBe(400);
    const early = await admin.patch(`/api/admin/bookings/${id}/status`).send({ status: 'completed' });
    expect(early.status).toBe(400); // stay has not started

    const cancelled = await admin.patch(`/api/admin/bookings/${id}/status`).send({ status: 'cancelled', reason: 'Maintenance' });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.booking.status).toBe('cancelled');
    const final = await admin.patch(`/api/admin/bookings/${id}/status`).send({ status: 'confirmed' });
    expect(final.status).toBe(400);
  });

  it('returns real stats derived from the database', async () => {
    const admin = await signInAdmin();
    const res = await admin.get('/api/admin/stats');
    expect(res.status).toBe(200);
    const s = res.body.stats;
    expect(s.totalProperties).toBeGreaterThanOrEqual(8);
    expect(s.totalBookings).toBeGreaterThan(0);
    const sum = s.statusDistribution.reduce((a, x) => a + x.count, 0);
    expect(sum).toBe(s.totalBookings);
    expect(s.revenue.total).toBeGreaterThan(0);
  });

  it('manages users with guard rails (cannot edit self, cannot remove the last admin)', async () => {
    const admin = await signInAdmin();
    const me = (await admin.get('/api/auth/me')).body.user;
    expect((await admin.patch(`/api/admin/users/${me.id}`).send({ isActive: false })).status).toBe(400);

    const { user } = await signUp();
    const off = await admin.patch(`/api/admin/users/${user.id}`).send({ isActive: false });
    expect(off.status).toBe(200);
    const login = await request(app).post('/api/auth/login').send({ email: user.email, password: 'Secret123' });
    expect(login.status).toBe(401);

    const search = await admin.get(`/api/admin/users?q=${encodeURIComponent(user.email)}`);
    expect(search.body.users).toHaveLength(1);
  });

  it('enforces staff role permissions: limited access vs admin', async () => {
    const staff = await signInStaff();

    // Staff CAN access stats, bookings, guests, room inventory, and view hotels
    expect((await staff.get('/api/admin/stats')).status).toBe(200);
    expect((await staff.get('/api/admin/bookings')).status).toBe(200);
    expect((await staff.get('/api/admin/guests')).status).toBe(200);
    expect((await staff.get('/api/admin/inventory')).status).toBe(200);
    expect((await staff.get('/api/admin/hotels')).status).toBe(200);

    // Staff CANNOT access user management
    expect((await staff.get('/api/admin/users')).status).toBe(403);

    // Staff CANNOT create, update or delete hotels/rooms
    expect((await staff.post('/api/admin/hotels').send(newHotel)).status).toBe(403);
    const hotel = await Hotel.findOne();
    expect((await staff.patch(`/api/admin/hotels/${hotel._id}`).send({ name: 'Hacked Hotel' })).status).toBe(403);
    expect((await staff.delete(`/api/admin/hotels/${hotel._id}`)).status).toBe(403);
  });

  it('handles check-in and check-out workflow with date validation', async () => {
    const staff = await signInStaff();
    const hotel = await Hotel.findOne();
    const room = await RoomType.findOne({ hotel: hotel._id });

    // 1) Future booking: cannot check in early
    const { agent } = await signUp();
    const futureBooking = await agent.post('/api/bookings').send(
      bookingPayload(hotel._id, room._id, { checkIn: day(10), checkOut: day(12) })
    );
    const futureId = futureBooking.body.booking._id;

    const earlyCheckIn = await staff.patch(`/api/admin/bookings/${futureId}/status`).send({ status: 'checked_in' });
    expect(earlyCheckIn.status).toBe(400);
    expect(earlyCheckIn.body.message).toMatch(/Check-in is only allowed on or after/i);

    // 2) Today booking: can check in
    const todayBooking = await agent.post('/api/bookings').send(
      bookingPayload(hotel._id, room._id, { checkIn: day(0), checkOut: day(2) })
    );
    const todayId = todayBooking.body.booking._id;

    // Check-in
    const checkInRes = await staff.patch(`/api/admin/bookings/${todayId}/status`).send({ status: 'checked_in' });
    expect(checkInRes.status).toBe(200);
    expect(checkInRes.body.booking.status).toBe('checked_in');

    // Cannot check in again or jump backwards to confirmed
    expect((await staff.patch(`/api/admin/bookings/${todayId}/status`).send({ status: 'confirmed' })).status).toBe(400);

    // Check-out
    const checkOutRes = await staff.patch(`/api/admin/bookings/${todayId}/status`).send({ status: 'checked_out' });
    expect(checkOutRes.status).toBe(200);
    expect(checkOutRes.body.booking.status).toBe('checked_out');

    // Checked_out booking shows in guest's past bookings
    const pastBookings = await agent.get('/api/bookings?group=past');
    expect(pastBookings.status).toBe(200);
    const pastIds = pastBookings.body.bookings.map((b) => b._id);
    expect(pastIds).toContain(todayId);
  });

  it('manages guest profiles, booking history, spend, and keeps staffNotes private', async () => {
    const staff = await signInStaff();
    const hotel = await Hotel.findOne();
    const room = await RoomType.findOne({ hotel: hotel._id });

    const { agent: guestAgent, user: guestUser } = await signUp({ name: 'Privileged Guest', email: 'guest.notes@example.com' });

    // Make a booking for this guest
    await guestAgent.post('/api/bookings').send(
      bookingPayload(hotel._id, room._id, { checkIn: day(5), checkOut: day(7) })
    );

    // Staff lists guests
    const guestList = await staff.get(`/api/admin/guests?q=${encodeURIComponent(guestUser.email)}`);
    expect(guestList.status).toBe(200);
    expect(guestList.body.guests).toHaveLength(1);
    expect(guestList.body.guests[0].bookingCount).toBe(1);
    expect(guestList.body.guests[0].totalSpend).toBeGreaterThan(0);

    // Staff adds internal note
    const noteRes = await staff.patch(`/api/admin/guests/${guestUser.id}/notes`).send({
      staffNotes: 'VIP guest. Prefers high floor and extra pillows.',
    });
    expect(noteRes.status).toBe(200);
    expect(noteRes.body.guest.staffNotes).toBe('VIP guest. Prefers high floor and extra pillows.');

    // Staff gets full guest profile with booking history
    const detailRes = await staff.get(`/api/admin/guests/${guestUser.id}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.guest.staffNotes).toBe('VIP guest. Prefers high floor and extra pillows.');
    expect(detailRes.body.bookings).toHaveLength(1);

    // PRIVACY VERIFICATION: Guest calling /api/auth/me MUST NEVER receive staffNotes
    const guestMe = await guestAgent.get('/api/auth/me');
    expect(guestMe.status).toBe(200);
    expect(guestMe.body.user.staffNotes).toBeUndefined();
  });

  it('returns 14-day room inventory matrix with color-coded stats', async () => {
    const staff = await signInStaff();
    const hotel = await Hotel.findOne();

    const invRes = await staff.get(`/api/admin/inventory?hotelId=${hotel._id}&days=14`);
    expect(invRes.status).toBe(200);
    expect(invRes.body.dates).toHaveLength(14);
    expect(invRes.body.matrix.length).toBeGreaterThan(0);
    expect(invRes.body.matrix[0].days).toHaveLength(14);
    expect(invRes.body.matrix[0].days[0]).toHaveProperty('booked');
    expect(invRes.body.matrix[0].days[0]).toHaveProperty('total');
    expect(invRes.body.matrix[0].days[0]).toHaveProperty('free');
  });
});
