const redis = require('redis');

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PER_MIN || '1000', 10);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = redis.createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => console.error('Redis error:', err));
    await redisClient.connect();
  }
  return redisClient;
}

/**
 * Redis token-bucket rate limiter.
 * Limits to RATE_LIMIT requests per minute per token (sub claim).
 * Returns 429 with Retry-After header when limit is exceeded.
 */
async function rateLimiter(req, res, next) {
  // Gracefully degrade if Redis is unavailable
  let client;
  try {
    client = await getRedisClient();
  } catch {
    console.warn('Rate limiter: Redis unavailable, skipping rate limit');
    return next();
  }

  const tokenId = req.tokenPayload?.sub || req.ip;
  const key = `rate:${tokenId}`;

  try {
    const current = await client.incr(key);
    if (current === 1) {
      await client.expire(key, 60);
    }

    res.setHeader('X-RateLimit-Limit', RATE_LIMIT);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT - current));

    if (current > RATE_LIMIT) {
      const ttl = await client.ttl(key);
      res.setHeader('Retry-After', ttl);
      return res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: `Rate limit exceeded. Max ${RATE_LIMIT} requests per minute.`,
        },
      });
    }

    next();
  } catch (err) {
    console.error('Rate limiter error:', err);
    next();
  }
}

module.exports = { rateLimiter };
