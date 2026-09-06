/**
 * dsh-listen-npm —— 历史 tab：监控包的快照时间线。
 *
 * 快照在「加入监控（init）」与「版本变更（version-change）」时由宿主记录，
 * 展示为时间倒序表格：记录时间 / latest 版本 / 昨日下载 / 近 7 天下载 / 类型。
 */

import { useEffect, useState } from 'react'
import type { RunFn } from '../rpc.ts'
import { t, tErr } from '../i18n.ts'
import { fmtCompact, fmtDateTime } from '../format.ts'

export interface HistoryTabProps {
  run: RunFn
  /** 可选的包列表（来自监控缓存）。 */
  names: string[]
}

interface SnapshotView {
  at: number
  latest: string
  day: number
  week: number
  note: string
}

export function HistoryTab({ run, names }: HistoryTabProps) {
  const [pkg, setPkg] = useState('')
  const [snaps, setSnaps] = useState<SnapshotView[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 默认选中第一个包（包列表变化时保持当前选择）。
    if (pkg.length === 0 && names.length > 0) setPkg(names[0])
  }, [names, pkg])

  useEffect(() => {
    if (pkg.length === 0) { setSnaps(null); return }
    let alive = true
    setLoading(true)
    setError('')
    void (async () => {
      try {
        const r = await run('', { op: 'history', pkg })
        if (!alive) return
        if (r && r.ok && Array.isArray(r.snapshots)) setSnaps(r.snapshots as SnapshotView[])
        else setError(tErr(r as { code?: string; error?: string }))
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [pkg, run])

  if (names.length === 0) {
    return <div className="dshn-empty">{t('watchEmpty')}</div>
  }

  return (
    <div>
      <div className="dshn-history-bar">
        <span style={{ fontSize: 13 }}>{t('historyPick')}</span>
        <select className="dshn-select" value={pkg} onChange={(e) => setPkg(e.target.value)}>
          {names.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      {error ? <div className="dshn-err">{error}</div> : null}
      {loading ? <div className="dshn-empty"><span className="dshn-spin" />{t('loading')}</div> : null}
      {!loading && snaps !== null && snaps.length === 0 ? <div className="dshn-empty">{t('historyEmpty')}</div> : null}
      {!loading && snaps !== null && snaps.length > 0 ? (
        <table className="dshn-table">
          <thead>
            <tr>
              <th>{t('historyColTime')}</th>
              <th>{t('historyColVersion')}</th>
              <th>{t('historyColDay')}</th>
              <th>{t('historyColWeek')}</th>
              <th>{t('historyColNote')}</th>
            </tr>
          </thead>
          <tbody>
            {snaps.map((s, i) => (
              <tr key={s.at + '-' + i}>
                <td>{fmtDateTime(new Date(s.at).toISOString())}</td>
                <td>{s.latest}</td>
                <td>{fmtCompact(s.day)}</td>
                <td>{fmtCompact(s.week)}</td>
                <td>
                  <span className={'dshn-note-chip ' + (s.note === 'version-change' ? 'dshn-note-version' : 'dshn-note-init')}>
                    {s.note === 'version-change' ? t('historyNoteVersion') : t('historyNoteInit')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  )
}
