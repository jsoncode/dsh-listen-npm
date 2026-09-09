/**
 * dsh-listen-npm —— 侧边栏底部入口（sidebar.footer.action）：
 * 常驻「npm 监控」按钮，点击打开统一弹框（查询 / 监控 / 历史 三个 tab）。
 *
 * 按钮右侧小胶囊：蓝描边 = 监控中的包数量（有监控时显示）。
 * 版本变化**不在入口做任何提示**（没有「有更新」标签，也没有版本号胶囊），
 * 只在「历史」tab 的快照时间线里体现。
 *
 * 显隐跟随「在菜单中显示」偏好（prefs.ts 的 showInMenuStore，默认开启）：
 * 关闭后本组件渲染 null（不占位、不订阅轮询摘要）。偏好源与宿主
 * 「设置 → npm 监控」分区页、插件弹框「监控」tab 顶部的开关同一个，
 * 改一处即刻生效，无需刷新页面。
 *
 * 图标尺寸：img 带 width/height 属性 + 内联 style 兜底（见 logo.ts）。宿主
 * 样式表缺失/被回收时，图标也不会退回 SVG 的默认替换元素尺寸把按钮撑爆。
 */

import { useEffect, useState, useSyncExternalStore } from 'react'
import { t } from '../i18n.ts'
import { showInMenuStore } from '../prefs.ts'
import type { Poller } from '../poller.ts'
import type { WatchSummary } from '../store.ts'
import { NPM_LOGO, logoStyle } from '../logo.ts'

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

/** 图标边长（px）：与 .dshn-footer-logo 保持一致。 */
const LOGO_SIZE = 26

export function FooterButton({ onOpen, reportSession, wide = false, useSessions, poller }: FooterButtonProps) {
  // 「在菜单中显示」偏好：必须在任何提前 return 之前调用（hooks 顺序稳定）。
  // 第三个参数（getServerSnapshot）供 SSR / 静态渲染测试使用；浏览器行为不变。
  const visible = useSyncExternalStore(
    showInMenuStore.subscribe,
    showInMenuStore.getSnapshot,
    showInMenuStore.getSnapshot,
  )
  const currentSessionId = useSessions
    ? (useSessions((s) => s && s.current) as string | undefined)
    : null
  // 会话 id 上报与入口显隐无关：后台轮询器依赖它。
  if (reportSession && currentSessionId) reportSession(currentSessionId)
  // 订阅轮询器：每次刷新后更新监控数量胶囊（入口隐藏时不订阅）
  const [summary, setSummary] = useState<WatchSummary>(EMPTY_SUMMARY)
  useEffect(() => {
    if (!poller || !visible) return
    const update = (): void => { setSummary(poller.getSummary()) }
    update()
    return poller.subscribe(update)
  }, [poller, visible])
  // 关闭「在菜单中显示」后不渲染任何内容（放在所有 hooks 之后，顺序稳定）。
  if (!visible) return null
  const showWatch = summary.watching > 0
  return (
    <div className={'dshn-footer-group' + (wide ? '' : ' dshn-footer-rail-group')}>
      <button
        type="button"
        className={'dshn-footer-btn' + (wide ? '' : ' dshn-footer-btn-rail')}
        title={t('configBtn')}
        aria-label={t('configBtn')}
        onClick={onOpen}
      >
        <img
          src={NPM_LOGO}
          alt=""
          className="dshn-footer-logo"
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          style={logoStyle(LOGO_SIZE)}
          draggable={false}
        />
        {wide ? <span className="dshn-footer-label">{t('configBtn')}</span> : null}
      </button>
      {showWatch ? (
        <span className="dshn-footer-caps">
          <span className="dshn-capsule dshn-capsule-watch" title={t('footerWatch') + ': ' + summary.watching}>
            {summary.watching}
          </span>
        </span>
      ) : null}
    </div>
  )
}
