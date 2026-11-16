// The four surfaces: board, bounty, leaderboard, profile.
// All data comes from make.fun's public API via api.js; all text is escaped.

import { apiGet, markFetched, boardUrl, bountyUrl, leaderboardUrl, profileUrl } from "./api.js";
import {
  moneyUsd, moneyShort, timeLeft, relativeTime, dateShort,
  winRate, winInterval, bytes, buildCost, escapeHtml, countLabel,
} from "./format.js";

function isOpen(b) {
  if (!b || !b.deadline) return false;
  if (b.acceptingSubmissions === false) return false;
  return new Date(b.deadline).getTime() > Date.now();
}

function potOf(b) {
  const v = Number(b.potUsd ?? b.rewardAmount);
  return Number.isFinite(v) ? v : 0;
}

function feeOf(b) {
  const v = Number(b.entryFeeUsd);
  return Number.isFinite(v) && v > 0 ? moneyUsd(v) : "Free";
}

function bountyCard(b) {
  const open = isOpen(b);
  return (
    '<article class="card">' +
    '<h2><a href="#/bounty/' + encodeURIComponent(b.slug) + '">' + escapeHtml(b.title) + "</a></h2>" +
    '<div class="row"><span class="pot">' + moneyUsd(potOf(b)) + ' pot</span>' +
    '<span>' + escapeHtml(feeOf(b)) + " entry</span>" +
    '<span>' + escapeHtml(timeLeft(b.deadline)) + "</span>" +
    '<span>' + countLabel(b.submissionCount || 0, "entry", "entries") + "</span>" +
    '<span class="pill ' + (open ? "open" : "closed") + '">' + (open ? "Open" : "Closed") + "</span></div>" +
    (b.summary ? '<p class="muted">' + escapeHtml(b.summary) + "</p>" : "") +
    '<p class="small"><a href="#/leaderboard/' + encodeURIComponent(b.slug) + '">Leaderboard</a> · ' +
    escapeHtml(b.category || "") + "</p>" +
    "</article>"
  );
}

async function fetchBoard() {
  const all = [];
  let path = boardUrl();
  for (let page = 0; page < 4 && path; page++) {
    const { data } = await apiGet(path);
    if (Array.isArray(data.items)) all.push(...data.items);
    path = data.next_cursor ? boardUrl() + "?cursor=" + encodeURIComponent(data.next_cursor) : null;
  }
  markFetched();
  return all;
}

export async function renderBoard(root) {
  const list = root.querySelector("#board-list");
  const count = root.querySelector("#board-count");
  const q = root.querySelector("#q");
  const statusSel = root.querySelector("#status");
  const sortSel = root.querySelector("#sort");

  let items = [];
  try {
    items = await fetchBoard();
  } catch (err) {
    list.innerHTML = '<p class="error">Could not load the board: ' + escapeHtml(err.message) + "</p>";
    return;
  }

  function apply() {
    const needle = (q.value || "").trim().toLowerCase();
    const status = statusSel.value;
    const sort = sortSel.value;
    let shown = items.filter((b) => {
      if (status === "open" && !isOpen(b)) return false;
      if (status === "closed" && isOpen(b)) return false;
      if (!needle) return true;
      const hay = [b.title, b.slug, b.category, b.sponsor && b.sponsor.name, b.summary].join(" ").toLowerCase();
      return hay.includes(needle);
    });
    if (sort === "pot") shown.sort((a, b) => potOf(b) - potOf(a));
    else if (sort === "deadline") shown.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    else shown.sort((a, b) => (b.submissionCount || 0) - (a.submissionCount || 0));
    count.textContent = shown.length + " of " + items.length + " bounties";
    list.innerHTML = shown.length
      ? shown.map(bountyCard).join("")
      : '<p class="muted">No bounties match. Clear the search or change the filter.</p>';
  }

  q.addEventListener("input", apply);
  statusSel.addEventListener("change", apply);
  sortSel.addEventListener("change", apply);
  apply();
}

function paragraphs(text) {
  return String(text || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => "<p>" + escapeHtml(p).replace(/\n/g, "<br>") + "</p>")
    .join("");
}

export async function renderBounty(root, slug) {
  const [{ data: b }, lb] = await Promise.all([
    apiGet(bountyUrl(slug)),
    apiGet(leaderboardUrl(slug)).catch(() => null),
  ]);
  markFetched();
  const open = isOpen(b);
  const rewards = Array.isArray(b.rewardsNow) && b.rewardsNow.length ? b.rewardsNow : b.rewards;
  const rows = (rewards || []).map((r) => {
    const place = r.place ?? r.position ?? "?";
    const amount = r.amountUsd ?? r.amount_usd ?? r.baseUsd;
    return (
      "<tr><td>" + escapeHtml(String(place)) + "</td>" +
      "<td class=\"num\">" + moneyUsd(amount) + "</td>" +
      (r.feeShareUsd ? "<td class=\"num\">+" + moneyUsd(r.feeShareUsd) + " fees</td>" : "<td></td>") +
      "<td>" + escapeHtml(r.title || "") + "</td></tr>"
    );
  }).join("");

  const top = lb && Array.isArray(lb.data.entries) ? lb.data.entries.slice(0, 10) : [];
  const preview = top.map((e) =>
    "<tr><td>" + escapeHtml(String(e.rank)) + "</td>" +
    "<td>" + escapeHtml(e.title || "") + "</td>" +
    '<td><a href="#/profile/' + encodeURIComponent(e.handle) + '">' + escapeHtml(e.handle) + "</a></td>" +
    "<td class=\"num\">" + winRate(e.values && e.values.judge) + "</td></tr>"
  ).join("");

  root.innerHTML =
    '<p><a href="#/">← Board</a></p>' +
    "<h1>" + escapeHtml(b.title) + "</h1>" +
    '<p class="row"><span class="pill ' + (open ? "open" : "closed") + '">' + (open ? "Open" : "Closed") + "</span>" +
    "<span>" + escapeHtml(b.category || "") + "</span>" +
    "<span>" + escapeHtml(b.sponsor && b.sponsor.name ? "by " + b.sponsor.name : "") + "</span></p>" +
    '<div class="card"><div class="row"><span class="pot">Live pot: ' + moneyUsd(potOf(b)) + "</span>" +
    "<span>Entry fee: " + escapeHtml(feeOf(b)) + "</span>" +
    "<span>" + escapeHtml(timeLeft(b.deadline)) + "</span>" +
    "<span>" + countLabel(b.submissionCount || 0, "entry", "entries") + "</span></div>" +
    "<p class=\"small muted\">Escrow: every $0.50 entry fee paid joins the pot" +
    (b.entryFeesUsd ? " — " + moneyUsd(b.entryFeesUsd) + " in fees from " + (b.entryFeePayers || 0) + " payers so far." : ".") +
    "</p></div>" +
    (b.summary ? "<p>" + escapeHtml(b.summary) + "</p>" : "") +
    "<h2>Rewards</h2>" +
    (rows
      ? '<table><thead><tr><th>Place</th><th class="num">Prize</th><th class="num">Fee share</th><th>Title</th></tr></thead><tbody>' + rows + "</tbody></table>"
      : '<p class="muted">No rewards table published yet.</p>') +
    '<p class="small"><a href="#/leaderboard/' + encodeURIComponent(slug) + '">Full leaderboard →</a></p>' +
    "<h2>Dates</h2>" +
    "<p>Deadline: " + escapeHtml(dateShort(b.deadline)) + " (" + escapeHtml(timeLeft(b.deadline)) + ")<br>" +
    "Published: " + escapeHtml(dateShort(b.publishedAt)) +
    (b.opensAt ? "<br>Opens: " + escapeHtml(dateShort(b.opensAt)) : "") + "</p>" +
    (b.rules
      ? "<details><summary>Rules</summary><pre class=\"rules\">" + escapeHtml(typeof b.rules === "string" ? b.rules : JSON.stringify(b.rules, null, 2)) + "</pre></details>"
      : "") +
    "<h2>Description</h2>" +
    (paragraphs(b.description) || '<p class="muted">No description.</p>') +
    (preview
      ? "<h2>Top 10 so far</h2><table><thead><tr><th>#</th><th>Entry</th><th>Entrant</th><th class=\"num\">Win rate</th></tr></thead><tbody>" + preview + "</tbody></table>"
      : "");
}

export async function renderLeaderboard(root, slug) {
  const [{ data: comp }, { data: lb }] = await Promise.all([
    apiGet(bountyUrl(slug)),
    apiGet(leaderboardUrl(slug)),
  ]);
  markFetched();
  const entries = Array.isArray(lb.entries) ? lb.entries : [];
  const rows = entries.map((e) => {
    const v = e.values || {};
    const cost = e.cost && e.cost.micro_usd;
    return (
      "<tr><td>" + escapeHtml(String(e.rank)) + "</td>" +
      "<td>" + escapeHtml(e.title || "") + "</td>" +
      '<td><a href="#/profile/' + encodeURIComponent(e.handle) + '">' + escapeHtml(e.handle) + "</a></td>" +
      '<td class="num">' + winRate(v.judge) +
      '<br><span class="muted small">' + winInterval(e.interval && e.interval.low, e.interval && e.interval.high) + "</span></td>" +
      '<td class="num">' + bytes(v.bytes) + "</td>" +
      '<td class="num">' + buildCost(cost) + "</td>" +
      "<td>" + escapeHtml(e.status || "") + "</td></tr>"
    );
  }).join("");

  root.innerHTML =
    '<p><a href="#/bounty/' + encodeURIComponent(slug) + '">← Bounty</a></p>' +
    "<h1>Leaderboard</h1>" +
    '<p class="muted">' + escapeHtml(comp.title || slug) + " · " + entries.length + " ranked entries · judge win rate with 90% interval</p>" +
    (rows
      ? '<table><thead><tr><th>#</th><th>Entry</th><th>Entrant</th><th class="num">Win rate</th><th class="num">Dossier</th><th class="num">Build cost</th><th>Status</th></tr></thead><tbody>' + rows + "</tbody></table>"
      : '<p class="muted">No leaderboard entries yet.</p>');
}

function initials(handle) {
  return (handle || "?").slice(0, 2).toUpperCase();
}

export async function renderProfile(root, handle) {
  const { data: p } = await apiGet(profileUrl(handle));
  markFetched();
  const rec = p.record || {};
  const sols = Array.isArray(p.solutions) ? p.solutions : [];
  const img = p.image || p.avatar || null;

  const cards = sols.map((s) => {
    const c = s.competition || {};
    return (
      '<article class="card"><h3><a href="#/bounty/' + encodeURIComponent(c.slug || "") + '">' + escapeHtml(c.title || s.title || "") + "</a></h3>" +
      "<p class=\"small muted\">" + escapeHtml(s.title || "") +
      (s.placement ? " · placed #" + escapeHtml(String(s.placement)) : "") +
      (s.prize_usd ? " · won " + moneyUsd(s.prize_usd) : "") +
      (s.entered_at ? " · entered " + escapeHtml(relativeTime(s.entered_at)) : "") +
      "</p></article>"
    );
  }).join("");

  root.innerHTML =
    '<div class="profile-head"><span class="avatar" id="avatar">' + escapeHtml(initials(p.handle)) + "</span>" +
    "<div><h1>@" + escapeHtml(p.handle) + "</h1>" +
    (p.display_name ? "<p>" + escapeHtml(p.display_name) + "</p>" : "") +
    (p.bio ? "<p>" + escapeHtml(p.bio) + "</p>" : "") +
    '<p class="muted small">Joined ' + escapeHtml(dateShort(p.joined_at)) +
    (p.github_login ? " · GitHub @" + escapeHtml(p.github_login) : "") + "</p></div></div>" +
    '<div class="stat-grid">' +
    '<span class="stat"><b>' + escapeHtml(String(rec.competitions_entered ?? 0)) + "</b><span>entered</span></span>" +
    '<span class="stat"><b>' + escapeHtml(String(rec.competitions_won ?? 0)) + "</b><span>won</span></span>" +
    '<span class="stat"><b>' + escapeHtml(String(rec.competitions_placed ?? 0)) + "</b><span>placed</span></span>" +
    '<span class="stat"><b>' + moneyUsd(rec.prize_usd ?? 0) + "</b><span>prizes</span></span>" +
    "</div>" +
    "<h2>Solutions (" + sols.length + ")</h2>" +
    (cards || '<p class="muted">No public solutions yet.</p>');

  if (img) {
    const el = document.createElement("img");
    el.crossOrigin = "anonymous";
    el.alt = "@" + p.handle + " avatar";
    el.src = img.startsWith("http") ? img : "https://make.fun" + img;
    el.addEventListener("error", () => el.remove());
    document.getElementById("avatar").appendChild(el);
  }
}
