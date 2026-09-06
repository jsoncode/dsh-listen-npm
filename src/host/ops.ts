/**
 * dsh-listen-npm —�?操作分发（HTTP 路由 / 命令 / 模型工具共用）：runOp 全部分支�? *
 * 分支：config / info / downloads / search / watchList / watchAdd / watchRemove /
 * watchRefresh / watchSeen / history�? *
 * 监控刷新策略（省请求）：
 * - 每个 watched 包一次轻�?dist-tags 请求（几百字节）�? * - 昨日 / �?7 天下载量�?point 批量接口（整个列表各 1 次请求）�? * - dist-tags.latest 与本地记录不�?�?版本变更：置 hasNewVersion + 追加快照�? */

import {
  NpmError,
  fetchBulkPoints,
  fetchDailyRange,
  fetchDistTags,
  fetchPackageInfo,
  fetchPoint,
  isValidPkgName,
  normalizePkgName,
  searchPackages,
} from './npm.ts'
import { SNAPSHOTS_LIMIT } from './store.ts'
import type { DailyPoint, DownloadPoint, NpmStoreData, OpRequest, OpResult, PackageInfo, SearchItem, WatchEntry } from './types.ts'

export interface OpsDeps {
  ctx: import('./types.ts').HostCtxLike
  /** 数据文件内存镜像（读同步）�?*/
  readStore(): NpmStoreData
  /** 整体写回（异步落盘）�?*/
  writeStore(data: NpmStoreData): Promise<void>
  registryUrl: string
  downloadsUrl: string
  /** 监控列表自动刷新间隔（分钟，客户端轮询用）�?*/
  refreshMinutes: number
  /** 数据文件初始化（加载）完成信号；runOp 开头等待，避免读到空镜像�?*/
  storeReady?: Promise<void>
}

const npmDeps = (deps: OpsDeps) => ({ ctx: deps.ctx, registryUrl: deps.registryUrl, downloadsUrl: deps.downloadsUrl })

/** 统一错误码提取（NpmError 自带 code；其余按消息特征兜底）�?*/
function errCodeOf(e: unknown): { code?: string; status?: number } {
  if (e instanceof NpmError) return { code: e.code, status: e.status }
  return {}
}

/** 追加快照（新的在前，截断上限）�?*/
function pushSnapshot(store: NpmStoreData, name: string, snap: { latest: string; day: number; week: number; note: 'init' | 'version-change' }): void {
  const list = Array.isArray(store.snapshots[name]) ? store.snapshots[name] : []
  list.unshift({ at: Date.now(), latest: snap.latest, day: snap.day, week: snap.week, note: snap.note })
  store.snapshots[name] = list.slice(0, SNAPSHOTS_LIMIT)
}

/* ── info：完整包信息 + 日粒度下载量 ───────────────────────────── */

export interface InfoPayload {
  info: PackageInfo
  daily: DailyPoint[]
  rangeStart: string
  rangeEnd: string
  points: {
    day?: DownloadPoint
    week?: DownloadPoint
    month?: DownloadPoint
    year?: DownloadPoint
  }
}

/** info op：registry 全量文档 + 下载量（�?�?�?�?+ �?30 天日粒度）�?*/
async function opInfo(deps: OpsDeps, rawPkg: string): Promise<InfoPayload> {
  const name = normalizePkgName(String(rawPkg || ''))
  if (!isValidPkgName(name)) throw new NpmError('pkg-name-invalid', 'invalid package name: ' + name)
  const d = npmDeps(deps)
  // 并行拉取：全量文档（含最新版元数�?+ readme）、近 30 天日粒度、近一年汇总�?  const [doc, monthRange, yearPoint] = await Promise.all([
    fetchPackageInfo(d, name),
    fetchDailyRange(d, name, 'last-month'),
    fetchPoint(d, name, 'last-year'),
  ])
  const info = doc.info
  const daily = monthRange.downloads
  // 周期汇总直接从日粒度数据推导（�?point 接口同窗），仅近一年单独请求�?  const sumLast = (n: number): number => daily.slice(-n).reduce((acc, p) => acc + p.downloads, 0)
  const points: InfoPayload['points'] = daily.length > 0
    ? {
      day: { downloads: daily[daily.length - 1].downloads, start: daily[daily.length - 1].day, end: daily[daily.length - 1].day },
      week: { downloads: sumLast(7), start: daily[Math.max(0, daily.length - 7)].day, end: daily[daily.length - 1].day },
      month: { downloads: sumLast(daily.length), start: monthRange.start, end: monthRange.end },
      year: yearPoint,
    }
    : { year: yearPoint }
  return { info, daily, rangeStart: monthRange.start, rangeEnd: monthRange.end, points }
}

/* ── search：输入联�?──────────────────────────────────────────── */

async function opSearch(deps: OpsDeps, text: string, size?: number): Promise<{ results: SearchItem[] }> {
  const q = String(text || '').trim()
  if (q.length === 0) return { results: [] }
  const results = await searchPackages(npmDeps(deps), q, typeof size === 'number' ? size : 8)
  return { results }
}

/* ── watch：监控列表增删刷�?───────────────────────────────────── */

function opWatchList(deps: OpsDeps): { watch: WatchEntry[] } {
  return { watch: deps.readStore().watch.map((w) => ({ ...w })) }
}

async function opWatchAdd(deps: OpsDeps, rawPkg: string): Promise<{ watch: WatchEntry[]; entry: WatchEntry }> {
  const name = normalizePkgName(String(rawPkg || ''))
  if (!isValidPkgName(name)) throw new NpmError('pkg-name-invalid', 'invalid package name: ' + name)
  const store = deps.readStore()
  if (store.watch.some((w) => w.name === name)) throw new NpmError('watch-duplicate', 'already watched: ' + name)
  const d = npmDeps(deps)
  // 验证包存在（dist-tags 极轻量），并取首次快照数据�?  const tags = await fetchDistTags(d, name)
  const latest = typeof tags.latest === 'string' ? tags.latest : ''
  let day = 0
  let week = 0
  try {
    const [pDay, pWeek] = await Promise.all([fetchPoint(d, name, 'last-day'), fetchPoint(d, name, 'last-week')])
    day = pDay.downloads
    week = pWeek.downloads
  } catch { /* 新包可能无下载量数据：保�?0 */ }
  const entry: WatchEntry = {
    name,
    addedAt: Date.now(),
    lastCheckAt: Date.now(),
    lastVersion: latest,
    lastDay: day,
    lastWeek: week,
  }
  store.watch.push(entry)
  pushSnapshot(store, name, { latest, day, week, note: 'init' })
  await deps.writeStore(store)
  return { watch: store.watch.map((w) => ({ ...w })), entry: { ...entry } }
}

async function opWatchRemove(deps: OpsDeps, rawPkg: string): Promise<{ watch: WatchEntry[] }> {
  const name = normalizePkgName(String(rawPkg || ''))
  const store = deps.readStore()
  const before = store.watch.length
  store.watch = store.watch.filter((w) => w.name !== name)
  delete store.snapshots[name]
  if (store.watch.length === before) throw new NpmError('watch-missing', 'not watched: ' + name)
  await deps.writeStore(store)
  return { watch: store.watch.map((w) => ({ ...w })) }
}

async function opWatchSeen(deps: OpsDeps, rawPkg: string | undefined): Promise<{ watch: WatchEntry[] }> {
  const store = deps.readStore()
  let dirty = false
  for (const w of store.watch) {
    if (w.hasNewVersion === true && (rawPkg === undefined || rawPkg === '' || normalizePkgName(String(rawPkg)) === w.name)) {
      w.hasNewVersion = false
      dirty = true
    }
  }
  if (dirty) await deps.writeStore(store)
  return { watch: store.watch.map((w) => ({ ...w })) }
}

/**
 * watchRefresh：刷新一个（req.pkg）或全部监控包�? * @returns 最新列�?+ 本次发现的版本变更（changes）�? */
async function opWatchRefresh(deps: OpsDeps, rawPkg?: string): Promise<{ watch: WatchEntry[]; changes: Array<{ name: string; from: string; to: string }>; checkedAt: number }> {
  const store = deps.readStore()
  const targets = (rawPkg !== undefined && String(rawPkg).trim() !== '')
    ? store.watch.filter((w) => w.name === normalizePkgName(String(rawPkg)))
    : store.watch.slice()
  const checkedAt = Date.now()
  const changes: Array<{ name: string; from: string; to: string }> = []
  if (targets.length === 0) return { watch: store.watch.map((w) => ({ ...w })), changes, checkedAt }

  const d = npmDeps(deps)
  const names = targets.map((w) => w.name)
  // downloads 批量接口不支�?scoped 包：普通包走批量（整列�?2 次请求）�?  // scoped 包逐个 point 查询（并行）�?  const plainNames = names.filter((n) => !n.startsWith('@'))
  const scopedNames = names.filter((n) => n.startsWith('@'))

  const pointFor = async (name: string, period: string): Promise<DownloadPoint | undefined> => {
    try { return await fetchPoint(d, name, period) } catch { return undefined }
  }

  // 并行：每个目标一�?dist-tags 请求 + 普通包两个批量请求 + scoped 包逐个请求�?  const [tagResults, bulkDay, bulkWeek, ...scopedPoints] = await Promise.all([
    Promise.all(targets.map(async (w) => {
      try { return { name: w.name, tags: await fetchDistTags(d, w.name), error: undefined as string | undefined } } catch (e) {
        return { name: w.name, tags: undefined, error: (e as Error).message || String(e) }
      }
    })),
    fetchBulkPoints(d, plainNames, 'last-day').catch(() => ({}) as Record<string, DownloadPoint>),
    fetchBulkPoints(d, plainNames, 'last-week').catch(() => ({}) as Record<string, DownloadPoint>),
    ...scopedNames.flatMap((n) => [
      pointFor(n, 'last-day').then((p) => ({ name: n, period: 'last-day', point: p })),
      pointFor(n, 'last-week').then((p) => ({ name: n, period: 'last-week', point: p })),
    ]),
  ])
  const scopedPointOf = (name: string, period: string): DownloadPoint | undefined =>
    (scopedPoints as Array<{ name: string; period: string; point?: DownloadPoint }>).find((s) => s.name === name && s.period === period)?.point

  for (const w of targets) {
    const tagHit = tagResults.find((t) => t.name === w.name)
    const dayHit = w.name.startsWith('@') ? scopedPointOf(w.name, 'last-day') : bulkDay[w.name]
    const weekHit = w.name.startsWith('@') ? scopedPointOf(w.name, 'last-week') : bulkWeek[w.name]
    if (tagHit && tagHit.error !== undefined) {
      w.error = tagHit.error
      continue
    }
    const latest = tagHit && tagHit.tags && typeof tagHit.tags.latest === 'string' ? tagHit.tags.latest : w.lastVersion
    const day = dayHit !== undefined ? dayHit.downloads : (w.lastDay ?? 0)
    const week = weekHit !== undefined ? weekHit.downloads : (w.lastWeek ?? 0)
    // 快照对比基准：本次刷新前的值即「上上个快照」（供客户端趋势箭头）�?    const prevDay = w.lastDay
    const prevWeek = w.lastWeek
    w.prevDay = prevDay
    w.prevWeek = prevWeek
    w.lastCheckAt = checkedAt
    w.lastDay = day
    w.lastWeek = week
    w.error = undefined
    if (latest !== undefined && latest !== w.lastVersion) {
      const from = w.lastVersion ?? ''
      w.lastVersion = latest
      w.hasNewVersion = true
      pushSnapshot(store, w.name, { latest, day, week, note: 'version-change' })
      if (from) changes.push({ name: w.name, from, to: latest })
    }
  }
  await deps.writeStore(store)
  return { watch: store.watch.map((w) => ({ ...w })), changes, checkedAt }
}

/* ── history：快照时间线 ───────────────────────────────────────── */

function opHistory(deps: OpsDeps, rawPkg: string): { pkg: string; snapshots: Array<{ at: number; latest: string; day: number; week: number; note: string }> } {
  const name = normalizePkgName(String(rawPkg || ''))
  const store = deps.readStore()
  const list = store.snapshots[name]
  return {
    pkg: name,
    snapshots: (Array.isArray(list) ? list : []).map((s) => ({ at: s.at, latest: s.latest, day: s.day, week: s.week, note: s.note })),
  }
}

/* ── 分发入口 ──────────────────────────────────────────────────── */

export async function runOp(deps: OpsDeps, req: OpRequest): Promise<OpResult> {
  // 等待数据文件初始化完成，避免操作读到空镜像�?  if (deps.storeReady) await deps.storeReady
  const op = req && req.op
  try {
    switch (op) {
      case 'config':
        return { ok: true, refreshMinutes: deps.refreshMinutes, registryUrl: deps.registryUrl }
      case 'info': {
        const payload = await opInfo(deps, String(req.pkg || ''))
        return { ok: true, ...payload }
      }
      case 'downloads': {
        const name = normalizePkgName(String(req.pkg || ''))
        if (!isValidPkgName(name)) throw new NpmError('pkg-name-invalid', 'invalid package name: ' + name)
        const range = req.range === 'last-week' ? 'last-week' : 'last-month'
        const payload = await fetchDailyRange(npmDeps(deps), name, range)
        return { ok: true, pkg: name, range, ...payload }
      }
      case 'search': {
        const payload = await opSearch(deps, String(req.text || ''), typeof req.size === 'number' ? req.size : undefined)
        return { ok: true, ...payload }
      }
      case 'watchList':
        return { ok: true, ...opWatchList(deps) }
      case 'watchAdd': {
        const payload = await opWatchAdd(deps, String(req.pkg || ''))
        return { ok: true, ...payload }
      }
      case 'watchRemove': {
        const payload = await opWatchRemove(deps, String(req.pkg || ''))
        return { ok: true, ...payload }
      }
      case 'watchSeen':
        return { ok: true, ...(await opWatchSeen(deps, typeof req.pkg === 'string' ? req.pkg : undefined)) }
      case 'watchRefresh': {
        const payload = await opWatchRefresh(deps, typeof req.pkg === 'string' ? req.pkg : undefined)
        return { ok: true, ...payload }
      }
      case 'history':
        return { ok: true, ...opHistory(deps, String(req.pkg || '')) }
      default:
        return { ok: false, code: 'unknown-op', error: 'unknown op: ' + String(op) }
    }
  } catch (e) {
    const { code, status } = errCodeOf(e)
    return {
      ok: false,
      code: code ?? 'op-failed',
      status,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
