const DUFFEL_BASE = 'https://api.duffel.com';
const DUFFEL_KEY = process.env.DUFFEL_API_KEY;
function mockHotelPrice(name, currency) {
  const seed = [...name].reduce((a,c) => a+c.charCodeAt(0), 0);
  return { price: 80+(seed%400), currency, provider: 'mock' };
}
async function resolveHotelId(name) {
  const r = await fetch(DUFFEL_BASE+'/stays/properties?query='+encodeURIComponent(name)+'&limit=1', { headers: { Authorization: 'Bearer '+DUFFEL_KEY, 'Duffel-Version': 'v2', Accept: 'application/json' } });
  if (!r.ok) return null;
  const { data } = await r.json();
  return data?.[0]?.id || null;
}
export async function searchHotel({ hotelName, hotelId, checkIn, checkOut, currency = 'USD' }) {
  if (!DUFFEL_KEY || DUFFEL_KEY === 'duffel_test_REPLACE_ME') return mockHotelPrice(hotelName||hotelId, currency);
  const pid = hotelId || await resolveHotelId(hotelName);
  if (!pid) throw new Error('Could not resolve hotel ID for: '+hotelName);
  const res = await fetch(DUFFEL_BASE+'/stays/search', { method: 'POST', headers: { Authorization: 'Bearer '+DUFFEL_KEY, 'Content-Type': 'application/json', 'Duffel-Version': 'v2', Accept: 'application/json' }, body: JSON.stringify({ data: { property_id: pid, check_in_date: checkIn, check_out_date: checkOut, guests: [{ type: 'adult' }], currency } }) });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error('Duffel Stays error '+res.status); }
  const { data } = await res.json();
  const rooms = (data?.results?.[0]?.rooms||[]).sort((a,b) => parseFloat(a.total_amount)-parseFloat(b.total_amount));
  if (!rooms.length) throw new Error('No rooms found');
  return { price: parseFloat(rooms[0].total_amount), currency: rooms[0].total_currency||currency, provider: 'duffel' };
}