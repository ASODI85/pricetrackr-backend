import { verifyToken } from '../middleware/auth.middleware.js';
import { supabase } from '../utils/supabase.js';
import { searchFlight } from '../services/duffel.service.js';
import { searchHotel } from '../services/hotels.service.js';
import { sendPriceDropEmail } from '../services/email.service.js';
const CRON_SECRET = process.env.CRON_SECRET || 'cron_dev_secret';
export default async function alertRoutes(fastify) {
  fastify.post('/check', async (req, reply) => {
    const cronHeader = req.headers['x-cron-secret'];
    const isManual = req.headers.authorization?.startsWith('Bearer ');
    if (!isManual && cronHeader !== CRON_SECRET) return reply.status(401).send({ error: 'Unauthorized' });
    const results = await runPriceChecks();
    return { ok: true, ...results };
  });
  fastify.get('/', { preHandler: verifyToken }, async (req) => {
    const { data } = await supabase.from('watchlists').select('id,label,type,last_price,currency,alert_enabled,alert_threshold_pct').eq('user_id', req.user.sub).eq('alert_enabled', true);
    return { alerts: data || [] };
  });
}
async function runPriceChecks() {
  let checked = 0, alerts = 0;
  const { data: items, error } = await supabase.from('watchlists').select('*').eq('alert_enabled', true);
  if (error || !items?.length) return { checked: 0, alerts: 0 };
  for (const item of items) {
    try {
      const result = item.type === 'flight'
        ? await searchFlight({ origin: item.origin, destination: item.destination, departureDate: item.departure_date, returnDate: item.return_date, adults: item.adults||1, currency: item.currency })
        : await searchHotel({ hotelId: item.hotel_id, hotelName: item.hotel_name, checkIn: item.check_in, checkOut: item.check_out, currency: item.currency });
      checked++;
      await supabase.from('price_history').insert({ watchlist_id: item.id, price: result.price, currency: result.currency, user_id: item.user_id });
      await supabase.from('watchlists').update({ last_price: result.price, last_checked_at: new Date().toISOString() }).eq('id', item.id);
      if (item.last_price && item.alert_enabled) {
        const drop = ((item.last_price - result.price) / item.last_price) * 100;
        if (drop >= (item.alert_threshold_pct || 5)) {
          alerts++;
          if (item.email_alerts_enabled && item.user_email) {
            const fmt = (p,c) => new Intl.NumberFormat('en-US',{style:'currency',currency:c}).format(p);
            await sendPriceDropEmail({ to: item.user_email, label: item.label, oldPrice: fmt(item.last_price,result.currency), newPrice: fmt(result.price,result.currency), dropPct: Math.round(drop) }).catch(console.warn);
          }
        }
      }
    } catch(e) { console.warn('[alerts] Failed for '+item.id+':', e.message); }
  }
  return { checked, alerts };
}