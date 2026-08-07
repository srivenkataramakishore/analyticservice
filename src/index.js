require('dotenv').config();
const express = require('express');
const { requestLogger } = require('./middleware/requestLogger');

// Legacy routes
const analyticsRouter = require('./routes/analytics');

// KN-2: New Data Service API routes
const eventsRouter = require('./routes/events');
const reportsRouter = require('./routes/reports');
const healthRouter = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// -------------------------------------------------------
// KN-2: Data Service API  (versioned at /api/v1/analytics)
// -------------------------------------------------------
app.use('/api/v1/analytics/events', eventsRouter);
app.use('/api/v1/analytics/reports', reportsRouter);
app.use('/api/v1/analytics/health', healthRouter);

// -------------------------------------------------------
// Legacy routes (kept for backwards compatibility)
// -------------------------------------------------------
app.use('/analytics', analyticsRouter);

// Legacy health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
});

// Start server only when not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Analytics service running on port ${PORT}`);
  });
}

module.exports = app;
