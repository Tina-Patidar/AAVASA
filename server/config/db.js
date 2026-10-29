import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

export async function connectDB(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[db] connected to MongoDB (${mongoose.connection.name})`);
  }
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
