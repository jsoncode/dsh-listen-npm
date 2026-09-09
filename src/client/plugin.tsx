/**
 * dsh-listen-npm —— 浏览器半边插件主体（slots 注册，形态对齐 dsh-jenkins）。
 *
 * 本文件不包含 __ModuleLoader__ 包装：构建为单文件 CJS 后由 tsdown 的
 * banner/intro/footer 在构建时生成工厂包装。外部依赖（react 等）在打包时
 * external，运行时经 factory 的 require 解析到宿主模块表（seed）。
 *
 * 入口结构：
 * - sidebar.footer.action：常驻「npm 监控」按钮（右侧小胶囊只显示监控数量，
 *   不做任何版本更新提示），点击打开统一弹框；显隐跟随「在菜单中显示」偏好
 *   （默认开启）；
 * - settings.section（dsh-listen-npm）：宿主「设置 → npm 监控」分区页 ——
 *   「在菜单中显示」开关 + 打开插件弹框的入口（footer 入口关闭后的唯一入口）；
 * - shell.overlay（dsh-listen-npm）：统一弹框，三个 tab —— 查询 / 监控 / 历史；
 * - conversation.chat.commandview：兜底隐藏对话中显式执行命令的内部 JSON 卡片。
 *
 * 后台轮询器与弹框生命周期解耦：按宿主配置间隔自动刷新监控列表，关闭弹框后
 * 仍持续跟踪版本与下载量变化。
 */

import type { ReactNode } from 'react'
import { injectStyles } from './styles.ts'
import { makeRun, type RunFn } from './rpc.ts'
import { makeModalStore, makeNumberStore, makeSummaryStore } from './store.ts'
import { createPoller } from './poller.ts'
import { FooterButton } from './components/FooterButton.tsx'
import { PluginSettingsPage } from './components/PluginSettingsPage.tsx'
import { NpmModal } from './components/NpmModal.tsx'
import { t, setLang } from './i18n.ts'

/** 宿主 slots 服务最小视图。 */
interface SlotsService {
  inject(name: string, fn: () => unknown): unknown
  register(def: Record<string, unknown>, component: unknown): () => void
}

/** 侧边栏 footer 插槽 key 与本插件入口 id。 */
const FOOTER_SLOT = 'sidebar.footer.action'
const FOOTER_ENTRY_ID = 'dsh-listen-npm'
const OVERLAY_ID = 'dsh-listen-npm'

/** 宿主设置对话框里本插件分区页的注册 id（settings.section 的 only 过滤键）。 */
const SECTION_ID = 'dsh-listen-npm'

/** 浏览器侧插件上下文（宿主注入）。 */
export interface ClientCtx {
  get<T = unknown>(name: string): T | undefined
  /** cordis 事件订阅（可选：宿主 locale 服务缺失时的 'locale/change' 兜底通道）。 */
  on?(event: string, listener: (payload: unknown) => void): unknown
  interval(callback: () => void, ms: number): () => void
  remote: {
    commands: {
      execute(sessionId: string, command: string): Promise<unknown>
    }
  }
}

export interface ClientPluginModule {
  name: string
  inject: string[]
  apply(ctx: ClientCtx): void
}

export function createPlugin(): ClientPluginModule {
  return {
    name: 'dsh-listen-npm',
    inject: ['slots', 'remote', 'remote.commands', 'timer'],

    apply(ctx: ClientCtx) {
      // ─── 语言跟随宿主：订阅宿主 locale 服务（软依赖）─────────────────
      interface LocaleFace {
        getSnapshot(): { active: string }
        subscribe(fn: () => void): () => void
      }
      const toLang = (active: string): 'zh' | 'en' => (/^zh/i.test(active) ? 'zh' : 'en')
      const locale = ctx.get<LocaleFace>('locale')
      if (locale !== undefined) {
        const syncLang = (): void => { setLang(toLang(locale.getSnapshot().active)) }
        syncLang()
        locale.subscribe(syncLang)
      } else if (typeof ctx.on === 'function') {
        ctx.on('locale/change', (snapshot: unknown) => {
          const active = (snapshot as { active?: string } | undefined)?.active
          if (typeof active === 'string') setLang(toLang(active))
        })
      }

      const run: RunFn = makeRun(ctx)
      const slots = ctx.get<SlotsService>('slots')
      if (slots === undefined) return
      injectStyles()

      // ─── 共享状态 ────────────────────────────────────────────────
      const { useOpen, open: openModal, close: closeModal } = makeModalStore()
      const summaryStore = makeSummaryStore()
      const refreshMinutesStore = makeNumberStore(10)

      // 当前会话 id 追踪：footer 入口挂载时上报（命令通道回退用）。
      const sessionRef: { current: string } = { current: '' }
      const getSession = (): string => sessionRef.current
      // 包装 run：调用方未传会话 id（''）时回退到已追踪的会话 id。
      const runWithSession: RunFn = (sessionId, op) => run(sessionId || getSession(), op)

      // ─── 后台轮询器：监控列表自动刷新 + footer 摘要 ───────────────
      // 启动引导拉取 config（刷新间隔）与当前监控列表；到点自动 watchRefresh。
      const poller = createPoller(runWithSession, summaryStore)
      // 3s 心跳：轮询器到点刷新监控列表；同时兼作样式看门狗 —— 宿主 client-hmr
      // 重载插件时会回收本插件的 <style>（data-plugin 归属），此处按需补回。
      ctx.interval(() => {
        injectStyles()
        poller.tick()
      }, 3000)
      poller.bootstrap()
      void runWithSession('', { op: 'config' }).then((cfg) => {
        if (cfg && cfg.ok && typeof cfg.refreshMinutes === 'number' && cfg.refreshMinutes > 0) {
          refreshMinutesStore.set(cfg.refreshMinutes)
        }
      }).catch(() => { /* 用默认间隔 */ })

      // ─── 对话中的命令行：兜底不渲染内部 JSON 结果 ─────────────────
      try {
        slots.inject('conversation.chat.commandview', () => slots.register(
          { name: 'conversation.chat.commandview', key: 'dsh-listen-npm', priority: 0 },
          () => null,
        ))
      } catch { /* 插槽未声明时静默降级（通用命令卡片渲染） */ }

      // ─── 侧边栏底部入口：常驻「npm 监控」按钮 ─────────────────────
      // order: 21 —— 排在 dsh-jenkins（order 20）之后，宿主按声明 order 升序渲染。
      slots.inject(FOOTER_SLOT, () => slots.register(
        { name: FOOTER_SLOT, id: FOOTER_ENTRY_ID, order: 21 },
        (props: Record<string, unknown>) => (
          <FooterButton
            onOpen={openModal}
            reportSession={(s) => { if (s) sessionRef.current = s }}
            wide={props.wide as boolean | undefined}
            useSessions={props.useSessions as FooterWorkspaceHooks['useSessions']}
            poller={poller}
          />
        ),
      ))

      // ─── 宿主「设置 → npm 监控」分区页（settings.section）──────────
      // 页面承载「在菜单中显示」开关（与 footer 入口同一偏好源）+ 打开插件
      // 弹框的入口：侧栏入口被关闭后，这里是唯一可达入口。order 43 排在宿主
      // 内置 sections 与 dsh-jenkins（order 41）之后；label 用本插件既有的
      // 导航文案 key（与 footer 入口同名，跟随界面语言）。
      slots.inject('settings.section', () => slots.register(
        {
          name: 'settings.section',
          id: SECTION_ID,
          order: 43,
          label: () => t('configBtn'),
        },
        (props: Record<string, unknown>) => (
          <PluginSettingsPage
            onOpen={openModal}
            close={typeof props.close === 'function' ? (props.close as () => void) : () => { /* 宿主未提供 close 时忽略 */ }}
          />
        ),
      ))

      // ─── 统一「npm 包监控」弹框（查询 / 监控 / 历史 三个 tab）──────
      slots.inject('shell.overlay', () => slots.register(
        { name: 'shell.overlay', id: OVERLAY_ID, order: 100 },
        () => (
          <NpmModal
            run={runWithSession}
            useOpen={useOpen}
            close={closeModal}
            poller={poller}
            useSummary={summaryStore.useSummary}
            useRefreshMinutes={refreshMinutesStore.use}
          />
        ),
      ))
    },
  }
}

/** footer slot 宿主注入的 hooks 形状。 */
interface FooterWorkspaceHooks {
  useSessions(selector: (s: { current?: string }) => unknown): unknown
}

export type { ReactNode }
