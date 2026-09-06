/**
 * dsh-listen-npm —�?统一「npm 包监控」弹框：查询 / 监控 / 历史 三个 tab�? *
 * �?shell.overlay 槽位渲染（打开状态来自共�?ModalStore）；footer 入口�? * 监控徽标数据来自共享的后台轮询器（弹框关闭后仍在刷新）�? */

import { useEffect, useState } from 'react'
import type { RunFn } from '../rpc.ts'
import type { ModalStore, WatchSummary } from '../store.ts'
import type { Poller } from '../poller.ts'
import { t } from '../i18n.ts'
import { NPM_LOGO } from '../logo.ts'
import { ModalPortal } from './ModalPortal.tsx'
import { QueryTab } from './QueryTab.tsx'
import { WatchTab } from './WatchTab.tsx'
import { HistoryTab } from './HistoryTab.tsx'

export interface NpmModalProps {
  run: RunFn
  useOpen: () => boolean
  close(): void
  poller: Poller
  /** footer 胶囊摘要（监控数量徽标联动）�?*/
  useSummary: () => WatchSummary
  /** 自动刷新间隔（分钟，config op 下发的响应式 store）�?*/
  useRefreshMinutes: () => number
}

type TabKey = 'query' | 'watch' | 'history'

export function NpmModal({ run, useOpen, close, poller, useSummary, useRefreshMinutes }: NpmModalProps) {
  const open = useOpen()
  const [tab, setTab] = useState<TabKey>('query')
  const [detailPkg, setDetailPkg] = useState('')
  const summary = useSummary()
  const refreshMinutes = useRefreshMinutes()
  const [watchNames, setWatchNames] = useState<string[]>([])

  // 监控缓存变化时同步名称列表（监控/历史 tab 用）�?  useEffect(() => {
    const update = (): void => setWatchNames(poller.getWatch().map((w) => w.name))
    update()
    return poller.subscribe(update)
  }, [poller])

  // 打开监控 tab 时清一次新版本未读（footer 橙色胶囊消失）�?  useEffect(() => {
    if (open && tab === 'watch') poller.markSeen()
  }, [open, tab, poller])

  if (!open) return null

  const watchedSet = new Set(watchNames)

  return (
    <ModalPortal onBackdropClose={close}>
      <div className="dshn-modal-head">
        <img src={NPM_LOGO} alt="" className="dshn-modal-logo" />
        <div>
          <div className="dshn-modal-title">{t('modalTitle')}</div>
          <div className="dshn-modal-sub">{t('modalSubtitle')}</div>
        </div>
        <div className="dshn-modal-head-ops">
          <button type="button" className="dshn-btn-icon" title={t('refreshNow')} onClick={() => void poller.refresh()}>�?/button>
          <button type="button" className="dshn-btn-icon" title={t('close')} onClick={close}>�?/button>
        </div>
      </div>
      <div className="dshn-tabs">
        <button type="button" className={'dshn-tab' + (tab === 'query' ? ' dshn-tab-active' : '')} onClick={() => setTab('query')}>
          {t('tabQuery')}
        </button>
        <button type="button" className={'dshn-tab' + (tab === 'watch' ? ' dshn-tab-active' : '')} onClick={() => setTab('watch')}>
          {t('tabWatch')}
          {summary.watching > 0 ? <span className="dshn-capsule dshn-capsule-watch" style={{ marginLeft: 6 }}>{summary.watching}</span> : null}
        </button>
        <button type="button" className={'dshn-tab' + (tab === 'history' ? ' dshn-tab-active' : '')} onClick={() => setTab('history')}>
          {t('tabHistory')}
        </button>
      </div>
      <div className="dshn-modal-body">
        {tab === 'query' ? (
          <QueryTab
            run={run}
            initialPkg={detailPkg}
            watchedNames={watchedSet}
            onWatchChanged={() => poller.invalidate()}
          />
        ) : null}
        {tab === 'watch' ? (
          <WatchTab
            run={run}
            poller={poller}
            refreshMinutes={refreshMinutes}
            onOpenDetail={(pkg) => { setDetailPkg(pkg); setTab('query') }}
          />
        ) : null}
        {tab === 'history' ? (
          <HistoryTab run={run} names={watchNames} />
        ) : null}
      </div>
      <div className="dshn-modal-foot">
        <span>{t('dataHint')}</span>
      </div>
    </ModalPortal>
  )
}
