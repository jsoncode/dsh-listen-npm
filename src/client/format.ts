/**
 * dsh-listen-npm —— 展示格式化工具（数字紧凑化 / 日期 / 相对时间 / 趋势）。
 */

import type { DailyPoint } from './types.ts'
import { buildDailySeries, latestExpectedDay } from '../shared/daily.ts'

/** 大数紧凑化：1.2B / 15.6M / 234.5k / 987。 */
export const fmtCompact = (n: number | undefined | null): string => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e9) return (n / 1e9).toFixed(abs >= 1e10 ? 0 : 1) + 'B'
  if (abs >= 1e6) return (n / 1e6).toFixed(abs >= 1e7 ? 0 : 1) + 'M'
  if (abs >= 1e3) return (n / 1e3).toFixed(abs >= 1e4 ? 0 : 1) + 'k'
  return String(n)
}

/** 千分位整数。 */
export const fmtInt = (n: number | undefined | null): string =>
  typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('en-US') : '—'

/** 'YYYY-MM-DD' → 'MM-DD'（纯字符串截取，不经过 Date，避免时区偏移）。 */
export const fmtDayShort = (day: string | undefined): string =>
  typeof day === 'string' && day.length >= 10 ? day.slice(5, 10) : (day || '')

/** ISO 时间 → 本地 "YYYY-MM-DD HH:mm"（仅日期字段容错）。 */
export const fmtDateTime = (iso: string | undefined): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 19).replace('T', ' ')
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** ISO 时间 → 本地日期 "YYYY-MM-DD"。 */
export const fmtDate = (iso: string | undefined): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** epoch ms → 相对时间（分钟/小时/天前）。 */
export const fmtRel = (ms: number | undefined): string => {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return '—'
  const diff = Date.now() - ms
  if (diff < 60 * 1000) return '<1m'
  if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + 'm'
  if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / 3600000) + 'h'
  return Math.floor(diff / 86400000) + 'd'
}

/** 字节数 → 可读（1.2 MB / 340 kB）。 */
export const fmtBytes = (n: number | undefined): string => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' MB'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + ' kB'
  return n + ' B'
}

/** 下载量趋势：与上个快照比较的百分比箭头。 */
export interface DeltaView {
  cls: string
  text: string
}

export const deltaOf = (current: number | undefined, prev: number | undefined): DeltaView | null => {
  if (typeof current !== 'number' || typeof prev !== 'number' || prev <= 0 || current === prev) return null
  const pct = ((current - prev) / prev) * 100
  const sign = pct >= 0 ? '+' : ''
  return {
    cls: pct >= 0 ? 'dshn-delta-up' : 'dshn-delta-down',
    text: sign + (pct >= 0 ? '' : '') + (Math.abs(pct) >= 100 ? Math.round(pct) : Math.abs(pct).toFixed(1)) + '%',
  }
}

/* ── 日粒度序列视图（补齐日 / 真实数据段的切分）──────────────────── */

/**
 * 宿主返回的日粒度序列视图。
 *
 * 序列由宿主补齐到「昨天」（区间内漏报日补 0，尾部 npm 尚未统计的日期补 0 且
 * `pending=true`）；这里用同一个纯函数（src/shared/daily.ts）**幂等重算**一遍，
 * 于是：
 * - 图表照原样画满每一根柱子（日期连续，不会「断在几天前」）；
 * - 峰值 / 日均 / 聚合数字只看真实数据段，不被延迟的 0 拉低；
 * - 标签能说出真实数据截止在哪天（滞后时不再写「昨日」）；
 * - 即使宿主还是旧版本（只返回真实数据段），前端也能补齐尾部、正确标注
 *   —— 只需刷新页面即可看到连续性修复。
 */
export interface DailySeriesView {
  /** 全部点（含补齐的 pending 段），时间正序。 */
  all: DailyPoint[]
  /** 真实数据点（npm 已统计）。 */
  real: DailyPoint[]
  /** 第一个 / 最后一个真实数据日（'' = 无数据）。 */
  dataStart: string
  dataEnd: string
  /** 补齐后的最后一天（通常是昨天）。 */
  expectedEnd: string
  /** 尾部尚未统计的天数（0 = 数据最新）。 */
  lagDays: number
  /** 尾部待统计段的起止日期（lagDays>0 时非空）。 */
  pendingFrom: string
  pendingTo: string
}

export const seriesOf = (daily: DailyPoint[] | undefined): DailySeriesView => {
  const raw = Array.isArray(daily) ? daily : []
  const realPoints = raw.filter((p) => p.pending !== true)
  // 幂等：宿主已补齐时结果与入参一致；宿主返回旧形状时在这里补上尾部 0 + pending。
  const padded = buildDailySeries(realPoints, latestExpectedDay())
  const all = padded.daily as DailyPoint[]
  const pending = padded.pendingDays > 0 ? all.slice(-padded.pendingDays) : []
  return {
    all,
    real: padded.pendingDays > 0 ? all.slice(0, all.length - padded.pendingDays) : all,
    dataStart: padded.dataStart,
    dataEnd: padded.dataEnd,
    expectedEnd: padded.expectedEnd,
    lagDays: padded.lagDays,
    pendingFrom: pending.length > 0 ? pending[0].day : '',
    pendingTo: pending.length > 0 ? pending[pending.length - 1].day : '',
  }
}
