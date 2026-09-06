# dsh-listen-npm

<p align="center">
  <img src="assets/logo.svg" alt="dsh-listen-npm logo" width="72" />
</p>

**dsh-listen-npm** is an npm package monitor plugin for DeepSeek Harness (DSH).
Query any npm package's full info — with **daily install counts** highlighted — and
watch your own packages for version / download changes.

- **Full package info**: latest version, dist-tags, description, license, author,
  maintainers, links, publish times, versions, dependencies, README excerpt
- **Daily install counts**: day / 7-day / 30-day / year download stats with a
  30-day daily chart (daily granularity comes straight from the official
  `api.npmjs.org/downloads/range` API)
- **Watch list**: add packages to monitor; the plugin polls on a configurable
  interval, records snapshots, flags new versions (footer badge), and shows
  download trends
- **Model tools**: `dsh_npm_info`, `dsh_npm_downloads`, `dsh_npm_watch`
- **Bilingual UI** (zh/en), follows the host language

[中文文档](README.zh.md)

## Preview

A resident **npm Monitor** button sits in the sidebar footer (right above the
settings area) with capsules for the watch count and new-version alerts. The
modal has three tabs: **Query** (search + full detail), **Watch**, **History**.

## Features

- **Query tab** — type a package name (or paste an npmjs.com link): debounced
  suggestions from the registry search API, full detail on Enter / click:
  - Download stats card: **yesterday / last 7 days / last 30 days / last year**
    (yesterday is the hero stat) plus a 30-day daily bar chart with peak,
    average line, and per-bar tooltips
  - Basic info: first publish, last update, latest publish (+publisher), total
    versions, unpacked size, file count, node engines, maintainers
  - dist-tags chips, dependencies (deps / peer / dev), recent version list,
    README excerpt
  - One-click **Watch** button
- **Watch tab** — add/remove packages; each row shows the latest version (with
  a NEW badge when it changed), day/7-day downloads with trend vs the previous
  snapshot, last-check time, and per-row refresh via the header button
- **History tab** — snapshot timeline per package (recorded on watch-add and
  version changes): time, version, day/week downloads, change type
- **Background polling** — the poller runs decoupled from the modal; every
  `refreshMinutes` (host config, default 10) it refreshes the whole watch list
  with 1 lightweight `dist-tags` request per package + 2 bulk download-count
  requests total; new versions light up the amber footer badge until viewed
- **Data files** — watch list and snapshots persist to
  `$DSH_HOME/dsh-listen-npm.json` (atomic writes, `.bak` on corruption)
- **HTTP API** — the browser half talks to `/dsh-listen-npm/api`
  (trust-fenced POST JSON), so polling never produces command nodes in the
  conversation; falls back to the command channel on older hosts
- **Model tools** — `dsh_npm_info` / `dsh_npm_downloads` / `dsh_npm_watch`
  (list / add / remove / refresh)

## Configuration (host config)

```yaml
registryUrl: https://registry.npmjs.org   # swap for a mirror, e.g. https://registry.npmmirror.com
downloadsUrl: https://api.npmjs.org/downloads
refreshMinutes: 10                        # watch list auto refresh interval
```

## Data notes

- Daily granularity comes from `api.npmjs.org/downloads/range`; npm aggregates
  downloads per day with a T+1 delay, so "yesterday" means the last completed
  day npm has published.
- Scoped packages (`@scope/name`) are supported everywhere; the registry path
  URL-encodes the slash while the downloads API uses it raw.
- The full registry doc is fetched once per query (react ≈ 7 MB) — the curl
  collector caps at 32 MB.

## File structure

```
├── src/host/*.ts         # host half: index.ts (entry), npm.ts (curl core), ops.ts (op dispatch), store.ts, fence.ts, types.ts
├── src/client/*.tsx      # browser half (React TSX): plugin.tsx, i18n, styles, rpc, store, poller, components/*
├── lib/index.js          # host half build artifact (tsdown, ESM), committed for git installs
├── lib/client.js         # browser half build artifact (tsdown → __ModuleLoader__ factory), committed
├── lib/types/            # type declarations (tsc -b)
├── scripts/              # verify-client.mjs (host seed-table simulation)
├── tsdown.config.ts      # tsdown config (node half + client bundle banner wrap)
├── tsconfig.json         # solution: tsconfig.host.json / tsconfig.client.json
├── cordis.patch.yml      # bundle patch (plugin row by package name)
├── package.json          # dsh.bundle + dsh.client(web) manifest + peerDependencies
├── README.md             # this file
└── README.zh.md          # Chinese docs
```

## Install

```sh
# local development
dsh plugin --profile web add ./dsh-listen-npm

# published: npm / tarball / GitHub
dsh plugin --profile web add dsh-listen-npm
dsh plugin --profile web add ./dsh-listen-npm-0.1.0.tgz
dsh plugin --profile web add github:you/dsh-listen-npm#<sha>

dsh --profile web --dump-config   # verify the config layer
dsh --profile web                 # start (host half needs a restart)
```

> **Local dev dependencies**: the host loads `lib/index.js` with native Node ESM
> resolution for `@deepseek-ai/schemastery`, `@deepseek-ai/dsh-tools`,
> `@deepseek-ai/dsh-settings`, so the plugin dir must contain a resolvable
> `node_modules` (gitignored). Either run `pnpm install` here, or link the host's
> flattened packages:
>
> ```powershell
> New-Item -ItemType Directory "$PWD\node_modules\@deepseek-ai" -Force
> foreach ($p in 'schemastery','dsh-tools','dsh-settings') {
>   New-Item -ItemType Junction "$PWD\node_modules\@deepseek-ai\$p" -Target "$env:DSH_HOME\profiles\node_modules\@deepseek-ai\$p"
> }
> ```

## Build

```sh
pnpm install
npm run check    # tsc -b (both programs)
npm run build    # tsc -b && tsdown (lib/index.js + lib/client.js)
npm run verify   # simulate the host loading lib/client.js
```

## License

MIT
