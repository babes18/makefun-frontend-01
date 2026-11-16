# makefun-frontend-01

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/babes18/makefun-frontend-01/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/babes18/makefun-frontend-01/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

Lantern is a static, no-framework frontend for [make.fun](https://make.fun)
that reads only make.fun's public API. Dark slate + amber, system fonts,
single column under 720px, keyboard friendly (`/` focuses search, `Esc` clears it).

## Surfaces

- **Board** (`#/`): live bounties with live pot, entry fee, time left and
  entries — search, status filter, and pot / deadline / entries sort
  (pot high-to-low by default). Openness is decided by the deadline, not the
  status field, since a bounty past its deadline can still read "open".
- **Bounty** (`#/bounty/<slug>`): live pot above the description, rewards
  table with fee shares, entry fee, escrow line, dates, rules in a
  `<details>`, and a top-10 leaderboard preview.
- **Leaderboard** (`#/leaderboard/<slug>`): rank, entry, entrant, judge win
  rate with its 90% interval, dossier size, build cost and status.
- **Profile** (`#/profile/<handle>`): avatar, record, and solutions linking
  back to their bounties.

## Performance

- First load is three tiny files: `index.html`, `style.css`, `main.js`.
  `views.js` loads afterwards with a literal `import()`, after the board
  shell paints.
- API answers are cached in memory (60 s soft TTL), revalidated with
  `ETag` / `If-None-Match`, and de-duplicated while in flight, so a
  re-render never fires a duplicate request.
- No build step, no webfonts, no third-party code at runtime.

## Run it

```sh
node serve.ts            # http://localhost:8080
node serve.ts --port 9000
```

## Hand in

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts   # writes out/app, out/screenshots, out/dossier.json
```

## License

MIT — see [LICENSE](LICENSE).

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
