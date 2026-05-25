const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'alerts@pricetrackr.app';
export async function sendPriceDropEmail({ to, label, oldPrice, newPrice, dropPct }) {
  if (!RESEND_KEY || RESEND_KEY === 'REPLACE_ME') { console.log('[email mock] Alert to '+to+': '+label+' dropped '+dropPct+'%'); return; }
  await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer '+RESEND_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: FROM, to: [to], subject: 'Price drop: '+label+' is now '+newPrice, html: '<h2>Price Drop: '+label+'</h2><p>Was: '+oldPrice+'</p><p>Now: <strong>'+newPrice+'</strong> (down '+dropPct+'%)</p>' }) });
}