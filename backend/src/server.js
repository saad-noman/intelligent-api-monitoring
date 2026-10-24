// Process entry point: validates configuration, connects to MongoDB, and starts HTTP.
import dns from 'node:dns';
import { loadConfig } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';

async function start() {
  const config = loadConfig();
  if (config.dnsServers.length > 0) dns.setServers(config.dnsServers);
  await connectDatabase(config.mongodbUri);

  const app = createApp(config);
  const server = app.listen(config.port, () => {
    logger.info(`Server listening on port ${config.port} (${config.nodeEnv}).`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down.`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(async (error) => {
  // Only the error name and message are logged; the logger redacts connection-string credentials.
  logger.error(`Startup failed: ${error.name}: ${error.message}`);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
