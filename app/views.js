// Lantern views: board, bounty, leaderboard, profile — all on live make.fun data.
import { getBounties, getBounty, getLeaderboard, getProfile } from './api.js';
import { esc, money, date, timeLeft, rel, winRate, bytes, cost, plural } from './format.js';

let boardItems = [];
let boardQ = '';
let boardFilter = 'all';
let boardSort = 'pot';

function isOpen(b) { return new Date(b.deadline).getTime() > Date.now(); }
function closingSoon(b) {
  const ms = new Date(b.deadline).getTime() - Date.now();
  return ms > 0 && ms < 86400000;
}
function shown() {
  let list = boardItems.filter((b) => {
    if (boardFilter === 'open') return isOpen(b);
    if (boardFilter === 'soon') return closingSoon(b);
    if (boardFilter === 'ended') return !isOpen(b);
    return true;
  });
  if (boardQ) {
    const q = boardQ.toLowerCase();
    list = list.filter((b) => `${b.title} ${b.slug} ${b.category}`.toLowerCase().includes(q));
  }
  const by = {
    pot: (a, b) => Number(b.potUsd) - Number(a.potUsd),
    deadline: (a, b) => new Date(a.deadline) - new Date(b.deadline),
    entries: (a, b) => Number(b.submissionCount) - Number(a.submissionCount),
  }[boardSort];
  return [...list].sort(by);
}
function card(b) {
  const soon = closingSoon(b);
  return `<article class="card${soon ? ' soon' : ''}">
<a href="#/bounty/${esc(b.slug)}"><h2>${esc(b.title)}</h2></a>
<p class="meta"><b class="pot">${money(b.potUsd)}</b> live pot · ${money(b.rewardAmount)} reward · ${b.submissionCount} ${plural(b.submissionCount, 'entry', 'entries')}</p>
<p class="meta">${esc(b.category)} · fee ${money(b.entryFeeUsd)} · ${soon ? '<span class="soon-tag">⚡ closing soon · </span>' : ''}${timeLeft(b.deadline)} · ends ${date(b.deadline)}</p>
</article>`;
}
function updateList() {
  const list = document.getElementById('list');
  if (!list) return;
  const rows = shown();
  list.innerHTML = rows.length ? rows.map(card).join('') : '<p class="mini">No bounties match.</p>';
  const count = document.getElementById('count');
  if (count) count.textContent = `${rows.length} of ${boardItems.length} bounties`;
}
async function boardPage(view) {
  view.innerHTML = `<h1>Bounty board</h1>
<p class="sub">Live from make.fun — every open bounty, its live pot and time left.</p>
<div class="controls">
<input id="q" type="search" placeholder="Search bounties…" aria-label="Search bounties" value="${esc(boardQ)}">
<select id="f" aria-label="Status filter">
<option value="all"${boardFilter === 'all' ? ' selected' : ''}>All</option>
<option value="open"${boardFilter === 'open' ? ' selected' : ''}>Open</option>
<option value="soon"${boardFilter === 'soon' ? ' selected' : ''}>Closing soon</option>
<option value="ended"${boardFilter === 'ended' ? ' selected' : ''}>Ended</option>
</select>
<select id="s" aria-label="Sort">
<option value="pot"${boardSort === 'pot' ? ' selected' : ''}>Pot: high to low</option>
<option value="deadline"${boardSort === 'deadline' ? ' selected' : ''}>Deadline: soonest</option>
<option value="entries"${boardSort === 'entries' ? ' selected' : ''}>Entries: most first</option>
</select>
</div>
<p class="mini" id="count"></p>
<div id="list"><p class="loading">Loading live bounties…</p></div>`;
  const q = document.getElementById('q');
  q.addEventListener('input', () => { boardQ = q.value; updateList(); });
  document.getElementById('f').addEventListener('change', (e) => { boardFilter = e.target.value; updateList(); });
  document.getElementById('s').addEventListener('change', (e) => { boardSort = e.target.value; updateList(); });
  if (!boardItems.length) boardItems = (await getBounties()).items ?? [];
  updateList();
  q.focus();
}
function splitBars(rewardsNow) {
  const top = (rewardsNow ?? []).slice(0, 3);
  if (!top.length) return '';
  const max = Math.max(...top.map((r) => Number(r.amountUsd)));
  return `<div class="split">${top.map((r) => {
    const w = Math.max(4, Math.round((Number(r.amountUsd) / max) * 100));
    return `<div class="row"><b>${r.place === 1 ? '🥇 1st' : r.place === 2 ? '🥈 2nd' : '🥉 3rd'}</b><div class="bar"><i style="width:${w}%"></i></div><b class="num">${money(r.amountUsd)}</b></div>`;
  }).join('')}</div>`;
}
function rewardsTable(rewardsNow) {
  const rows = (rewardsNow ?? []).slice(0, 10);
  if (!rows.length) return '';
  return `<table><thead><tr><th>Place</th><th class="num">Base</th><th class="num">Fee share</th><th class="num">Total now</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${r.place}</td><td class="num">${money(r.baseUsd)}</td><td class="num">${money(r.feeShareUsd)}</td><td class="num"><b>${money(r.amountUsd)}</b></td></tr>`).join('')}</tbody></table>`;
}
async function bountyPage(view, slug) {
  const b = await getBounty(slug);
  const soon = closingSoon(b);
  const escrow = b.escrowLifecycle ? `Prizes held in on-chain escrow · Solana ${esc(b.escrowLock?.cluster ?? 'mainnet')} · state: ${esc(b.escrowLifecycle.state)}` : 'Prizes held in on-chain escrow';
  let preview = '';
  try {
    const lb = await getLeaderboard(slug);
    const top = (lb.entries ?? []).slice(0, 10);
    if (top.length) preview = `<h2>Top 10 right now</h2>${top.map((e) => `<p class="meta">#${e.rank} <b>${esc(e.handle)}</b> — ${winRate(e.values?.judge)} win rate · ${esc(e.title ?? '')}</p>`).join('')}<p><a href="#/leaderboard/${esc(slug)}">Full leaderboard →</a></p>`;
  } catch { /* preview is a bonus; the bounty page stands without it */ }
  view.innerHTML = `<h1>${esc(b.title)}</h1>
<p class="sub">${esc(b.sponsor?.name ?? '')} · ${esc(b.category)} · ${(b.skills ?? []).map(esc).join(' · ')}</p>
<div class="hero">
<div class="pot">${money(b.potUsd)}</div>
<p class="meta">live pot · ${money(b.rewardAmount)} base reward · ${b.submissionCount} ${plural(b.submissionCount, 'entry', 'entries')} · entry fee ${money(b.entryFeeUsd)}</p>
<p class="meta">${soon ? '<span class="soon-tag">⚡ closing soon · </span>' : ''}${timeLeft(b.deadline)} · ends ${date(b.deadline)}</p>
</div>
<h2>Prize split — top 3</h2>
${splitBars(b.rewardsNow)}
<h2>Rewards</h2>
${rewardsTable(b.rewardsNow)}
<p>${esc(b.summary ?? '')}</p>
<details><summary>Rules</summary><p>${esc(b.rules ?? 'See the bounty page on make.fun.').replace(/\n/g, '<br>')}</p></details>
<p class="meta">Published ${date(b.publishedAt)} · Deadline ${date(b.deadline)} · ${esc(escrow)}</p>
${preview}`;
}
async function leaderboardPage(view, slug) {
  const lb = await getLeaderboard(slug);
  const entries = lb.entries ?? [];
  const comp = lb.competition ?? {};
  const maxWin = Math.max(1, ...entries.map((e) => Number(e.values?.judge ?? 0)));
  view.innerHTML = `<h1>${esc(comp.title ?? slug)} — leaderboard</h1>
<p class="sub">${entries.length} ${plural(entries.length, 'entry', 'entries')} · ranked by judge win rate · tie-break: smaller dossier wins</p>
<table><thead><tr><th>#</th><th>Entry</th><th>Win rate</th><th class="num">Dossier</th><th class="num">Build cost</th><th>Status</th></tr></thead><tbody>${entries.map((e) => {
    const v = e.values ?? {};
    const w = Math.max(2, Math.round((Number(v.judge ?? 0) / maxWin) * 100));
    return `<tr${e.rank <= 3 ? ' class="top3"' : ''}>
<td class="rank">#${e.rank}</td>
<td><b>${esc(e.title ?? e.handle)}</b><br><span class="mini">@${esc(e.handle)}</span></td>
<td><b>${winRate(v.judge)}</b> <span class="mini">${winRate(v.judge_low)}–${winRate(v.judge_high)}</span><div class="bar"><i style="width:${w}%"></i></div></td>
<td class="num">${bytes(v.bytes)}</td>
<td class="num">${e.cost ? cost(e.cost.micro_usd) : '—'}</td>
<td>${esc(e.status ?? '')}</td></tr>`;
  }).join('')}</tbody></table>`;
}
async function profilePage(view, handle) {
  const p = await getProfile(handle);
  const initials = (p.handle ?? handle).slice(0, 2).toUpperCase();
  const avatar = p.image ? `<img src="https://make.fun${esc(p.image)}" alt="">` : esc(initials);
  const r = p.record ?? {};
  const solutions = p.solutions ?? [];
  view.innerHTML = `<div class="prof"><div class="avatar">${avatar}</div><div><h1>@${esc(p.handle ?? handle)}</h1><p class="sub">${esc(p.display_name ?? '')}${p.bio ? ` · ${esc(p.bio)}` : ''} · joined ${rel(p.joined_at)} (${date(p.joined_at)})</p></div></div>
<div class="stats">
<div class="stat"><b>${r.competitions_entered ?? 0}</b><span>entered</span></div>
<div class="stat"><b>${r.competitions_placed ?? 0}</b><span>placed</span></div>
<div class="stat"><b>${r.competitions_won ?? 0}</b><span>won</span></div>
<div class="stat"><b>${money(r.prize_usd ?? 0)}</b><span>prize money</span></div>
</div>
<h2>Solutions (${solutions.length})</h2>
${solutions.length ? solutions.map((s) => {
    const c = s.competition ?? {};
    return `<article class="card"><a href="#/bounty/${esc(c.slug ?? '')}"><h2>${esc(c.title ?? s.title ?? '')}</h2></a>
<p class="meta">${esc(c.category ?? '')} · ${money(c.reward_usd ?? 0)} reward · ${c.status ?? ''} · entered ${rel(s.entered_at)}${s.placement ? ` · placed #${s.placement}` : ''}${s.prize_usd ? ` · won ${money(s.prize_usd)}` : ''}${s.score?.display && s.score.display !== 'n/a' ? ` · score ${esc(s.score.display)}` : ''}</p></article>`;
  }).join('') : '<p class="mini">No solutions yet.</p>'}
${p.wallet?.address ? `<p class="mini">Payout wallet: <a href="${esc(p.wallet.explorer_url ?? '')}">${esc(p.wallet.address.slice(0, 6))}…${esc(p.wallet.address.slice(-4))}</a></p>` : ''}`;
}
/** Route the hash, render, and mark the page ready for a screenshot. */
export async function route(h, view, fresh) {
  const parts = h.split('/').filter(Boolean);
  try {
    if (parts[0] === 'bounty' && parts[1]) {
      document.title = 'Bounty | Lantern';
      await bountyPage(view, decodeURIComponent(parts[1]));
    } else if (parts[0] === 'leaderboard' && parts[1]) {
      document.title = 'Leaderboard | Lantern';
      await leaderboardPage(view, decodeURIComponent(parts[1]));
    } else if (parts[0] === 'profile' && parts[1]) {
      document.title = `@${parts[1]} | Lantern`;
      await profilePage(view, decodeURIComponent(parts[1]));
    } else {
      document.title = 'Lantern — make.fun bounties';
      await boardPage(view);
    }
  } catch (e) {
    view.innerHTML = `<p class="err">Could not load live data (${esc(e.message)}). Check the connection and retry.</p>`;
  }
  if (fresh) fresh.textContent = `Data: make.fun public API · fetched ${new Date().toLocaleTimeString()}`;
  window.__shotReady = true;
}
