/**
 * dsh-listen-npm —— 浏览器半边：监控列表后台轮询器。
 *
 * 与弹框生命周期解耦：关闭弹框后仍按配置间隔（宿主 config op 下发的
 * refreshMinutes）调用宿主 watchRefresh，让监控列表持续跟踪版本与下载量变化。
 * 变化结果写入摘要 store（footer 胶囊）与本地缓存（监控 tab 首屏直接可读）。
 *
 * 空闲不请求：无监控包或未到刷新间隔时 tick 直接短路。
 */

import type { RunFn } from './rpc.ts'
import type { SummaryStore, WatchSummary } from './store.ts'
import { tErr } from './i18n.ts'

/** 监控条目（宿主 WatchEntry 的客户端视图）。 */
export interface WatchEntryView {
  name: string
  addedAt: number
  lastCheckAt?: number
  lastVersion?: string
  lastDay?: number
  lastWeek?: number
  prevDay?: number
  prevWeek?: number
  hasNewVersion?: boolean
  error?: string
}

export interface Poller {
  /** 立即刷新一次（监控列表整体）。 */
  refresh(): Promise<void>
  /** 每 3s 由宿主 interval 驱动；到点且空闲时自动 refresh。 */
  tick(): void
  /** 启动引导：拉取 config（刷新间隔）+ 当前监控列表（不触发网络刷新）。 */
  bootstrap(): void
  /** 摘要（footer 胶囊）。 */
  getSummary(): WatchSummary
  subscribe(fn: () => void): () => void
  /** 最近一次缓存列表（监控 tab 首屏）。 */
  getWatch(): WatchEntryView[]
  /** 清除新版本未读标记（打开监控 tab 时调用）。 */
  markSeen(): void
  /** 增删监控后调用：置脏并立刻唤醒 tick。 */
  invalidate(): void
  /** 最近一次错误（本地化文本，无错误为空串）。 */
  lastError(): string
  /** 最近一次成功刷新的时间（epoch ms，0 表示尚未刷新过）。 */
  lastRefreshAt(): number
}

const DEFAULT_REFRESH_MINUTES = 10

export function createPoller(run: RunFn, summary: SummaryStore): Poller {
  let refreshMinutes = DEFAULT_REFRESH_MINUTES
  let lastRefreshAt = 0
  let busy = false
  let booted = false
  let dirty = false
  let errorText = ''
  let cachedWatch: WatchEntryView[] = []
  let currentSummary: WatchSummary = { watching: 0, newVersions: 0 }
  const listeners: Array<() => void> = []
  const emit = (): void => { for (const l of listeners) l() }

  const applyWatch = (watch: WatchEntryView[]): void => {
    cachedWatch = watch
    currentSummary = {
      watching: watch.length,
      newVersions: watch.filter((w) => w.hasNewVersion === true).length,
    }
    summary.set(currentSummary)
    emit()
  }

  const doRefresh = async (): Promise<void> => {
    if (busy) return
    if (cachedWatch.length === 0 && !dirty) return
    busy = true
    try {
      const res = await run('', { op: 'watchRefresh' })
      if (res && res.ok && Array.isArray(res.watch)) {
        lastRefreshAt = Date.now()
        errorText = ''
        dirty = false
        applyWatch(res.watch as WatchEntryView[])
      } else {
        errorText = tErr(res, res && res.error ? String(res.error) : '')
        emit()
      }
    } catch (e) {
      errorText = e instanceof Error ? e.message : String(e)
      emit()
    } finally {
      busy = false
    }
  }

  const loadWatch = async (): Promise<void> => {
    try {
      const res = await run('', { op: 'watchList' })
      if (res && res.ok && Array.isArray(res.watch)) applyWatch(res.watch as WatchEntryView[])
    } catch { /* 宿主不可用：保持空 */ }
  }

  return {
    refresh: () => { dirty = true; return doRefresh() },
    tick() {
      if (busy) return
      if (dirty) { void doRefresh(); return }
      if (cachedWatch.length === 0) return
      if (Date.now() - lastRefreshAt < refreshMinutes * 60 * 1000) return
      void doRefresh()
    },
    bootstrap() {
      if (booted) return
      booted = true
      void (async () => {
        try {
          const cfg = await run('', { op: 'config' })
          if (cfg && cfg.ok && typeof cfg.refreshMinutes === 'number' && cfg.refreshMinutes > 0) {
            refreshMinutes = cfg.refreshMinutes
          }
        } catch { /* 用默认间隔 */ }
        await loadWatch()
      })()
    },
    getSummary: () => currentSummary,
    subscribe(fn) {
      listeners.push(fn)
      return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1) }
    },
    getWatch: () => cachedWatch,
    markSeen() {
      const has = cachedWatch.some((w) => w.hasNewVersion === true)
      applyWatch(cachedWatch.map((w) => (w.hasNewVersion === true ? { ...w, hasNewVersion: false } : w)))
      if (has) void run('', { op: 'watchSeen' }).catch(() => { /* 忽略 */ })
    },
    invalidate() {
      dirty = true
      void loadWatch()
    },
    lastError: () => errorText,
    lastRefreshAt: () => lastRefreshAt,
  }
}
