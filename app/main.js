// Lantern router: hash routes, lazy view loading, shot readiness flag.
// views.js is fetched with a literal import() only after the board shell has
// painted, so it stays out of the first-load Totals line.

import { lastFetchedAt } from "./api.js";
import { relativeTime } from "./format.js";

const view = document.getElementById("view");
const fresh = document.getElementById("fresh");

let viewsPromise = null;
function loadViews() {
  if (!viewsPromise) viewsPromise = import("./views.js");
  return viewsPromise;
}

function setShotReady(ready) {
  window.__shotReady = ready;
}

function setTitle(text) {
  document.title = text + " — Lantern · make.fun";
}

function markNav(name) {
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.dataset.nav === name) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

function stampFreshness() {
  const at = lastFetchedAt();
  fresh.textContent = "Freshness: " + (at ? relativeTime(new Date(at).toISOString()) : "—");
}

function showLoading(label) {
  view.innerHTML = '<p class="loading">Loading ' + label + "…</p>";
}

function showError(err) {
  view.innerHTML =
    '<h1>Something went wrong</h1><p class="error">' +
    String(err && err.message ? err.message : err) +
    "</p><p>Check your connection and try again.</p>";
  setShotReady(true);
}

function parseRoute() {
  const hash = location.hash || "#/";
  const parts = hash.slice(2).split("/").filter(Boolean);
  if (parts.length === 0) return { name: "board" };
  if (parts[0] === "bounty" && parts[1]) return { name: "bounty", slug: decodeURIComponent(parts[1]) };
  if (parts[0] === "leaderboard" && parts[1]) return { name: "leaderboard", slug: decodeURIComponent(parts[1]) };
  if (parts[0] === "profile" && parts[1]) return { name: "profile", handle: decodeURIComponent(parts[1]) };
  return { name: "board" };
}

async function route() {
  const r = parseRoute();
  setShotReady(false);
  try {
    if (r.name === "board") {
      markNav("board");
      setTitle("Bounty board");
      // Paint the board shell first (search, filters, empty list), then load
      // the view code — views.js is not part of the first load.
      view.innerHTML =
        '<h1>Live bounties</h1>' +
        '<div class="toolbar" role="search">' +
        '<input type="search" id="q" placeholder="Search bounties…" aria-label="Search bounties" autocomplete="off">' +
        '<select id="status" aria-label="Status filter">' +
        '<option value="all">All statuses</option>' +
        '<option value="open">Open</option>' +
        '<option value="closed">Closed</option>' +
        "</select>" +
        '<select id="sort" aria-label="Sort bounties">' +
        '<option value="pot">Pot: high to low</option>' +
        '<option value="deadline">Deadline: soonest</option>' +
        '<option value="entries">Entries: most</option>' +
        "</select>" +
        "</div>" +
        '<p class="muted small" id="board-count"></p>' +
        '<div id="board-list"><p class="loading">Loading bounties…</p></div>';
      const views = await loadViews();
      await views.renderBoard(view);
      const q = document.getElementById("q");
      if (q) q.focus();
      setShotReady(true);
    } else if (r.name === "bounty") {
      markNav("bounty");
      setTitle(r.slug);
      showLoading("bounty");
      const views = await loadViews();
      await views.renderBounty(view, r.slug);
      setTitle(document.querySelector("#view h1")?.textContent || r.slug);
      setShotReady(true);
    } else if (r.name === "leaderboard") {
      markNav("leaderboard");
      setTitle("Leaderboard · " + r.slug);
      showLoading("leaderboard");
      const views = await loadViews();
      await views.renderLeaderboard(view, r.slug);
      setShotReady(true);
    } else {
      markNav("profile");
      setTitle("@" + r.handle);
      showLoading("profile");
      const views = await loadViews();
      await views.renderProfile(view, r.handle);
      setShotReady(true);
    }
  } catch (err) {
    showError(err);
  }
  stampFreshness();
}

window.addEventListener("hashchange", route);

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const q = document.getElementById("q");
  if (q && document.activeElement === q) {
    q.value = "";
    q.dispatchEvent(new Event("input", { bubbles: true }));
    q.blur();
  }
});

// "/" focuses the board search box.
document.addEventListener("keydown", (e) => {
  if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
  const q = document.getElementById("q");
  const tag = document.activeElement && document.activeElement.tagName;
  if (q && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
    e.preventDefault();
    q.focus();
  }
});

setShotReady(false);
route();
