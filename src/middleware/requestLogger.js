const { v4: uuidv4 } = require('uuid');

/**
 * Structured request logger middleware.
 * Attaches a request_id to each request and logs:
 * request_id, method, path, status_code, latency_ms, timestamp
 */
function requestLogger(req, res, next) {
  const requestId = uuidv4();
  const startTime = Date.now();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const latencyMs = Date.now() - startTime;
    const logEntry = {
      request_id: requestId,
      method: req.method,
      path: req.originalUrl,
      status_code: res.statusCode,
      latency_ms: latencyMs,
      timestamp: new Date().toISOString(),
      user_token_scope: req.tokenPayload?.scopes?.join(',') || null,
    };
    console.log(JSON.stringify(logEntry));
  });

  next();
}

module.exports = { requestLogger };
