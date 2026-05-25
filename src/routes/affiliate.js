import { supabase } from '../utils/supabase.js';
import { optionalToken } from '../middleware/auth.middleware.js';
const TP_MARKER = process.env.TRAVELPAYOUTS_MARKER || '';
function buildTrackedUrl(url) {
  if (!TP_MARKER) return url;
  try { const u = new URL(url); u.searchParams.set('marker', TP_MARKER); return u.toString(); } catch { return url; }
}
export default async function affiliateRoutes(fastify) {
  fastify.post('/link', { preHandler: optionalToken }, async (req) => {
    const { destinationUrl, watchlistId } = req.body;
    const trackedUrl = buildTrackedUrl(destinationUrl);
    supabase.from('affiliate_clicks').insert({ user_id: req.user?.sub||null, watchlist_id: watchlistId, destination_url: destinationUrl, tracked_url: trackedUrl, clicked_at: new Date().toISOString() }).then(()=>{}).catch(console.warn);
    return { trackedUrl };
  });
  fastify.get('/redirect', async (req, reply) => {
    const { url, wid } = req.query;
    if (!url) return reply.status(400).send({ error: 'url param required' });
    if (wid) supabase.from('affiliate_clicks').insert({ watchlist_id: wid, destination_url: url, clicked_at: new Date().toISOString() }).then(()=>{}).catch(console.warn);
    return reply.redirect(302, buildTrackedUrl(decodeURIComponent(url)));
  });
}