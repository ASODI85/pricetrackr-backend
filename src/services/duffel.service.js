const DUFFEL_BASE = 'https://api.duffel.com';
const DUFFEL_KEY = process.env.DUFFEL_API_KEY;
function mockFlightPrice(origin, destination, currency) {
  const seed = [...(origin+destination)].reduce((a,c) => a+c.charCodeAt(0), 0);
  return { price: 150 + (seed % 600), currency, provider: 'mock', deepLink: '#' };
}
export async function searchFlight({ origin, destination, departureDate, returnDate, adults = 1, currency = 'USD' }) {
  if (!DUFFEL_KEY || DUFFEL_KEY === 'duffel_test_REPLACE_ME') return mockFlightPrice(origin, destination, currency);
  const slices = [{ origin, destination, departure_date: departureDate }];
  if (returnDate) slices.push({ origin: destination, destination: origin, departure_date: returnDate });
  const res = await fetch(DUFFEL_BASE+'/air/offer_requests', {
    method: 'POST',
    headers: { Authorization: 'Bearer '+DUFFEL_KEY, 'Content-Type': 'application/json', 'Duffel-Version': 'v2', Accept: 'application/json' },
    body: JSON.stringify({ data: { slices, passengers: Array(adults).fill({ type: 'adult' }), cabin_class: 'economy', currency } }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error('Duffel error '+res.status+': '+(e?.errors?.[0]?.message||'unknown')); }
  const { data } = await res.json();
  const offers = data.offers || [];
  if (!offers.length) throw new Error('No flight offers found');
  const c = offers[0];
  return { price: parseFloat(c.total_amount), currency: c.total_currency, provider: 'duffel', deepLink: 'https://duffel.com' };
}