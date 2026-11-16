// make.fun public API, read-only: in-memory cache (60 s soft TTL), ETag
// revalidation with If-None-Match (304 keeps the cached body), single-flight dedup.
const API = 'https://make.fun/api';
const cache = new Map();
const inflight = new Map();
async function get(path) {
  const url = API + path;
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < 60000) return hit.data;
  if (inflight.has(url)) return inflight.get(url);
  const p = (async () => {
    const headers = {};
    if (hit && hit.etag) headers['If-None-Match'] = hit.etag;
    const res = await fetch(url, { headers });
    if (res.status === 304 && hit) { hit.at = Date.now(); return hit.data; }
    const data = await res.json();
    cache.set(url, { at: Date.now(), etag: res.headers.get('ETag'), data });
    return data;
  })();
  inflight.set(url, p);
  try { return await p; } finally { inflight.delete(url); }
}
/** The open bounties: { items: [...] }. */
export const getBounties = () => get('/competitions?status=open&activity=times');
/** One bounty, by slug. */
export const getBounty = (slug) => get(`/competitions/${encodeURIComponent(slug)}`);
/** A bounty's leaderboard: { entries: [...] }. */
export const getLeaderboard = (slug) => get(`/competitions/${encodeURIComponent(slug)}/leaderboard`);
/** A public profile, by handle. */
export const getProfile = (handle) => get(`/profiles/${encodeURIComponent(handle)}`);
