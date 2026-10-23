// MongoDB connection management via Mongoose. Connection strings are never logged.
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

// Initial connection failures reject and are reported by the caller; the listeners
// below report problems that occur after a successful connection.
export async function connectDatabase(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  logger.info('MongoDB connected.');

  mongoose.connection.on('error', (error) => logger.error(`MongoDB connection error: ${error.name}: ${error.message}`));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected.'));
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
