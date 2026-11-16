# Lantern — a make.fun frontend

[![make.fun bounty](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/babes18/makefun-frontend-01/rank.svg)](https://make.fun/bounty/makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/babes18/makefun-frontend-01/reward.svg)](https://make.fun/bounty/makefun-frontend-01)

Lantern is a fast, dark, static frontend for [make.fun](https://make.fun): the live
bounty board with search, status filter and pot/deadline/entries sort; a bounty's
page with its live pot, prize split, rewards table, rules and top-10 preview; its
leaderboard with judge win rates; and public profiles. No framework, no webfonts,
no sign-in — it reads only make.fun's public API, and the first load is a shell
plus one small router; the views load after first paint.

## Run it

```sh
node serve.ts        # app/ on http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output dir and writes
`dossier.json` with the vendored make.fun library.

## Layout

- `app/index.html` — shell: header nav, `<main id="view">`, footer
- `app/style.css` — dark slate + amber theme
- `app/main.js` — hash router; lazy-loads the views after first paint
- `app/views.js` — board, bounty, leaderboard, profile
- `app/api.js` — cached fetch: 60 s TTL, ETag revalidation, single-flight
- `app/format.js` — money, time-left, win rate, bytes, escaping
- `screenshots/` — 3 live-data screenshots (see `shots.json`)
- `vendor/makefun-frontend.ts` — the kit's library, unchanged
