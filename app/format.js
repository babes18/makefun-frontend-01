// Small pure formatters shared by every view. No network, no DOM.

export function moneyUsd(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function moneyShort(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) return "$" + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k";
  return moneyUsd(n);
}

export function timeLeft(deadline) {
  const end = new Date(deadline).getTime();
  if (!Number.isFinite(end)) return "—";
  const ms = end - Date.now();
  if (ms <= 0) return "closed";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return d + "d " + h + "h left";
  if (h > 0) return h + "h " + m + "m left";
  return m + "m left";
}

export function relativeTime(iso) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.floor(h / 24);
  if (d < 30) return d + "d ago";
  return new Date(t).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function dateShort(iso) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function winRate(micro) {
  const n = Number(micro);
  if (!Number.isFinite(n)) return "—";
  return (n / 10000).toFixed(2) + "%";
}

export function winInterval(lowMicro, highMicro) {
  return winRate(lowMicro) + " – " + winRate(highMicro);
}

export function bytes(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  if (v >= 1048576) return (v / 1048576).toFixed(1) + " MB";
  if (v >= 1024) return (v / 1024).toFixed(1) + " KB";
  return v + " B";
}

export function buildCost(microUsd) {
  const n = Number(microUsd);
  if (!Number.isFinite(n)) return "—";
  return "$" + (n / 1000000).toFixed(2);
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function plural(n, one, many) {
  return Number(n) === 1 ? one : many;
}

export function countLabel(n, one, many) {
  return Number(n).toLocaleString("en-US") + " " + plural(n, one, many);
}
