const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

const startServer = async () => {
  try {
    // 2. Connect to local MongoDB
    await connectDB();

    // Start Express server
    const server = app.listen(env.PORT, () => {
      console.log(`====================================================`);
      console.log(` PeoplePay360 Backend Foundation Server Started`);
      console.log(` Environment: ${env.NODE_ENV}`);
      console.log(` Port:        ${env.PORT}`);
      console.log(` Health URL:  http://localhost:${env.PORT}/api/v1/health`);
      console.log(`====================================================`);
    });

    // Graceful shutdown handlers
    const shutdown = (signal) => {
      console.log(`\nReceived ${signal}. Shutting down server gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
