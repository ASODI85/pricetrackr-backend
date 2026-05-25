import { verifyToken } from '../middleware/auth.middleware.js';
import { supabase } from '../utils/supabase.js';
export default async function premiumRoutes(fastify) {
  fastify.get('/status', { preHandler: verifyToken }, async (req) => {
    const { data } = await supabase.from('users').select('premium_active, premium_expires_at').eq('id', req.user.sub).single();
    if (!data) return { premium: false };
    const active = data.premium_active && (!data.premium_expires_at || new Date(data.premium_expires_at) > new Date());
    return { premium: active, expiresAt: data.premium_expires_at };
  });
  fastify.post('/checkout', { preHandler: verifyToken }, async (req, reply) => {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'REPLACE_ME') return reply.status(503).send({ error: 'Stripe not configured yet - coming in Phase 4' });
    return reply.status(501).send({ error: 'Not implemented yet' });
  });
}