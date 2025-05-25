// src/server.ts - Add back database and Cloudinary connections
import { config } from './config/index';
import { connectDB } from './config/database';
import { testCloudinaryConnection } from './config/cloudinary';
import { logger } from './utils/logger';
import app from './app';

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDB();
    
    // Test Cloudinary connection
    await testCloudinaryConnection();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`📱 API Documentation: http://localhost:${config.port}/api/v1`);
      logger.info(`🔐 Authentication endpoints ready at: http://localhost:${config.port}/api/v1/auth`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
        name: err.name,
        message: err.message,
      });
      server.close(() => {
        process.exit(1);
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        logger.info('💥 Process terminated!');
      });
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();