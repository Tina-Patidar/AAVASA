import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, bookingPayload, day, seed, signUp, startDb, stopDb } from './helpers.js';
import { Hotel } from '../models/Hotel.js';
import { RoomType } from '../models/RoomType.js';
import { RoomInventory } from '../models/RoomInventory.js';
import { Booking } from '../models/Booking.js';

let jaipur;
let courtyardRoom;
let lotus;
let maharani; // only 1 room exists: perfect for overbooking tests

beforeAll(async () => {
  await startDb();
  await seed();
  jaipur = await Hotel.findOne({ name: 'Kesari Haveli' });
  courtyardRoom = await RoomType.findOne({ hotel: jaipur._id, name: 'Courtyard Room' });
  lotus = await Hotel.findOne({ name: 'The Lotus Courtyard' });
  maharani = await RoomType.findOne({ hotel: lotus._id, name: 'Maharani Suite' });
});
afterAll(stopDb);

describe('booking requires authentication', () => {
  it('rejects anonymous quote, create and list', async () => {
    expect((await request(app).post('/api/bookings/quote').send({})).status).toBe(401);
    expect((await request(app).post('/api/bookings').send({})).status).toBe(401);
    expect((await request(app).get('/api/bookings')).status).toBe(401);
  });
});

describe('pricing and valid booking', () => {
  it('calculates the price breakdown on the server', async () => {
    const { agent } = await signUp();
    const res = await agent.post('/api/bookings/quote').send({ hotelId: String(jaipur._id), roomTypeId: String(courtyardRoom._id), checkIn: day(40), checkOut: day(42), rooms: 1, guests: 2 });
    expect(res.status).toBe(200);
    const p = res.body.quote.pricing;
    expect(p.subtotal).toBe(10400); // 5200 x 2 nights x 1 room
    expect(p.taxes).toBe(1248); // 12%
    expect(p.serviceFee).toBe(312); // 3%
    expect(p.total).toBe(11960);
    expect(res.body.quote.paymentMode).toBe('demo');
  });

  it('creates a confirmed demo booking and ignores client-supplied totals and status', async () => {
    const { agent } = await signUp();
    const res = await agent.post('/api/bookings').send(bookingPayload(jaipur._id, courtyardRoom._id, { checkIn: day(40), checkOut: day(42), total: 1, pricing: { total: 1 }, status: 'completed' }));
    expect(res.status).toBe(201);
    expect(res.body.booking.reference).toMatch(/^AAV-[A-Z0-9]{8}$/);
    expect(res.body.booking.status).toBe('confirmed');
    expect(res.body.booking.pricing.total).toBe(11960);
    expect(res.body.booking.payment.mode).toBe('demo');
    expect(res.body.booking.nights).toBe(2);

    const mine = await agent.get('/api/bookings?group=upcoming');
    expect(mine.body.bookings.map((b) => b.reference)).toContain(res.body.booking.reference);
  });

  it('requires the demo-payment acknowledgement', async () => {
    const { agent } = await signUp();
    const res = await agent.post('/api/bookings').send(bookingPayload(jaipur._id, courtyardRoom._id, { acceptDemoPayment: false }));
    expect(res.status).toBe(400);
  });
});

describe('invalid bookings', () => {
  it('rejects past, reversed and zero-night stays', async () => {
    const { agent } = await signUp();
    const send = (extra) => agent.post('/api/bookings').send(bookingPayload(jaipur._id, courtyardRoom._id, extra));
    expect((await send({ checkIn: day(-2), checkOut: day(1) })).status).toBe(400);
    expect((await send({ checkIn: day(10), checkOut: day(9) })).status).toBe(400);
    expect((await send({ checkIn: day(10), checkOut: day(10) })).status).toBe(400);
    expect((await send({ checkIn: day(10), checkOut: day(60) })).status).toBe(400); // longer than 30 nights
  });

  it('rejects stays that exceed room capacity', async () => {
    const { agent } = await signUp();
    const res = await agent.post('/api/bookings').send(bookingPayload(jaipur._id, courtyardRoom._id, { guests: 5, rooms: 1 }));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/sleeps up to 2/);
  });

  it('rejects an unknown or mismatched room type', async () => {
    const { agent } = await signUp();
    const other = await RoomType.findOne({ hotel: lotus._id });
    const res = await agent.post('/api/bookings').send(bookingPayload(jaipur._id, other._id));
    expect(res.status).toBe(404);
  });
});

describe('overbooking protection', () => {
  it('lets exactly one of several simultaneous requests win the last room', async () => {
    const guests = await Promise.all([signUp(), signUp(), signUp(), signUp()]);
    const results = await Promise.all(
      guests.map(({ agent }) => agent.post('/api/bookings').send(bookingPayload(lotus._id, maharani._id, { checkIn: day(50), checkOut: day(53), rooms: 1, guests: 2 })))
    );
    const statuses = results.map((r) => r.status).sort();
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(3);

    // Inventory counters never exceed the number of physical rooms
    const nights = await RoomInventory.find({ roomType: maharani._id });
    expect(nights.length).toBe(3);
    for (const n of nights) expect(n.booked).toBe(1);
  });

  it('rolls back partially held nights when a later night is full', async () => {
    const a = await signUp();
    const b = await signUp();
    // A books night day(60) only
    expect((await a.agent.post('/api/bookings').send(bookingPayload(lotus._id, maharani._id, { checkIn: day(60), checkOut: day(61) }))).status).toBe(201);
    // B asks for day(59)..day(62): night 60 is full so everything must fail and nothing may leak
    const res = await b.agent.post('/api/bookings').send(bookingPayload(lotus._id, maharani._id, { checkIn: day(59), checkOut: day(62) }));
    expect(res.status).toBe(409);
    const leaked = await RoomInventory.find({ roomType: maharani._id, date: { $in: [new Date(`${day(59)}T00:00:00Z`), new Date(`${day(61)}T00:00:00Z`)] }, booked: { $gt: 0 } });
    expect(leaked).toHaveLength(0);
  });

  it('prevents duplicate submissions with an idempotency key', async () => {
    const { agent } = await signUp();
    const payload = bookingPayload(jaipur._id, courtyardRoom._id, { checkIn: day(70), checkOut: day(71), idempotencyKey: 'unique-key-12345' });
    const first = await agent.post('/api/bookings').send(payload);
    const second = await agent.post('/api/bookings').send(payload);
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.duplicate).toBe(true);
    expect(second.body.booking.reference).toBe(first.body.booking.reference);
    expect(await Booking.countDocuments({ idempotencyKey: 'unique-key-12345' })).toBe(1);
  });
});

describe('ownership and cancellation', () => {
  it("never lets a user read or cancel someone else's booking", async () => {
    const owner = await signUp();
    const intruder = await signUp();
    const created = await owner.agent.post('/api/bookings').send(bookingPayload(jaipur._id, courtyardRoom._id, { checkIn: day(80), checkOut: day(82) }));
    const id = created.body.booking._id;

    expect((await intruder.agent.get(`/api/bookings/${id}`)).status).toBe(404);
    expect((await intruder.agent.patch(`/api/bookings/${id}/cancel`).send({})).status).toBe(404);
    expect((await intruder.agent.get('/api/bookings')).body.bookings).toHaveLength(0);
    expect((await owner.agent.get(`/api/bookings/${id}`)).status).toBe(200);
  });

  it('cancels a booking, releases inventory exactly once and moves it to the cancelled tab', async () => {
    const { agent } = await signUp();
    const payload = bookingPayload(lotus._id, maharani._id, { checkIn: day(90), checkOut: day(92) });
    const created = await agent.post('/api/bookings').send(payload);
    expect(created.status).toBe(201);

    // Fully booked now
    const blocked = await (await signUp()).agent.post('/api/bookings').send(payload);
    expect(blocked.status).toBe(409);

    const cancel = await agent.patch(`/api/bookings/${created.body.booking._id}/cancel`).send({ reason: 'Plans changed' });
    expect(cancel.status).toBe(200);
    expect(cancel.body.booking.status).toBe('cancelled');
    expect(cancel.body.booking.cancellation.reason).toBe('Plans changed');

    const again = await agent.patch(`/api/bookings/${created.body.booking._id}/cancel`).send({});
    expect(again.status).toBe(400);

    const nights = await RoomInventory.find({ roomType: maharani._id, date: { $in: [new Date(`${day(90)}T00:00:00Z`), new Date(`${day(91)}T00:00:00Z`)] } });
    for (const n of nights) expect(n.booked).toBe(0);

    const cancelledTab = await agent.get('/api/bookings?group=cancelled');
    expect(cancelledTab.body.bookings).toHaveLength(1);
    const upcomingTab = await agent.get('/api/bookings?group=upcoming');
    expect(upcomingTab.body.bookings).toHaveLength(0);

    // The room can now be booked by someone else
    const rebook = await (await signUp()).agent.post('/api/bookings').send(payload);
    expect(rebook.status).toBe(201);
  });

  it('does not allow cancelling a stay that has already started', async () => {
    const { agent, user } = await signUp();
    const created = await agent.post('/api/bookings').send(bookingPayload(jaipur._id, courtyardRoom._id, { checkIn: day(100), checkOut: day(101) }));
    // Simulate the stay having started
    await Booking.updateOne({ _id: created.body.booking._id }, { checkIn: new Date(`${day(-1)}T00:00:00Z`), checkOut: new Date(`${day(1)}T00:00:00Z`) });
    const res = await agent.patch(`/api/bookings/${created.body.booking._id}/cancel`).send({});
    expect(res.status).toBe(400);
    expect(user.role).toBe('user');
  });
});
