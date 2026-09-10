/**
 * dsh-listen-npm —— 操作分发（HTTP 路由 / 命令 / 模型工具共用）：runOp 全部分支。
 *
 * 分支：config / info / downloads / search / watchList / watchAdd / watchRemove /
 * watchRefresh / watchSeen / history。
 *
 * 监控刷新策略（省请求）：
 * - 每个 watched 包两次轻量请求：dist-tags（几百字节）+ downloads range/last-week；
 * - 最新单日 / 近 7 天下载量与监控列表迷你柱状图的日粒度序列都由 range 响应推导
 *   （downloads 批量接口不支持 scoped 包，range 本就按包查询——scoped 包反而
 *   从 3 次请求/包降到 2 次/包）；
 * - 下载量序列统一经 buildDailySeries 补齐到「昨天」（缺失日 0，尾部未统计日
 *   0 + pending），聚合值只统计真实数据日，避免 npm 的 T+N 延迟把数字压低；
 * - dist-tags.latest 与本地记录不同 → 版本变更：置 hasNewVersion + 追加快照。
 */

import {
  NpmError,
  fetchDailyRange,
  fetchDistTags,
  fetchPackageInfo,
  fetchPoint,
  isValidPkgName,
  normalizePkgName,
  searchPackages,
} from './npm.ts'
import { SNAPSHOTS_LIMIT } from './store.ts'
import { buildDailySeries, lastRealDay, latestExpectedDay, realPoints, sumDownloads, type DailySeries } from '../shared/daily.ts'
import type { DailyPoint, DownloadPoint, NpmStoreData, OpRequest, OpResult, PackageInfo, SearchItem, WatchEntry } from './types.ts'

export interface OpsDeps {
  ctx: import('./types.ts').HostCtxLike
  /** 数据文件内存镜像（读同步）。 */
  readStore(): NpmStoreData
  /** 整体写回（异步落盘）。 */
  writeStore(data: NpmStoreData): Promise<void>
  registryUrl: string
  downloadsUrl: string
  /** 监控列表自动刷新间隔（分钟，客户端轮询用）。 */
  refreshMinutes: number
  /** 数据文件初始化（加载）完成信号；runOp 开头等待，避免读到空镜像。 */
  storeReady?: Promise<void>
}

const npmDeps = (deps: OpsDeps) => ({ ctx: deps.ctx, registryUrl: deps.registryUrl, downloadsUrl: deps.downloadsUrl })

/** 统一错误码提取（NpmError 自带 code；其余按消息特征兜底）。 */
function errCodeOf(e: unknown): { code?: string; status?: number } {
  if (e instanceof NpmError) return { code: e.code, status: e.status }
  return {}
}

/** 追加快照（新的在前，截断上限）。 */
function pushSnapshot(store: NpmStoreData, name: string, snap: { latest: string; day: number; week: number; note: 'init' | 'version-change' }): void {
  const list = Array.isArray(store.snapshots[name]) ? store.snapshots[name] : []
  list.unshift({ at: Date.now(), latest: snap.latest, day: snap.day, week: snap.week, note: snap.note })
  store.snapshots[name] = list.slice(0, SNAPSHOTS_LIMIT)
}

/** 由 range 响应推导监控数据：序列补齐到昨天，最新单日 / 近 7 天锚定最后一个真实数据日。 */
function entryDataFromRange(
  range: { downloads: DailyPoint[] },
  targetEnd: string = latestExpectedDay(),
): { day: number; week: number; daily: DailyPoint[] } {
  const series = buildDailySeries(range.downloads, targetEnd)
  const real = realPoints(series.daily)
  const day = real.length > 0 ? real[real.length - 1].downloads : 0
  const week = sumDownloads(real.slice(-7))
  return { day, week, daily: series.daily as DailyPoint[] }
}

/* ── info：完整包信息 + 日粒度下载量 ───────────────────────────── */

export interface InfoPayload {
  info: PackageInfo
  /** 连续日粒度序列（正序；尾部未统计日补 0 且 pending=true）。 */
  daily: DailyPoint[]
  /** 序列首日 / 末日（补齐后的日历区间，供「统计区间」展示）。 */
  rangeStart: string
  rangeEnd: string
  /** 最后一个有数据的日期（'' = 无数据）—— 「最新单日」的日期。 */
  dataEnd: string
  /** npm 尚未统计的天数（rangeEnd 与 dataEnd 之间的距离）。 */
  lagDays: number
  points: {
    day?: DownloadPoint
    week?: DownloadPoint
    month?: DownloadPoint
    year?: DownloadPoint
  }
}

/** info op：registry 全量文档 + 下载量（最新单日/周/月/年 + 近 30 天日粒度）。 */
async function opInfo(deps: OpsDeps, rawPkg: string): Promise<InfoPayload> {
  const name = normalizePkgName(String(rawPkg || ''))
  if (!isValidPkgName(name)) throw new NpmError('pkg-name-invalid', 'invalid package name: ' + name)
  const d = npmDeps(deps)
  // 并行拉取：全量文档（含最新版元数据 + readme）、近 30 天日粒度、近一年汇总。
  const [doc, monthRange, yearPoint] = await Promise.all([
    fetchPackageInfo(d, name),
    fetchDailyRange(d, name, 'last-month'),
    fetchPoint(d, name, 'last-year'),
  ])
  const info = doc.info
  // 补齐到昨天：区间内漏报日补 0，尾部未统计日补 0 + pending（仅为图表连续）。
  const series: DailySeries = buildDailySeries(monthRange.downloads, latestExpectedDay())
  const daily = series.daily as DailyPoint[]
  const real = realPoints(daily)
  const dataEnd = lastRealDay(daily)
  // 周期汇总只统计真实数据日（窗口截止到 dataEnd），npm 的统计延迟不会压低数字。
  const weekWindow = real.slice(-7)
  const points: InfoPayload['points'] = dataEnd.length > 0
    ? {
      day: { downloads: real[real.length - 1].downloads, start: dataEnd, end: dataEnd },
      week: {
        downloads: sumDownloads(weekWindow),
        start: weekWindow.length > 0 ? weekWindow[0].day : dataEnd,
        end: dataEnd,
      },
      month: {
        downloads: sumDownloads(real),
        start: monthRange.start || real[0].day,
        end: dataEnd,
      },
      year: yearPoint,
    }
    : { year: yearPoint }
  return {
    info,
    daily,
    rangeStart: daily.length > 0 ? daily[0].day : monthRange.start,
    rangeEnd: daily.length > 0 ? daily[daily.length - 1].day : monthRange.end,
    dataEnd,
    lagDays: series.lagDays,
    points,
  }
}

/* ── search：输入联想 ──────────────────────────────────────────── */

async function opSearch(deps: OpsDeps, text: string, size?: number): Promise<{ results: SearchItem[] }> {
  const q = String(text || '').trim()
  if (q.length === 0) return { results: [] }
  const results = await searchPackages(npmDeps(deps), q, typeof size === 'number' ? size : 8)
  return { results }
}

/* ── watch：监控列表增删刷新 ───────────────────────────────────── */

function opWatchList(deps: OpsDeps): { watch: WatchEntry[] } {
  return { watch: deps.readStore().watch.map((w) => ({ ...w })) }
}

async function opWatchAdd(deps: OpsDeps, rawPkg: string): Promise<{ watch: WatchEntry[]; entry: WatchEntry }> {
  const name = normalizePkgName(String(rawPkg || ''))
  if (!isValidPkgName(name)) throw new NpmError('pkg-name-invalid', 'invalid package name: ' + name)
  const store = deps.readStore()
  if (store.watch.some((w) => w.name === name)) throw new NpmError('watch-duplicate', 'already watched: ' + name)
  const d = npmDeps(deps)
  // 验证包存在（dist-tags 极轻量），并取首次快照数据。
  const tags = await fetchDistTags(d, name)
  const latest = typeof tags.latest === 'string' ? tags.latest : ''
  // 一次 range/last-week 同时得到最新单日 / 近 7 天与日粒度序列（新包可能无数据：保持 0）。
  let day = 0
  let week = 0
  let daily: DailyPoint[] | undefined
  try {
    const data = entryDataFromRange(await fetchDailyRange(d, name, 'last-week'))
    day = data.day
    week = data.week
    daily = data.daily
  } catch { /* 新包可能无下载量数据：保持 0 */ }
  const entry: WatchEntry = {
    name,
    addedAt: Date.now(),
    lastCheckAt: Date.now(),
    lastVersion: latest,
    lastDay: day,
    lastWeek: week,
    daily,
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
 * watchRefresh：刷新一个（req.pkg）或全部监控包。
 * @returns 最新列表 + 本次发现的版本变更（changes）。
 */
async function opWatchRefresh(deps: OpsDeps, rawPkg?: string): Promise<{ watch: WatchEntry[]; changes: Array<{ name: string; from: string; to: string }>; checkedAt: number }> {
  const store = deps.readStore()
  const targets = (rawPkg !== undefined && String(rawPkg).trim() !== '')
    ? store.watch.filter((w) => w.name === normalizePkgName(String(rawPkg)))
    : store.watch.slice()
  const checkedAt = Date.now()
  const changes: Array<{ name: string; from: string; to: string }> = []
  if (targets.length === 0) return { watch: store.watch.map((w) => ({ ...w })), changes, checkedAt }

  const d = npmDeps(deps)

  // 并行：每个目标各一个 dist-tags 请求 + 一个 range/last-week 请求。
  // 日粒度序列随 range 响应返回（尾部补齐到昨天），最新单日 / 近 7 天由它推导
  // （point 批量接口不支持 scoped 包，range 按包查询对两类包一视同仁）。请求失败
  // 静默降级：该包保持上次的下载量数据，仅版本检查失败才标 error。
  const [tagResults, rangeResults] = await Promise.all([
    Promise.all(targets.map(async (w) => {
      try { return { name: w.name, tags: await fetchDistTags(d, w.name), error: undefined as string | undefined } } catch (e) {
        return { name: w.name, tags: undefined, error: (e as Error).message || String(e) }
      }
    })),
    Promise.all(targets.map(async (w) => {
      try { return { name: w.name, data: entryDataFromRange(await fetchDailyRange(d, w.name, 'last-week')) } } catch {
        return { name: w.name, data: undefined }
      }
    })),
  ])

  for (const w of targets) {
    const tagHit = tagResults.find((t) => t.name === w.name)
    const rangeHit = rangeResults.find((r) => r.name === w.name)
    if (tagHit && tagHit.error !== undefined) {
      w.error = tagHit.error
      continue
    }
    const latest = tagHit && tagHit.tags && typeof tagHit.tags.latest === 'string' ? tagHit.tags.latest : w.lastVersion
    const day = rangeHit !== undefined && rangeHit.data !== undefined ? rangeHit.data.day : (w.lastDay ?? 0)
    const week = rangeHit !== undefined && rangeHit.data !== undefined ? rangeHit.data.week : (w.lastWeek ?? 0)
    const daily = rangeHit !== undefined && rangeHit.data !== undefined ? rangeHit.data.daily : undefined
    // 快照对比基准：本次刷新前的值即「上上个快照」（供客户端趋势箭头）。
    const prevDay = w.lastDay
    const prevWeek = w.lastWeek
    w.prevDay = prevDay
    w.prevWeek = prevWeek
    w.lastCheckAt = checkedAt
    w.lastDay = day
    w.lastWeek = week
    if (daily !== undefined) w.daily = daily
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
  // 等待数据文件初始化完成，避免操作读到空镜像。
  if (deps.storeReady) await deps.storeReady
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
        // 同样补齐到昨天：区间内漏报日补 0，尾部未统计日补 0 + pending（连续性）。
        const series = buildDailySeries(payload.downloads, latestExpectedDay())
        const downloads = series.daily as DailyPoint[]
        return {
          ok: true,
          pkg: name,
          range,
          start: series.dataStart || payload.start,
          end: series.expectedEnd || payload.end,
          downloads,
          dataEnd: series.dataEnd,
          lagDays: series.lagDays,
          pendingDays: series.pendingDays,
        }
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
