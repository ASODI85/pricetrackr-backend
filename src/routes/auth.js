import { SignJWT } from 'jose';
import { supabaseAnon } from '../utils/supabase.js';
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev_secret');
export default async function authRoutes(fastify) {
  fastify.post('/magic-link', { schema: { body: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } }, async (req, reply) => {
    const { error } = await supabaseAnon.auth.signInWithOtp({ email: req.body.email, options: { shouldCreateUser: true } });
    if (error) return reply.status(400).send({ error: error.message });
    return { ok: true, message: 'Magic link sent' };
  });
  fastify.post('/verify', { schema: { body: { type: 'object', required: ['access_token'], properties: { access_token: { type: 'string' } } } } }, async (req, reply) => {
    const { data, error } = await supabaseAnon.auth.getUser(req.body.access_token);
    if (error || !data.user) return reply.status(401).send({ error: 'Invalid token' });
    const jwt = await new SignJWT({ sub: data.user.id, email: data.user.email }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret);
    return { token: jwt, userId: data.user.id };
  });
  fastify.get('/me', { preHandler: (await import('../middleware/auth.middleware.js')).verifyToken }, async (req) => ({ userId: req.user.sub, email: req.user.email }));
}