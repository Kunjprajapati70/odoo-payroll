const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

// 5. Helmet security headers
app.use(helmet());

// 4. CORS configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 6. Morgan request logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 7. JSON body parsing & urlencoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 10. Mount API routes under /api/v1
app.use('/api/v1', routes);

// Root greeting endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'PeoplePay360 Backend Foundation',
    status: 'online',
    healthCheck: '/api/v1/health'
  });
});

// 9. 404 Middleware
app.use(notFoundHandler);

// 8. Centralized Error Middleware
app.use(errorHandler);

module.exports = app;
