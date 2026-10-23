// Express application configuration: global middleware, route registration, and
// error handling. Process startup lives in server.js.
import express from 'express';
import cors from 'cors';
import { createCorsOptions } from './config/cors.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { notFound } from './middlewares/notFound.js';
import { createErrorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import monitorRoutes from './routes/monitorRoutes.js';
import alertsRoutes from './routes/alertsRoutes.js';

export function createApp(config) {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestLogger);
  app.use(cors(createCorsOptions(config)));
  app.use(express.json({ limit: '100kb' }));

  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/monitor', monitorRoutes);
  app.use('/alerts', alertsRoutes);

  app.use(notFound);
  app.use(createErrorHandler(config));

  return app;
}
