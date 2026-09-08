/**
 * dsh-listen-npm —— 监控 tab：监控列表的增删与状态总览。
 *
 * - 顶部：添加输入框 + 立即刷新 + 自动刷新间隔说明；
 * - 列表项：包名（点击进查询 tab 看详情）、latest 版本（就是普通版本号，不做任何
 *   「有新版本」标记/高亮）、昨日/近 7 天下载量（与上个快照对比的趋势箭头）、右侧
 *   近 7 天日安装量迷你柱状图（数据随刷新响应返回，无额外请求）、刷新失败原因、
 *   移除按钮；
 * - 打开 tab 时静默清除新版本未读标记（入口已不展示任何更新提示；版本变化只在
 *   「历史」tab 的快照时间线里体现）。
 */

import { useEffect, useState, type ReactNode } from 'react'
import type { RunFn } from '../rpc.ts'
import type { Poller, WatchEntryView } from '../poller.ts'
import { t, tErr } from '../i18n.ts'
import { fmtCompact, fmtInt, fmtRel } from '../format.ts'

/** 迷你日安装量柱状图（近 7 天，随刷新更新；每根柱带原生 tooltip）。 */
function MiniTrend({ daily }: { daily?: WatchEntryView['daily'] }) {
  const data = daily || []
  if (data.length === 0) return null
  const max = Math.max(...data.map((p) => p.downloads), 1)
  return (
    <div className="dshn-trend" title={t('watchTrend')} aria-label={t('watchTrend')}>
      {data.map((p, i) => (
        <span
          key={p.day}
          className={'dshn-trend-bar' + (i === data.length - 1 ? ' dshn-trend-bar-last' : '')}
          style={{ height: Math.max(10, Math.round((p.downloads / max) * 100)) + '%' }}
          title={`${p.day} · ${fmtInt(p.downloads)}`}
        />
      ))}
    </div>
  )
}

export interface WatchTabProps {
  run: RunFn
  poller: Poller
  /** 点击包名：跳查询 tab 查看详情。 */
  onOpenDetail(pkg: string): void
  refreshMinutes: number
}

export function WatchTab({ run, poller, onOpenDetail, refreshMinutes }: WatchTabProps) {
  const [items, setItems] = useState<WatchEntryView[]>(() => poller.getWatch())
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(0)

  useEffect(() => {
    const update = (): void => { setItems(poller.getWatch().slice()); setLastRefresh(poller.lastRefreshAt()) }
    update()
    return poller.subscribe(update)
  }, [poller])

  // 打开 tab 即静默清除「有新版本」未读标记（入口不再展示任何更新提示）。
  useEffect(() => {
    poller.markSeen()
  }, [poller])

  const add = async (): Promise<void> => {
    const pkg = input.trim()
    if (pkg.length === 0 || busy) return
    setBusy(true)
    setError('')
    try {
      const r = await run('', { op: 'watchAdd', pkg })
      if (r && r.ok) {
        setInput('')
        poller.invalidate()
      } else {
        setError(tErr(r as { code?: string; error?: string }))
      }
    } finally {
      setBusy(false)
    }
  }

  const remove = async (name: string): Promise<void> => {
    if (busy) return
    if (!window.confirm(t('watchRemoveConfirm'))) return
    setBusy(true)
    setError('')
    try {
      const r = await run('', { op: 'watchRemove', pkg: name })
      if (r && r.ok) poller.invalidate()
      else setError(tErr(r as { code?: string; error?: string }))
    } finally {
      setBusy(false)
    }
  }

  const refreshAll = async (): Promise<void> => {
    if (busy) return
    setBusy(true)
    try {
      await poller.refresh()
      setLastRefresh(poller.lastRefreshAt())
    } finally {
      setBusy(false)
    }
  }

  const dlText = (w: WatchEntryView): ReactNode => {
    const dayDelta = w.prevDay !== undefined && w.lastDay !== undefined && w.prevDay > 0
      ? ((w.lastDay - w.prevDay) / w.prevDay) * 100
      : null
    return (
      <>
        <span>{t('dlDay')} {fmtCompact(w.lastDay)}{dayDelta !== null && Math.abs(dayDelta) >= 0.5 ? <span className={dayDelta >= 0 ? 'dshn-delta-up' : 'dshn-delta-down'}> ({dayDelta >= 0 ? '+' : ''}{dayDelta.toFixed(1)}%)</span> : null}</span>
        <span>{t('dlWeek')} {fmtCompact(w.lastWeek)}</span>
      </>
    )
  }

  return (
    <div>
      <div className="dshn-watch-bar">
        <input
          className="dshn-input"
          value={input}
          placeholder={t('watchPlaceholder')}
          spellCheck={false}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void add() }}
        />
        <button type="button" className="dshn-btn dshn-btn-primary" disabled={busy || input.trim().length === 0} onClick={() => void add()}>
          {t('watchAddBtn')}
        </button>
      </div>
      <div className="dshn-watch-status">
        <span>{t('watchListCount', { n: items.length })}</span>
        <span>·</span>
        <span>{t('autoRefreshHint', { n: refreshMinutes })}{lastRefresh > 0 ? ` · ${t('refreshedAt')} ${fmtRel(lastRefresh)}` : ''}</span>
        <span style={{ marginLeft: 'auto' }}>
          <button type="button" className="dshn-btn dshn-btn-small" disabled={busy || items.length === 0} onClick={() => void refreshAll()}>
            {busy ? <span><span className="dshn-spin" />{t('loading')}</span> : t('refreshNow')}
          </button>
        </span>
      </div>
      {error ? <div className="dshn-err">{error}</div> : null}
      {poller.lastError() ? <div className="dshn-err">{poller.lastError()}</div> : null}

      {items.length === 0 ? (
        <div className="dshn-empty">{t('watchEmpty')}</div>
      ) : (
        items.map((w) => (
          <div key={w.name} className="dshn-watch-item">
            <div className="dshn-watch-main" onClick={() => onOpenDetail(w.name)} title={t('watchViewDetail')}>
              <div className="dshn-watch-name">
                {w.name}
                {w.lastVersion ? <span className="dshn-watch-ver">{w.lastVersion}</span> : null}
                {w.error ? <span className="dshn-chip" title={w.error}>{t('watchErrBadge')}</span> : null}
              </div>
              <div className="dshn-watch-dl">
                {dlText(w)}
                <span>{t('refreshedAt')} {fmtRel(w.lastCheckAt)}</span>
              </div>
            </div>
            <MiniTrend daily={w.daily} />
            <div className="dshn-watch-ops">
              <button
                type="button"
                className="dshn-btn-icon"
                title={t('watchRemove')}
                onClick={() => void remove(w.name)}
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
