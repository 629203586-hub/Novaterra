export const COUNTRY_IDS = ['japan', 'china', 'france', 'switzerland', 'morocco', 'iceland', 'russia', 'greenland', 'germany', 'usa', 'korea'];
const COOKIE = 'elsewhere_visitor';
const encoder = new TextEncoder();
async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extra
  }});
}
async function visitor(request, db, create = false) {
  const token = (request.headers.get('cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    const id = await digest(token);
    if (await db.prepare('SELECT id FROM like_visitors WHERE id = ?').bind(id).first()) return {id};
  }
  if (!create) return {id: null};
  const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  const id = await digest(secret);
  await db.prepare('INSERT INTO like_visitors (id, created_at) VALUES (?, ?)').bind(id, Date.now()).run();
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return {id, cookie: `${COOKIE}=${secret}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure}`};
}
async function summary(db, id) {
  const result = await db.prepare('SELECT country, COUNT(*) AS count, MAX(CASE WHEN visitor = ? THEN 1 ELSE 0 END) AS liked FROM destination_likes GROUP BY country').bind(id || '').all();
  const places = Object.fromEntries(COUNTRY_IDS.map(country => [country, {count: 0, liked: false}]));
  for (const row of result.results) if (places[row.country]) places[row.country] = {count: Number(row.count), liked: Boolean(row.liked)};
  return {places};
}
export function createSite(assets) {
  return { async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/likes' || url.pathname.startsWith('/api/likes/')) {
        if (!env.DB) return json({error: 'Likes are temporarily unavailable.'}, 503);
        if (request.method === 'GET' && url.pathname === '/api/likes') {
          const user = await visitor(request, env.DB, true);
          return json(await summary(env.DB, user.id), 200, user.cookie ? {'Set-Cookie': user.cookie} : {});
        }
        if (request.method === 'PUT' && url.pathname.startsWith('/api/likes/')) {
          const country = url.pathname.slice('/api/likes/'.length);
          if (!COUNTRY_IDS.includes(country)) return json({error: 'Unknown destination.'}, 404);
          if (request.headers.get('origin') !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site') return json({error: 'Please like from this website.'}, 403);
          if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({error: 'JSON required.'}, 415);
          if (Number(request.headers.get('content-length') || 0) > 128) return json({error: 'Request too large.'}, 413);
          const raw = await request.text();
          if (raw.length > 128) return json({error: 'Request too large.'}, 413);
          let data; try { data = JSON.parse(raw); } catch { return json({error: 'Invalid JSON.'}, 400); }
          if (typeof data?.liked !== 'boolean') return json({error: 'A like state is required.'}, 400);
          // Require an established session before writes. The client serializes
          // session bootstrap across supported tabs; the unique key deduplicates retries.
          const user = await visitor(request, env.DB);
          if (!user.id) return json({error: 'Please enable cookies and try again.', code: 'SESSION_REQUIRED'}, 409);
          const write = data.liked
            ? env.DB.prepare('INSERT INTO destination_likes (country, visitor, created_at) VALUES (?, ?, ?) ON CONFLICT(country, visitor) DO NOTHING').bind(country, user.id, Date.now())
            : env.DB.prepare('DELETE FROM destination_likes WHERE country = ? AND visitor = ?').bind(country, user.id);
          const result = await env.DB.batch([
            write,
            env.DB.prepare('SELECT COUNT(*) AS count, MAX(CASE WHEN visitor = ? THEN 1 ELSE 0 END) AS liked FROM destination_likes WHERE country = ?').bind(user.id, country)
          ]);
          const row = result[1].results[0];
          return json({country, count: Number(row.count), liked: Boolean(row.liked)});
        }
        return json({error: 'Method not allowed.'}, 405, {Allow: url.pathname === '/api/likes' ? 'GET' : 'PUT'});
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', {status: 405, headers: {Allow:'GET, HEAD'}});
      let path; try { path = decodeURIComponent(url.pathname); } catch { return new Response('Not found', {status:404}); }
      if (path === '/') path = '/index.html';
      if (path === '/seoul' || path === '/seoul.html') path = '/korea.html';
      const asset = assets[path] || (!path.split('/').pop().includes('.') ? assets[`${path}.html`] : null);
      if (!asset) return new Response('Not found', {status:404});
      if (request.headers.get('if-none-match') === asset.etag) return new Response(null, {status:304,headers:{ETag:asset.etag,'Cache-Control':'no-cache'}});
      return new Response(request.method === 'HEAD' ? null : asset.text, {headers: {
        'Content-Type': asset.type, 'Cache-Control':'no-cache', ETag:asset.etag, 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'strict-origin-when-cross-origin'
      }});
    } catch (error) {
      console.error('Site request failed', {path:url.pathname, message:error.message});
      return json({error:'Likes are temporarily unavailable. Please try again.'}, 503);
    }
  }};
}
