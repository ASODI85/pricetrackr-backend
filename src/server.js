import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import authRoutes from './routes/auth.js';
import searchRoutes from './routes/search.js';
import affiliateRoutes from './routes/affiliate.js';
import premiumRoutes from './routes/premium.js';
import alertRoutes from './routes/alerts.js';

const fastify = Fastify({ logger: { level: process.env.NODE_ENV === 'production' ? 'warn' : 'info' } });

await fastify.register(cors, {
  origin: (origin, cb) => {
    const allowed = (process.env.ALLOWED_ORIGINS || '').split(',');
    if (!origin || allowed.includes(origin) || origin.startsWith('chrome-extension://')) cb(null, true);
    else cb(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET', 'POST', 'DELETE'],
});

await fastify.register(rateLimit, { global: true, max: 60, timeWindow: '1 minute' });

fastify.get('/health', async () => ({ status: 'ok', version: '1.0.0', ts: new Date().toISOString() }));

await fastify.register(authRoutes,      { prefix: '/auth'      });
await fastify.register(searchRoutes,    { prefix: '/search'    });
await fastify.register(affiliateRoutes, { prefix: '/affiliate' });
await fastify.register(premiumRoutes,   { prefix: '/premium'   });
await fastify.register(alertRoutes,     { prefix: '/alerts'    });

fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.status(error.statusCode || 500).send({ error: error.message || 'Internal Server Error' });
});

const port = parseInt(process.env.PORT || '3000', 10);
try {
  await fastify.listen({ port, host: '0.0.0.0' });
  console.log('PriceTrackr backend running on port ' + port);
} catch (err) { fastify.log.error(err); process.exit(1); }