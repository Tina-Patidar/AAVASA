import { assertEnv, env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { resetCatalogue, seedCatalogue } from './seedLib.js';

const args = new Set(process.argv.slice(2));

async function run() {
  assertEnv();
  if (args.has('--reset') && env.isProd && !args.has('--force')) {
    throw new Error('Refusing to reset data while NODE_ENV=production. Add --force only if you are certain.');
  }
  await connectDB(env.MONGODB_URI);

  if (args.has('--reset')) {
    const removed = await resetCatalogue();
    console.log('[seed] reset complete:', removed);
  }
  const result = await seedCatalogue();
  console.log(`[seed] done: ${result.hotels} properties and ${result.roomTypes} room types are in the database.`);
  console.log('[seed] Safe to run again: existing demo data is updated, not duplicated.');
}

run()
  .catch((err) => {
    console.error('[seed] failed:', err.message);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
