// Read-only fetch wrapper for make.fun's public API.
// In-memory cache with a 60 s soft TTL, ETag revalidation and single-flight
// dedup so a view re-render never fires a duplicate request.

const API = "https://make.fun/api";
const SOFT_TTL_MS = 60 * 1000;

const cache = new Map(); // path -> { at, etag, data }
const inflight = new Map(); // path -> Promise

function now() {
  return Date.now();
}

export function apiUrl(path) {
  return API + path;
}

export async function apiGet(path) {
  const entry = cache.get(path);
  if (entry && now() - entry.at < SOFT_TTL_MS) return { data: entry.data, fresh: true, fromCache: true };
  if (inflight.has(path)) return inflight.get(path);

  const job = (async () => {
    const headers = {};
    if (entry && entry.etag) headers["If-None-Match"] = entry.etag;
    const res = await fetch(API + path, { headers });
    if (res.status === 304 && entry) {
      entry.at = now();
      return { data: entry.data, fresh: false, fromCache: true };
    }
    if (!res.ok) throw new Error("make.fun API " + res.status + " for " + path);
    const data = await res.json();
    const etag = res.headers.get("ETag");
    cache.set(path, { at: now(), etag: etag || null, data });
    return { data, fresh: true, fromCache: false };
  })();

  inflight.set(path, job);
  try {
    return await job;
  } finally {
    inflight.delete(path);
  }
}

export function boardUrl() {
  return "/competitions";
}

export function bountyUrl(slug) {
  return "/competitions/" + encodeURIComponent(slug);
}

export function leaderboardUrl(slug) {
  return "/competitions/" + encodeURIComponent(slug) + "/leaderboard";
}

export function profileUrl(handle) {
  return "/profiles/" + encodeURIComponent(handle);
}

// Last time any API answer arrived, for the footer's freshness line.
let lastFetchAt = 0;
export function markFetched() {
  lastFetchAt = now();
}
export function lastFetchedAt() {
  return lastFetchAt;
}
