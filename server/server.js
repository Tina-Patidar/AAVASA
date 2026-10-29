import { assertEnv, env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { Booking } from './models/Booking.js';
import { RoomInventory } from './models/RoomInventory.js';

async function start() {
  assertEnv();
  await connectDB(env.MONGODB_URI);
  // Make sure unique indexes (booking reference, inventory per night) exist before serving traffic
  await Promise.all([Booking.init(), RoomInventory.init()]);

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`[server] AAVASA API running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('[server] failed to start:', err.message);
  process.exit(1);
});
