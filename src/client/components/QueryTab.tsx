/**
 * dsh-listen-npm —�?查询 tab：包名输�?+ 联想搜索 + 详情展示�? *
 * - 输入 �? 字符时防�?300ms �?search op 弹出联想列表（名�?描述/周下载量）；
 * - 回车或点击「查询」直接拉�?info op 展示完整详情�? * - 详情头部可一键加入监控（watchAdd op）�? */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RunFn } from '../rpc.ts'
import type { InfoResponse, SearchItemView } from '../types.ts'
import { t, tErr } from '../i18n.ts'
import { fmtCompact } from '../format.ts'
import { PackageDetail } from './PackageDetail.tsx'

export interface QueryTabProps {
  run: RunFn
  /** 打开时直接查询的包名（监�?历史 tab 跳转过来）�?*/
  initialPkg?: string
  /** 已监控包名集合（详情头部按钮状态）�?*/
  watchedNames: ReadonlySet<string>
  /** 增删监控后通知轮询器刷新缓存�?*/
  onWatchChanged(): void
}

export function QueryTab({ run, initialPkg, watchedNames, onWatchChanged }: QueryTabProps) {
  const [input, setInput] = useState(initialPkg || '')
  const [querying, setQuerying] = useState(false)
  const [error, setError] = useState('')
  const [res, setRes] = useState<InfoResponse | null>(null)
  const [watchBusy, setWatchBusy] = useState(false)
  const [watchNotice, setWatchNotice] = useState('')
  const [suggests, setSuggests] = useState<SearchItemView[] | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const suggestSeq = useRef(0)
  const querySeq = useRef(0)

  const query = useCallback(async (pkgRaw: string) => {
    const pkg = pkgRaw.trim()
    if (pkg.length === 0) return
    const seq = ++querySeq.current
    setQuerying(true)
    setError('')
    setRes(null)
    setWatchNotice('')
    setSuggests(null)
    try {
      const r = await run('', { op: 'info', pkg })
      if (seq !== querySeq.current) return
      setRes(r as unknown as InfoResponse)
      if (!(r && r.ok)) setError(tErr(r as { code?: string; error?: string }))
    } finally {
      if (seq === querySeq.current) setQuerying(false)
    }
  }, [run])

  // 外部传入 initialPkg（监�?历史跳转）时自动查询一次�?  useEffect(() => {
    if (initialPkg && initialPkg.trim().length > 0) void query(initialPkg)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPkg])

  // 联想搜索：输�?�? 字符防抖 300ms�?  useEffect(() => {
    const q = input.trim()
    if (q.length < 2 || q === initialPkg) { setSuggests(null); return }
    const seq = ++suggestSeq.current
    setSuggesting(true)
    const timer = setTimeout(async () => {
      try {
        const r = await run('', { op: 'search', text: q, size: 8 })
        if (seq !== suggestSeq.current) return
        if (r && r.ok && Array.isArray(r.results)) setSuggests(r.results as SearchItemView[])
        else setSuggests([])
      } catch {
        if (seq === suggestSeq.current) setSuggests([])
      } finally {
        if (seq === suggestSeq.current) setSuggesting(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [input, run, initialPkg])

  const doWatch = async (): Promise<void> => {
    if (!res?.info) return
    setWatchBusy(true)
    setWatchNotice('')
    try {
      const r = await run('', { op: 'watchAdd', pkg: res.info.name })
      if (r && r.ok) {
        setWatchNotice(t('watchAdded'))
        onWatchChanged()
      } else {
        setWatchNotice('!' + t('watchAddFailed') + ': ' + tErr(r as { code?: string; error?: string }))
      }
    } finally {
      setWatchBusy(false)
    }
  }

  const watchedSet = watchedNames

  return (
    <div>
      <div className="dshn-query-wrap">
        <div className="dshn-query-bar">
          <input
            className="dshn-input"
            value={input}
            placeholder={t('queryPlaceholder')}
            spellCheck={false}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void query(input) }}
          />
          <button type="button" className="dshn-btn dshn-btn-primary" disabled={querying || input.trim().length === 0} onClick={() => void query(input)}>
            {querying ? <span><span className="dshn-spin" />{t('loading')}</span> : t('queryBtn')}
          </button>
        </div>
        {suggests !== null && suggests.length > 0 ? (
          <div className="dshn-search-pop">
            {suggests.map((s) => (
              <button
                key={s.name}
                type="button"
                className="dshn-search-item"
                onClick={() => { setInput(s.name); void query(s.name) }}
              >
                <div className="dshn-search-item-name">
                  {s.name}
                  {s.version ? <span className="dshn-link">{s.version}</span> : null}
                  {typeof s.weekly === 'number' ? <span style={{ marginLeft: 'auto', fontSize: 11 }}>{fmtCompact(s.weekly)}/w</span> : null}
                </div>
                {s.description ? <div className="dshn-search-item-desc">{s.description}</div> : null}
                {s.publisher || s.date ? <div className="dshn-search-item-meta">{s.publisher || ''}{s.date ? ' · ' + s.date.slice(0, 10) : ''}</div> : null}
              </button>
            ))}
          </div>
        ) : suggesting && input.trim().length >= 2 ? (
          <div className="dshn-search-pop"><div className="dshn-empty" style={{ padding: '10px 12px' }}><span className="dshn-spin" />{t('searching')}</div></div>
        ) : null}
      </div>

      {error ? <div className="dshn-err">{error}</div> : null}
      {!res && !querying && !error ? <div className="dshn-empty">{t('searchPickHint')}</div> : null}
      {res && res.ok && res.info ? (
        <PackageDetail
          res={res}
          watched={watchedSet.has(res.info.name)}
          onWatch={() => void doWatch()}
          watchBusy={watchBusy}
          notice={watchNotice}
        />
      ) : null}
    </div>
  )
}
