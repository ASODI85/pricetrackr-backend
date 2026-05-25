import { jwtVerify } from 'jose';
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev_secret_change_in_prod');
export async function verifyToken(request, reply) {
  const h = request.headers.authorization;
  if (!h?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Missing Authorization header' });
  try { const { payload } = await jwtVerify(h.slice(7), secret); request.user = payload; }
  catch { return reply.status(401).send({ error: 'Invalid or expired token' }); }
}
export async function optionalToken(request) {
  const h = request.headers.authorization;
  if (!h?.startsWith('Bearer ')) return;
  try { const { payload } = await jwtVerify(h.slice(7), secret); request.user = payload; } catch {}
}