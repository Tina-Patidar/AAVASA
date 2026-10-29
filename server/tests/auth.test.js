import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, clearDb, signUp, startDb, stopDb } from './helpers.js';
import { User } from '../models/User.js';

beforeAll(startDb);
afterAll(stopDb);

describe('authentication', () => {
  it('registers a user, hashes the password and sets an httpOnly cookie', async () => {
    const { res, creds } = await signUp();
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(creds.email);
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i);

    const stored = await User.findOne({ email: creds.email }).select('+password');
    expect(stored.password).not.toBe(creds.password);
    expect(stored.password).toMatch(/^\$2[aby]\$/); // bcrypt hash
  });

  it('rejects duplicate emails and weak passwords', async () => {
    const { creds } = await signUp();
    const dup = await request(app).post('/api/auth/register').send({ ...creds });
    expect(dup.status).toBe(409);

    const weak = await request(app).post('/api/auth/register').send({ name: 'Weak', email: 'weak@example.com', password: 'short' });
    expect(weak.status).toBe(400);
    expect(weak.body.details.length).toBeGreaterThan(0);
  });

  it('ignores a client-supplied role (no self-promotion to admin)', async () => {
    const { user } = await signUp({ role: 'admin' });
    expect(user.role).toBe('user');
    const stored = await User.findById(user.id);
    expect(stored.role).toBe('user');
  });

  it('logs in with correct credentials and rejects wrong ones with the same message', async () => {
    const { creds } = await signUp();
    const ok = await request(app).post('/api/auth/login').send({ email: creds.email, password: creds.password });
    expect(ok.status).toBe(200);
    const badPw = await request(app).post('/api/auth/login').send({ email: creds.email, password: 'Wrong12345' });
    const badEmail = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'Wrong12345' });
    expect(badPw.status).toBe(401);
    expect(badEmail.status).toBe(401);
    expect(badPw.body.message).toBe(badEmail.body.message);
  });

  it('protects /me and returns the current user when signed in', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    const { agent, creds } = await signUp();
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(creds.email);
  });

  it('logs out by clearing the cookie', async () => {
    const { agent } = await signUp();
    await agent.post('/api/auth/logout').expect(200);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });

  it('updates profile fields but never email or role', async () => {
    const { agent, creds } = await signUp();
    const ok = await agent.patch('/api/auth/me').send({ name: 'Renamed Guest', phone: '9876543210' });
    expect(ok.status).toBe(200);
    expect(ok.body.user.name).toBe('Renamed Guest');
    const bad = await agent.patch('/api/auth/me').send({ role: 'admin', email: 'x@y.com' });
    expect(bad.status).toBe(400); // strict schema rejects unknown keys
    const me = await agent.get('/api/auth/me');
    expect(me.body.user.role).toBe('user');
    expect(me.body.user.email).toBe(creds.email);
  });

  it('changes the password only with the correct current password', async () => {
    const { agent, creds } = await signUp();
    const wrong = await agent.patch('/api/auth/me/password').send({ currentPassword: 'Nope12345', newPassword: 'Another123' });
    expect(wrong.status).toBe(400);
    const ok = await agent.patch('/api/auth/me/password').send({ currentPassword: creds.password, newPassword: 'Another123' });
    expect(ok.status).toBe(200);
    const login = await request(app).post('/api/auth/login').send({ email: creds.email, password: 'Another123' });
    expect(login.status).toBe(200);
  });
});

describe('cleanup', () => {
  it('clears database', async () => {
    await clearDb();
  });
});
