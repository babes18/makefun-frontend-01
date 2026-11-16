// Small helpers for showing API values.
/** Text made safe to put inside HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
/** A dollar amount ('1000.00' or 0.5) as '$1,000' or '$0.50'. */
export function money(value) {
  const n = Number(value);
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });
}
/** A deadline as a date in UTC. */
export function date(iso) {
  return `${new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC`;
}
/** The time until a deadline: '2d 4h left', '35m left', or 'ended'. */
export function timeLeft(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'ended';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}
/** A past time as '5m ago', '3h ago', '2d ago'. */
export function rel(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
/** A judge win rate in micro units (950587) as '95.1%'. */
export function winRate(micro) {
  return `${(Number(micro) / 10000).toFixed(1)}%`;
}
/** A byte count as '660,778 B', '12.4 KiB' or '1.23 MiB'. */
export function bytes(n) {
  n = Number(n);
  if (n < 1024) return `${n.toLocaleString('en-US')} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KiB`;
  return `${(n / 1048576).toFixed(2)} MiB`;
}
/** A build cost in micro USD as '$7.81'. */
export function cost(microUsd) {
  return money(Number(microUsd) / 1000000);
}
/** The right word for a count: plural(1, 'entry', 'entries') is 'entry'. */
export function plural(n, one, many) {
  return n === 1 ? one : many;
}
