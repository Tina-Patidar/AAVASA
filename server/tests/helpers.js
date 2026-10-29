import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { RoomInventory } from '../models/RoomInventory.js';
import { seedCatalogue } from '../scripts/seedLib.js';

let mongod;
export const app = createApp();

export async function startDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('aavasa_test'));
  await Promise.all([Booking.init(), RoomInventory.init(), User.init()]);
}

export async function stopDb() {
  await mongoose.disconnect();
  await mongod?.stop();
}

export async function clearDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

export const seed = () => seedCatalogue();

/** YYYY-MM-DD for N days from today (UTC) */
export function day(offset) {
  const t = new Date();
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + offset)).toISOString().slice(0, 10);
}

let counter = 0;
/** Registers a guest through the real API and returns a cookie-carrying agent. */
export async function signUp(overrides = {}) {
  counter += 1;
  const agent = request.agent(app);
  const creds = { name: 'Test Guest', email: `guest${counter}@example.com`, password: 'Secret123', ...overrides };
  const res = await agent.post('/api/auth/register').send(creds);
  return { agent, user: res.body.user, creds, res };
}

/** Admins can only be created directly in the database, exactly like the real create-admin script. */
export async function signInAdmin() {
  counter += 1;
  const email = `admin${counter}@example.com`;
  await User.create({ name: 'Test Admin', email, password: 'AdminPass123', role: 'admin' });
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password: 'AdminPass123' });
  return agent;
}

export async function signInStaff() {
  counter += 1;
  const email = `staff${counter}@example.com`;
  await User.create({ name: 'Test Staff', email, password: 'StaffPass123', role: 'staff' });
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password: 'StaffPass123' });
  return agent;
}

export function bookingPayload(hotelId, roomTypeId, extra = {}) {
  return {
    hotelId: String(hotelId),
    roomTypeId: String(roomTypeId),
    checkIn: day(20),
    checkOut: day(22),
    rooms: 1,
    guests: 2,
    guestDetails: { fullName: 'Test Guest', email: 'guest@example.com', phone: '9999999999' },
    acceptDemoPayment: true,
    ...extra,
  };
}
