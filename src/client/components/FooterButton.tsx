/**
 * dsh-listen-npm —— 侧边栏底部入口（sidebar.footer.action）：
 * 常驻「npm 监控」按钮，点击打开统一弹框（查询 / 监控 / 历史 三个 tab）。
 *
 * 按钮右侧小胶囊：
 * - 蓝描边：监控中的包数量（有监控时显示）；
 * - 琥珀橙【有更新】：监控的包出现新版本且未查看时显示（数据来自后台轮询器）。
 */

import { useEffect, useState } from 'react'
import { t } from '../i18n.ts'
import type { Poller } from '../poller.ts'
import type { WatchSummary } from '../store.ts'
import { NPM_LOGO } from '../logo.ts'

export interface FooterButtonProps {
  /** 打开统一弹框。 */
  onOpen(): void
  /** 上报当前会话 id（供命令通道回退复用）。 */
  reportSession?: (sessionId: string) => void
  wide?: boolean
  useSessions?: (selector: (s: { current?: string }) => unknown) => unknown
  /** 后台轮询器：摘要数据源。 */
  poller?: Poller
}

const EMPTY_SUMMARY: WatchSummary = { watching: 0, newVersions: 0 }

export function FooterButton({ onOpen, reportSession, wide = false, useSessions, poller }: FooterButtonProps) {
  const currentSessionId = useSessions
    ? (useSessions((s) => s && s.current) as string | undefined)
    : null
  if (reportSession && currentSessionId) reportSession(currentSessionId)
  // 订阅轮询器：每次刷新后更新胶囊
  const [summary, setSummary] = useState<WatchSummary>(EMPTY_SUMMARY)
  useEffect(() => {
    if (!poller) return
    const update = (): void => { setSummary(poller.getSummary()) }
    update()
    return poller.subscribe(update)
  }, [poller])
  const showWatch = summary.watching > 0
  const showNew = summary.newVersions > 0
  return (
    <div className={'dshn-footer-group' + (wide ? '' : ' dshn-footer-rail-group')}>
      <button
        type="button"
        className={'dshn-footer-btn' + (wide ? '' : ' dshn-footer-btn-rail')}
        title={t('configBtn')}
        aria-label={t('configBtn')}
        onClick={onOpen}
      >
        <img src={NPM_LOGO} alt="" className="dshn-footer-logo" />
        {wide ? <span className="dshn-footer-label">{t('configBtn')}</span> : null}
      </button>
      {showWatch || showNew ? (
        <span className="dshn-footer-caps">
          {showWatch ? (
            <span className="dshn-capsule dshn-capsule-watch" title={t('footerWatch') + ': ' + summary.watching}>
              {summary.watching}
            </span>
          ) : null}
          {showNew ? (
            <span className="dshn-capsule dshn-capsule-new" title={t('footerNewVersionTitle')}>
              {t('footerNewVersion')}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  )
}
