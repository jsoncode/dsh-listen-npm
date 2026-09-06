/**
 * dsh-listen-npm —�?npm 包监控插�?· 宿主半边（可发布组合包，无硬编码路径）�? *
 * - 插件数据（监控列�?+ 快照历史）持久化�?$DSH_HOME/dsh-listen-npm.json�? * - `/dsh-listen-npm/api` HTTP 路由（webServer 注册 + 信任围栏）：浏览器半�? *   （查询弹�?/ 监控列表 / 后台轮询）经 fetch 调用，参数为 JSON
 *   （{ op: 'config|info|downloads|search|watchList|watchAdd|watchRemove|watchRefresh|watchSeen|history' }），
 *   结果�?JSON 信封回传。请求不进入对话命令通道，页面不会出�?command 节点�? * - `dsh-listen-npm` 命令：保留兼容（用户/模型在对话中显式执行时可用）�? * - 三个模型工具 dsh_npm_info / dsh_npm_downloads / dsh_npm_watch�? *
 * 数据源：npm 官方 registry（元数据）与 api.npmjs.org（下载量），均可在插�? * 配置中替换为镜像地址�? *
 * 运行时依赖（@deepseek-ai/*）由 package.json �?peerDependencies 声明�? * 安装时由宿主解析，本文件不含任何绝对路径�? */

import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http'
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import { isTrustedApiRequest } from './fence.ts'
import { runOp, type InfoPayload } from './ops.ts'
import type { OpRequest, PackageInfo, PluginConfig } from './types.ts'
import { EMPTY_STORE, loadStore, resolveStoreDir, saveStore } from './store.ts'
import type { NpmStoreData } from './store.ts'

export const name = 'dsh-listen-npm'
export const inject = ['shell', 'tools', 'settings', 'commands']

/* ── 配置（docs/develop/basic/config）────────────────────────── */

export const Config: import('@deepseek-ai/schemastery').default<PluginConfig> = Schema.object({
  registryUrl: Schema.string().default('https://registry.npmjs.org').description('npm registry 地址（国内可�?https://registry.npmmirror.com 镜像�?),
  downloadsUrl: Schema.string().default('https://api.npmjs.org/downloads').description('下载量统�?API 地址'),
  refreshMinutes: Schema.number().default(10).description('监控列表自动刷新间隔（分钟）'),
})

/** 宿主 commands 服务最小视图�?*/
interface CommandsService {
  register(def: Record<string, unknown>): unknown
}

/** 宿主 settings 服务最小视图�?*/
interface SettingsService {
  /** 本地文件 provider 的用户可编辑文档绝对路径（用于推�?$DSH_HOME）�?*/
  documentPath?: string
}

/** 宿主 webServer 服务最小视图（@deepseek-ai/dsh-host-webserver）�?*/
interface WebServerService {
  register(route: {
    kind: 'exact' | 'prefix'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

/** webRuntime 服务最小视图（@deepseek-ai/dsh-web-app 提供，绑定派生的受信任主机）�?*/
interface WebRuntimeService {
  trustedHosts?: readonly string[]
}

/** /dsh-listen-npm/api 信封：{ ok: true, value } 成功；{ ok: false, error } 路由级失败�?*/
interface ApiEnvelope {
  ok: boolean
  value?: unknown
  error?: { code?: string; message?: string }
}

const API_BODY_LIMIT = 1 << 20

function writeApiJson(res: ServerResponse, status: number, body: ApiEnvelope): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

export function apply(ctx: Context, config: Partial<PluginConfig> = {}) {
  const shell = ctx.get('shell')
  if (shell === undefined) return
  const settings = ctx.get<SettingsService>('settings')
  const commands = ctx.get<CommandsService>('commands')

  // ── 插件数据存储�?DSH_HOME/dsh-listen-npm.json ──────────────
  const storeDir = resolveStoreDir(settings?.documentPath)
  const mirror: NpmStoreData = EMPTY_STORE()
  let storeReady: Promise<void> = Promise.resolve()

  storeReady = (async () => {
    try {
      const loaded = await loadStore(storeDir)
      if (loaded !== null) {
        mirror.watch = loaded.watch
        mirror.snapshots = loaded.snapshots
      }
    } catch (e) {
      console.warn('[dsh-listen-npm] store init failed, using in-memory only', e instanceof Error ? e.message : String(e))
    }
  })()
  storeReady.catch(() => { /* 初始化失败不抛出（内部已告警�?*/ })

  const readStore = (): NpmStoreData => mirror
  const writeStore = async (data: NpmStoreData): Promise<void> => {
    await saveStore(storeDir, data)
  }

  const cfg: PluginConfig = {
    registryUrl: (config.registryUrl || 'https://registry.npmjs.org').replace(/\/+$/, ''),
    downloadsUrl: (config.downloadsUrl || 'https://api.npmjs.org/downloads').replace(/\/+$/, ''),
    refreshMinutes: typeof config.refreshMinutes === 'number' && config.refreshMinutes > 0 ? config.refreshMinutes : 10,
  }

  const deps = { ctx, readStore, writeStore, ...cfg, storeReady }

  // ─── 浏览�?HTTP API�?dsh-listen-npm/api）────────────────
  // 浏览器半边（查询弹框 / 监控列表 / 后台轮询）默认经此路由与宿主通信�?  // 请求不进入对话命令通道，因此不会在会话中产�?command 节点。路由带浏览�?  // 信任围栏（loopback Host / webRuntime.trustedHosts + 同源标记）�?  // webServer 缺失（如 headless 组合）时静默跳过，客户端自动回退到命令通道�?  const webServer = ctx.get<WebServerService>('webServer')
  const webRuntime = ctx.get<WebRuntimeService>('webRuntime')
  if (webServer !== undefined) {
    const fence = (headers: IncomingHttpHeaders): boolean =>
      isTrustedApiRequest(headers, webRuntime?.trustedHosts ?? [])
    try {
      webServer.register({
        kind: 'exact',
        path: '/dsh-listen-npm/api',
        handler: async (req, res) => {
          if (!fence(req.headers)) {
            writeApiJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'forbidden' } })
            return
          }
          if (req.method !== 'POST') {
            writeApiJson(res, 405, { ok: false, error: { code: 'method-error', message: 'method not allowed' } })
            return
          }
          // 有界读取请求体（防御未绑定的大体）�?          const chunks: Buffer[] = []
          let total = 0
          for await (const chunk of req) {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
            total += buffer.length
            if (total > API_BODY_LIMIT) {
              writeApiJson(res, 413, { ok: false, error: { code: 'body-too-large', message: 'request body too large' } })
              return
            }
            chunks.push(buffer)
          }
          const text = Buffer.concat(chunks).toString('utf8')
          let request: OpRequest = { op: '' }
          if (text.trim().length > 0) {
            try {
              request = JSON.parse(text) as OpRequest
            } catch {
              writeApiJson(res, 400, { ok: false, error: { code: 'params-invalid', message: 'Parameters must be JSON' } })
              return
            }
          }
          try {
            const payload = await runOp(deps, request)
            writeApiJson(res, 200, { ok: true, value: payload })
          } catch (e) {
            // runOp 内部已兜底大部分分支；此处防御性映射为与命�?handler 相同的错误载荷�?            writeApiJson(res, 200, {
              ok: true,
              value: { ok: false, code: 'op-failed', error: e instanceof Error ? e.message : String(e) },
            })
          }
        },
      })
    } catch { /* 热重载重复注册（kind,path 冲突）时幂等忽略 */ }
  }

  // ─── 命令入口（保留兼容：用户/模型在对话中显式执行时可用）──────

  if (commands !== undefined) {
    (commands as CommandsService).register({
      name: 'dsh-listen-npm',
      description: 'npm 包监控：查询 npm 包信息与每日安装量，管理监控列表。Query npm package info with daily install counts and manage the watch list. 参数�?JSON�?
        + '{ "op": "config|info|downloads|search|watchList|watchAdd|watchRemove|watchRefresh|watchSeen|history", ... }�?,
      input: { hint: '{"op":"info","pkg":"vue"}' },
      recordInput: true,
      handler: async (invocation: { rawInput?: string }): Promise<{ kind: 'success' | 'error'; text: string }> => {
        const raw = (invocation.rawInput ?? '').trim()
        let req: OpRequest = { op: '' }
        if (raw.length > 0) {
          try { req = JSON.parse(raw) } catch {
            return { kind: 'error', text: JSON.stringify({ ok: false, code: 'params-invalid', error: 'Parameters must be JSON' }) }
          }
        }
        try {
          const payload = await runOp(deps, req)
          return { kind: 'success', text: JSON.stringify(payload) }
        } catch (e) {
          return { kind: 'error', text: JSON.stringify({ ok: false, code: 'op-failed', error: e instanceof Error ? e.message : String(e) }) }
        }
      },
    })
  }

  // ─── 模型工具（docs/develop/basic/tool）────────────────────────

  const fmtInt = (n: number | undefined): string =>
    typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('en-US') : '�?

  ctx.tools.register(defineTool({
    name: 'dsh_npm_info',
    description: '查询一�?npm 包的完整信息：最新版本、描述、许可证、作者、链接、发布时间、版本总数与昨�?�?�?�?0�?近一年下载量。Query full info of an npm package: latest version, description, license, author, links, publish times, and day/week/month/year download counts.',
    parameters: {
      pkg: { type: 'string', required: true, description: 'npm 包名，如 vue �?@vue/core（也接受 npmjs.com/package/... 链接�? },
    },
    output: {
      schema: { type: 'string' },
      render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
    },
    async execute(args: { pkg: string }) {
      await storeReady
      const r = await runOp(deps, { op: 'info', pkg: args.pkg })
      if (!r.ok) {
        const code = typeof r.code === 'string' ? r.code : 'op-failed'
        const why = code === 'pkg-not-found' ? '未找到该 npm �?/ package not found' : (r.error || code)
        return '查询失败�? + why
      }
      const info = r.info as PackageInfo
      const points = r.points as InfoPayload['points']
      const lines: string[] = []
      lines.push(`${info.name}${info.latest ? '@' + info.latest : ''}${info.license ? '（license: ' + info.license + '�? : ''}`)
      if (info.description) lines.push('描述: ' + info.description)
      if (info.author) lines.push('作�? ' + info.author)
      if (info.homepage) lines.push('主页: ' + info.homepage)
      if (info.repository) lines.push('仓库: ' + info.repository)
      if (info.keywords && info.keywords.length > 0) lines.push('关键�? ' + info.keywords.join(', '))
      const created = info.created ? info.created.slice(0, 10) : '�?
      const modified = info.modified ? info.modified.slice(0, 10) : '�?
      const latestTime = info.latestDetail?.publishTime ? info.latestDetail.publishTime.slice(0, 19).replace('T', ' ') : '�?
      lines.push(`发布: 最新版 ${latestTime} · 首次发布 ${created} · 最近更�?${modified} · �?${info.versionsCount ?? '�?} 个版本`)
      lines.push(`下载�? 昨日 ${fmtInt(points.day?.downloads)} · �?�?${fmtInt(points.week?.downloads)} · �?0�?${fmtInt(points.month?.downloads)} · 近一�?${fmtInt(points.year?.downloads)}`)
      const daily = (r.daily as Array<{ day: string; downloads: number }>) || []
      if (daily.length > 0) {
        const recent = daily.slice(-7).map((p) => `${p.day}=${fmtInt(p.downloads)}`).join(', ')
        lines.push('�?7 天日下载�? ' + recent)
      }
      if (info.maintainers && info.maintainers.length > 0) {
        lines.push('维护�? ' + info.maintainers.map((m) => m.name || m.email || '').filter(Boolean).join(', '))
      }
      lines.push(`数据�? ${deps.registryUrl} + ${deps.downloadsUrl}`)
      return lines.join('\n')
    },
  }) as never)

  ctx.tools.register(defineTool({
    name: 'dsh_npm_downloads',
    description: '查询一�?npm 包的每日下载量（安装量）时间序列，近一周或近一月（日粒度）。Query the daily downloads (install counts) time series of an npm package, last week or last month, day granularity.',
    parameters: {
      pkg: { type: 'string', required: true, description: 'npm 包名，如 vue �?@vue/core' },
      range: { type: 'string', description: '可选：last-week（默认）�?last-month' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
    },
    async execute(args: { pkg: string; range?: string }) {
      await storeReady
      const range = args.range === 'last-month' ? 'last-month' : 'last-week'
      const r = await runOp(deps, { op: 'downloads', pkg: args.pkg, range })
      if (!r.ok) {
        const code = typeof r.code === 'string' ? r.code : 'op-failed'
        const why = code === 'pkg-not-found' ? '未找到该 npm �?/ package not found' : (r.error || code)
        return '查询失败�? + why
      }
      const daily = (r.downloads as Array<{ day: string; downloads: number }>) || []
      if (daily.length === 0) return `�?${String(r.pkg)} �?${String(r.start)} ~ ${String(r.end)} 区间内没有下载量数据。`
      const total = daily.reduce((acc, p) => acc + p.downloads, 0)
      const lines = daily.map((p) => `${p.day}: ${fmtInt(p.downloads)}`)
      return `�?${String(r.pkg)} 每日下载量（${String(r.start)} ~ ${String(r.end)}，共 ${daily.length} 天，合计 ${fmtInt(total)}）：\n` + lines.join('\n')
    },
  }) as never)

  ctx.tools.register(defineTool({
    name: 'dsh_npm_watch',
    description: '管理 npm 包监控列表（本插件持久化，GUI 弹框与自动轮询共用）：添�?移除/列出/立即刷新。Manage the npm watch list persisted by this plugin: add / remove / list / refresh now.',
    parameters: {
      action: { type: 'string', required: true, description: 'list | add | remove | refresh' },
      pkg: { type: 'string', description: 'add/remove/refresh 时必填：npm 包名' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
    },
    async execute(args: { action: string; pkg?: string }) {
      await storeReady
      const action = String(args.action || 'list')
      if (action === 'list') {
        const r = await runOp(deps, { op: 'watchList' })
        const watch = (r.watch as Array<Record<string, unknown>>) || []
        if (watch.length === 0) return '监控列表为空。可�?dsh_npm_watch(action="add", pkg="...") 添加�?
        return '监控列表�? + watch.length + ' 个）：\n' + watch.map((w) =>
          `- ${w.name}：latest ${String(w.lastVersion ?? '�?)} · 昨日 ${fmtInt(w.lastDay as number | undefined)} · �?�?${fmtInt(w.lastWeek as number | undefined)}${w.hasNewVersion ? ' · ⚠️ 有新版本' : ''}`,
        ).join('\n')
      }
      if (action === 'add') {
        const r = await runOp(deps, { op: 'watchAdd', pkg: args.pkg })
        if (!r.ok) return r.code === 'watch-duplicate' ? `�?${args.pkg} 已在监控列表中。` : '添加失败�? + String(r.error || r.code)
        return `已加入监控：${String((r.entry as { name?: string }).name)}（latest ${String((r.entry as { lastVersion?: string }).lastVersion ?? '�?)}）。GUI 将按配置间隔自动刷新。`
      }
      if (action === 'remove') {
        const r = await runOp(deps, { op: 'watchRemove', pkg: args.pkg })
        if (!r.ok) return '移除失败�? + String(r.error || r.code)
        return '已移出监控：' + String(args.pkg)
      }
      if (action === 'refresh') {
        const r = await runOp(deps, { op: 'watchRefresh', pkg: args.pkg })
        if (!r.ok) return '刷新失败�? + String(r.error || r.code)
        const changes = (r.changes as Array<{ name: string; from: string; to: string }>) || []
        if (changes.length === 0) return '刷新完成：所有监控包均无版本变更�?
        return '刷新完成，发�?' + changes.length + ' 个版本变更：\n' + changes.map((c) => `- ${c.name}: ${c.from} �?${c.to}`).join('\n')
      }
      return '未知 action�? + action + '（可�?list/add/remove/refresh�?
    },
  }) as never)
}

export type { OpRequest, PluginConfig }
