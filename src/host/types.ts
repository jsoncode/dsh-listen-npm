/**
 * dsh-listen-npm —— 宿主半边共享类型。
 */

/* ── 插件配置（schemastery Config）────────────────────────────── */

export interface PluginConfig {
  registryUrl: string
  downloadsUrl: string
  refreshMinutes: number
}

/* ── 数据文件（$DSH_HOME/dsh-listen-npm.json）──────────── */

/** 监控条目：持久化最近一次检查的快照 + 变更标记。 */
export interface WatchEntry {
  /** 包名（原样，含 @scope/ 前缀）。 */
  name: string
  /** 加入监控的时间（epoch ms）。 */
  addedAt: number
  /** 最近一次成功刷新时间（epoch ms）。 */
  lastCheckAt?: number
  /** 最近一次刷新时的 latest 版本。 */
  lastVersion?: string
  /** 最近一次刷新时的昨日下载量（npm 统计的最后一个自然日）。 */
  lastDay?: number
  /** 最近一次刷新时的近 7 天下载量。 */
  lastWeek?: number
  /** 上上个快照的昨日下载量（供客户端画趋势箭头）。 */
  prevDay?: number
  /** 上上个快照的近 7 天下载量。 */
  prevWeek?: number
  /** 版本变更未读标记：刷新发现新版本后置位，watchSeen 清除。 */
  hasNewVersion?: boolean
  /** 最近一次刷新失败原因（成功后清除）。 */
  error?: string
}

/** 快照：版本变更 / 首次加入时记录，构成「历史」tab 的时间线。 */
export interface Snapshot {
  /** 记录时间（epoch ms）。 */
  at: number
  /** 当时的 latest 版本。 */
  latest: string
  /** 昨日下载量。 */
  day: number
  /** 近 7 天下载量。 */
  week: number
  /** 记录原因：init=加入监控 version-change=版本变更。 */
  note: 'init' | 'version-change'
}

/** 插件数据文件内存形态。 */
export interface NpmStoreData {
  version: number
  watch: WatchEntry[]
  /** 按包名索引的快照时间线（每包上限 200 条，新的在前）。 */
  snapshots: Record<string, Snapshot[]>
}

/* ── op 请求 / 响应 ───────────────────────────────────────────── */

export interface OpRequest {
  op: string
  [key: string]: unknown
}

export type OpResult = { ok: boolean; code?: string; error?: string } & Record<string, unknown>

/* ── npm API 规范化载荷 ───────────────────────────────────────── */

/** 日粒度下载量（api.npmjs.org/downloads/range）。 */
export interface DailyPoint {
  day: string
  downloads: number
}

/** 单周期下载量汇总（api.npmjs.org/downloads/point）。 */
export interface DownloadPoint {
  downloads: number
  start: string
  end: string
}

/** info op 返回的包完整信息（由 registry 全量文档规范化而来）。 */
export interface PackageInfo {
  name: string
  description?: string
  latest?: string
  distTags?: Record<string, string>
  license?: string
  author?: string
  homepage?: string
  repository?: string
  bugs?: string
  keywords?: string[]
  maintainers?: Array<{ name?: string; email?: string }>
  created?: string
  modified?: string
  versionsCount?: number
  /** 最近发布的版本（按发布时间倒序，截断前 100 个）。 */
  versions?: Array<{ version: string; time?: string; latest?: boolean }>
  latestDetail?: {
    publishTime?: string
    fileCount?: number
    unpackedSize?: number
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
    engines?: Record<string, string>
    tarball?: string
    shasum?: string
    npmUser?: string
  }
  /** README 纯文本摘录（截断前 6000 字符）。 */
  readme?: string
  readmeTruncated?: boolean
}

/** search op 的单条结果（registry /-/v1/search）。 */
export interface SearchItem {
  name: string
  version?: string
  description?: string
  keywords?: string[]
  weekly?: number
  monthly?: number
  dependents?: number
  publisher?: string
  date?: string
}

/* ── 宿主服务最小视图 ─────────────────────────────────────────── */

export interface HostCtxLike {
  get(name: string): unknown
}

/** subprocess 服务最小视图（@deepseek-ai/dsh-agent 提供，jenkins 同款）。 */
export interface SubprocessService {
  resolveExecutable(name: string): Promise<string>
  spawn(opts: {
    argv: string[]
    cwd?: string
    stdio?: {
      stdin?: { data: string } | 'ignore'
      stdout?: { mode: 'collect'; maxBytes: number }
      stderr?: { mode: 'collect'; maxBytes: number }
    }
    graceMs?: number
  }): Promise<{
    done: Promise<{ exitCode: number | null }>
    collected?: {
      stdout?: { readFrom(offset: number): { text: string } }
      stderr?: { readFrom(offset: number): { text: string } }
    }
  }>
}
