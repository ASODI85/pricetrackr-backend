const USE_UPSTASH = !!process.env.UPSTASH_REDIS_REST_URL;
const memCache = new Map();
async function memGet(key) { const e = memCache.get(key); if (!e) return null; if (Date.now() > e.expiresAt) { memCache.delete(key); return null; } return e.value; }
async function memSet(key, value, ttl) { memCache.set(key, { value, expiresAt: Date.now() + ttl * 1000 }); }
async function upstashGet(key) { const r = await fetch(process.env.UPSTASH_REDIS_REST_URL+'/get/'+encodeURIComponent(key), { headers: { Authorization: 'Bearer '+process.env.UPSTASH_REDIS_REST_TOKEN } }); const d = await r.json(); return d.result ? JSON.parse(d.result) : null; }
async function upstashSet(key, value, ttl) { await fetch(process.env.UPSTASH_REDIS_REST_URL+'/set/'+encodeURIComponent(key), { method: 'POST', headers: { Authorization: 'Bearer '+process.env.UPSTASH_REDIS_REST_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify([JSON.stringify(value), 'EX', ttl]) }); }
export async function cacheGet(key) { try { return USE_UPSTASH ? upstashGet(key) : memGet(key); } catch { return null; } }
export async function cacheSet(key, value, ttl = 3600) { try { USE_UPSTASH ? upstashSet(key, value, ttl) : memSet(key, value, ttl); } catch {} }
export const flightCacheKey = (o,d,dt,c) => 'flight:'+[o,d,dt,c].join(':').toLowerCase();
export const hotelCacheKey  = (h,ci,co,c) => 'hotel:'+[h,ci,co,c].join(':').toLowerCase();