import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { MongoMemoryServer } from 'mongodb-memory-server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../.mongo-data');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

console.log('[mongodb] Starting embedded MongoDB on port 27017...');

try {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbPath,
      dbName: 'aavasa',
    },
  });

  console.log(`[mongodb] Embedded MongoDB running at ${mongod.getUri()}`);
  console.log('[mongodb] Ready for connections.');

  const shutdown = async () => {
    console.log('\n[mongodb] Stopping embedded MongoDB...');
    await mongod.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (err) {
  console.error('[mongodb] Failed to start embedded MongoDB:', err.message);
  process.exit(1);
}
