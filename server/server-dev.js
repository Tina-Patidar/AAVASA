/**
 * Dev server with embedded MongoDB (mongodb-memory-server).
 * Use this when you don't have a local MongoDB installation:
 *   node server-dev.js
 *
 * The in-memory database is seeded automatically on first run.
 * Data is lost when the process exits — perfect for demos.
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { Booking } from './models/Booking.js';
import { RoomInventory } from './models/RoomInventory.js';
import { User } from './models/User.js';
import { seedCatalogue } from './scripts/seedLib.js';

async function start() {
  // Start an embedded MongoDB instance
  console.log('⏳  Starting embedded MongoDB…');
  const mongod = await MongoMemoryServer.create({ instance: { dbName: 'aavasa_dev' } });
  const uri = mongod.getUri('aavasa_dev');
  await mongoose.connect(uri);

  // Ensure indexes exist
  await Promise.all([Booking.init(), RoomInventory.init(), User.init()]);

  // Seed demo data (idempotent)
  console.log('🌱  Seeding demo data…');
  await seedCatalogue();
  console.log('✅  Seed complete');

  const app = createApp();
  const port = env.PORT || 5000;
  app.listen(port, () => {
    console.log(`🏨  AAVASA server ready on http://localhost:${port}`);
    console.log('💡  Using embedded MongoDB (data is not persisted between restarts)');
  });

  // Graceful shutdown
  const shutdown = async () => {
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => { console.error('[server-dev] fatal:', err); process.exit(1); });

