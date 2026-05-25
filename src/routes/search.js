import { searchFlight } from '../services/duffel.service.js';
import { searchHotel } from '../services/hotels.service.js';
import { cacheGet, cacheSet, flightCacheKey, hotelCacheKey } from '../utils/cache.js';
import { supabase } from '../utils/supabase.js';
import { optionalToken } from '../middleware/auth.middleware.js';
const FLIGHT_TTL = 1800, HOTEL_TTL = 3600;
async function recordPrice(watchlistId, price, currency, userId) {
  try { await supabase.from('price_history').insert({ watchlist_id: watchlistId, price, currency, user_id: userId||null }); } catch(e) { console.warn('[price_history]', e.message); }
}
export default async function searchRoutes(fastify) {
  fastify.post('/flight', { preHandler: optionalToken }, async (req, reply) => {
    const { origin, destination, departureDate, returnDate, adults, currency, watchlistId } = req.body;
    if (!origin||!destination||!departureDate||!currency) return reply.status(400).send({ error: 'Missing required fields' });
    const key = flightCacheKey(origin, destination, departureDate, currency);
    const cached = await cacheGet(key);
    if (cached) return { ...cached, cached: true };
    const result = await searchFlight({ origin, destination, departureDate, returnDate, adults, currency });
    await cacheSet(key, result, FLIGHT_TTL);
    if (watchlistId) await recordPrice(watchlistId, result.price, result.currency, req.user?.sub);
    return result;
  });
  fastify.post('/hotel', { preHandler: optionalToken }, async (req, reply) => {
    const { hotelId, hotelName, checkIn, checkOut, currency, watchlistId } = req.body;
    if (!hotelId && !hotelName) return reply.status(400).send({ error: 'hotelId or hotelName required' });
    if (!checkIn||!checkOut||!currency) return reply.status(400).send({ error: 'Missing required fields' });
    const key = hotelCacheKey(hotelId||hotelName, checkIn, checkOut, currency);
    const cached = await cacheGet(key);
    if (cached) return { ...cached, cached: true };
    const result = await searchHotel({ hotelId, hotelName, checkIn, checkOut, currency });
    await cacheSet(key, result, HOTEL_TTL);
    if (watchlistId) await recordPrice(watchlistId, result.price, result.currency, req.user?.sub);
    return result;
  });
}