/**
 * dsh-listen-npm —�?npm 官方 API 调用核心（curl.exe，经宿主 subprocess 服务执行）�? *
 * �?dsh-jenkins �?jenkins.ts 同一模式：直�?spawn curl.exe，绕开 pwsh-sandbox
 * 受限令牌导致�?Schannel 问题；`-D -` 输出响应头用于解析状态码�? *
 * 数据源（均可在插件配置中替换，便于使用镜像）�? * - registry�?registryUrl>/<pkg>              全量文档（含 time / versions / readme�? * - registry�?registryUrl>/-/package/<pkg>/dist-tags   轻量 dist-tags
 * - registry�?registryUrl>/-/v1/search?text=  搜索
 * - downloads�?downloadsUrl>/point/<period>/<pkg>       周期下载量汇总（支持批量逗号分隔�? * - downloads�?downloadsUrl>/range/<period>/<pkg>       日粒度下载量（昨日起往前）
 *
 * 注意：downloads API �?scoped 包名使用原始斜杠（@scope/name），registry 则把
 * 斜杠编码�?%2F（实测两种服务的接受形式不同）�? */

import type { DailyPoint, DownloadPoint, HostCtxLike, PackageInfo, SearchItem, SubprocessService } from './types.ts'

export interface NpmDeps {
  ctx: HostCtxLike
  registryUrl: string
  downloadsUrl: string
}

const CURL_TIMEOUT = 60
/** 全量文档上限：react（约 3000 个版本）全量�?7MB，给足余量�?*/
const STDOUT_MAX = 32 * 1024 * 1024

/** npm API 错误（带本地化码，客户端�?code 显示�?英文）�?*/
export class NpmError extends Error {
  status?: number
  code?: string
  constructor(code: string, message: string, status?: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

/** 包名归一化：容忍粘贴 npm 页面链接 / 前后空白 / 统一小写 scope�?*/
export function normalizePkgName(raw: string): string {
  let name = String(raw || '').trim()
  // 粘贴�?npmjs.com/package/xxx �?registry 链接时取包名段�?  const m = name.match(/\/package\/(@?[^/?#]+)/)
  if (m) name = m[1]
  name = name.replace(/^npm:/, '')
  return name.trim()
}

/** 包名合法性（npm rules 的宽松版：scope 可选，主体字符 [a-z0-9-._~]）�?*/
export function isValidPkgName(name: string): boolean {
  if (!name || name.length > 214) return false
  if (!name.startsWith('@')) {
    return /^[a-z0-9-._~]+$/i.test(name)
  }
  const slash = name.indexOf('/')
  if (slash <= 1 || slash === name.length - 1) return false
  return /^[a-z0-9-._~]+$/i.test(name.slice(1, slash)) && /^[a-z0-9-._~]+$/i.test(name.slice(slash + 1))
}

/** registry 路径的包名编码：@ 保留�? 编码�?%2F�?*/
const registryEnc = (name: string): string =>
  encodeURIComponent(name).replace(/^%40/, '@')

/** 拆分 `-D -` 输出的响应头与响应体（兼�?\r\n �?\n 两种行尾）�?*/
function splitHeaders(stdout: string): { headers: string; body: string } {
  const i1 = stdout.indexOf('\r\n\r\n')
  if (i1 !== -1) return { headers: stdout.slice(0, i1), body: stdout.slice(i1 + 4) }
  const i2 = stdout.indexOf('\n\n')
  if (i2 !== -1) return { headers: stdout.slice(0, i2), body: stdout.slice(i2 + 2) }
  return { headers: stdout, body: '' }
}

/** 取响应头里最后一�?HTTP 状态码（重定向链末尾）�?*/
function lastStatus(headers: string): number {
  const matches = [...headers.matchAll(/HTTP\/\d(?:\.\d)?\s+(\d+)/g)]
  if (matches.length === 0) return 0
  return Number(matches[matches.length - 1][1])
}

/** 执行一�?GET（curl.exe �?subprocess �?spawn，跟随重定向）�?*/
async function npmGet(deps: NpmDeps, url: string): Promise<{ status: number; body: string }> {
  const sub = deps.ctx.get('subprocess') as SubprocessService | undefined
  if (sub === undefined) throw new NpmError('subprocess-missing', 'subprocess service unavailable')
  let curlPath: string
  try {
    curlPath = await sub.resolveExecutable('curl.exe')
  } catch {
    curlPath = await sub.resolveExecutable('curl')
  }
  let cwd = '.'
  const policy = deps.ctx.get('sandboxPolicy') as { workspaceRoot?: string } | undefined
  if (policy !== undefined && typeof policy.workspaceRoot === 'string' && policy.workspaceRoot.length > 0) cwd = policy.workspaceRoot
  const argv = [curlPath, '-sS', '-L', '-m', String(CURL_TIMEOUT), '-D', '-', '-H', 'accept: application/json', url]
  let handle: Awaited<ReturnType<SubprocessService['spawn']>>
  try {
    handle = await sub.spawn({
      argv,
      cwd,
      stdio: {
        stdin: 'ignore',
        stdout: { mode: 'collect', maxBytes: STDOUT_MAX },
        stderr: { mode: 'collect', maxBytes: 64 * 1024 },
      },
      graceMs: 5000,
    })
  } catch (e) {
    throw new NpmError('network-failed', 'spawn curl failed: ' + ((e && (e as Error).message) || String(e)))
  }
  try {
    await handle.done
  } catch (e) {
    throw new NpmError('network-failed', 'spawn curl failed: ' + ((e && (e as Error).message) || String(e)))
  }
  const stdout = handle.collected && handle.collected.stdout ? handle.collected.stdout.readFrom(0).text : ''
  const stderr = handle.collected && handle.collected.stderr ? handle.collected.stderr.readFrom(0).text : ''
  const exitCode = (await handle.done).exitCode
  if (exitCode !== 0 && exitCode !== null) {
    throw new NpmError('network-failed', 'curl exit ' + exitCode + ((stderr || '').trim() ? ': ' + stderr.trim().slice(0, 200) : ''))
  }
  const parsed = splitHeaders(stdout)
  return { status: lastStatus(parsed.headers), body: parsed.body }
}

/** GET 并解�?JSON；非 2xx / downloads 错误载荷统一�?NpmError�?*/
async function npmGetJson(deps: NpmDeps, url: string, source: 'registry' | 'downloads'): Promise<unknown> {
  const res = await npmGet(deps, url)
  if (res.status === 404) throw new NpmError('pkg-not-found', 'HTTP 404: ' + url, 404)
  if (res.status === 429) throw new NpmError('rate-limited', 'HTTP 429: rate limited', 429)
  if (res.status >= 400) throw new NpmError('registry-http', 'HTTP ' + res.status + ': ' + url, res.status)
  let parsed: unknown
  try {
    parsed = JSON.parse(res.body)
  } catch {
    throw new NpmError('parse-failed', 'invalid JSON from ' + source)
  }
  // downloads API 对不存在的包返回 200 + { error: "package x not found" }�?  if (source === 'downloads' && parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const err = (parsed as { error?: unknown }).error
    if (typeof err === 'string' && err.length > 0) throw new NpmError('pkg-not-found', err, 404)
  }
  return parsed
}

const registryBase = (deps: NpmDeps): string => deps.registryUrl.replace(/\/+$/, '')
const downloadsBase = (deps: NpmDeps): string => deps.downloadsUrl.replace(/\/+$/, '')

/* ── 各数据端�?─────────────────────────────────────────────────── */

/** 轻量 dist-tags（监控刷新用，响应极小）�?*/
export async function fetchDistTags(deps: NpmDeps, name: string): Promise<Record<string, string>> {
  const parsed = await npmGetJson(deps, `${registryBase(deps)}/-/package/${registryEnc(name)}/dist-tags`, 'registry')
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new NpmError('parse-failed', 'dist-tags must be an object')
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v
  }
  return out
}

export interface FullDocResult {
  info: PackageInfo
}

/**
 * 全量文档 �?规范�?PackageInfo�? * readme 截断�?6000 字符；versions 按发布时间倒序截断�?100 个�? */
export async function fetchPackageInfo(deps: NpmDeps, name: string): Promise<FullDocResult> {
  const doc = await npmGetJson(deps, `${registryBase(deps)}/${registryEnc(name)}`, 'registry') as Record<string, unknown>
  if (!doc || typeof doc !== 'object') throw new NpmError('parse-failed', 'registry doc must be an object')
  if (typeof doc.name !== 'string' || doc.name.length === 0) throw new NpmError('pkg-not-found', 'package not found: ' + name, 404)

  const distTags = doc['dist-tags'] && typeof doc['dist-tags'] === 'object' && !Array.isArray(doc['dist-tags'])
    ? doc['dist-tags'] as Record<string, string>
    : {}
  const latest = typeof distTags.latest === 'string' ? distTags.latest : undefined

  const time = (doc.time && typeof doc.time === 'object' && !Array.isArray(doc.time) ? doc.time : {}) as Record<string, string>
  const versionsMap = (doc.versions && typeof doc.versions === 'object' && !Array.isArray(doc.versions) ? doc.versions : {}) as Record<string, Record<string, unknown>>
  const versionNames = Object.keys(versionsMap)

  // versions 按发布时间倒序（缺时间的沉底），截�?100 个�?  const briefs = versionNames
    .map((v) => ({ version: v, time: time[v] || undefined, latest: v === latest }))
    .sort((a, b) => (b.time ? Date.parse(b.time) : 0) - (a.time ? Date.parse(a.time) : 0))
    .slice(0, 100)

  const latestManifest = (latest !== undefined && versionsMap[latest] !== undefined ? versionsMap[latest] : undefined) || undefined
  const latestDist = (latestManifest && latestManifest.dist && typeof latestManifest.dist === 'object' ? latestManifest.dist : {}) as Record<string, unknown>

  // author：字符串�?{ name, email } 两种形态�?  const authorRaw = doc.author
  const author = typeof authorRaw === 'string'
    ? authorRaw
    : authorRaw && typeof authorRaw === 'object' && typeof (authorRaw as { name?: unknown }).name === 'string'
      ? String((authorRaw as { name: string }).name)
      : undefined

  // repository：{ url } 或字符串 �?网页地址（github.com/... 去掉 git+ 前缀�?.git 后缀）�?  const repoRaw = doc.repository
  let repository: string | undefined
  const repoUrl = typeof repoRaw === 'string' ? repoRaw : repoRaw && typeof repoRaw === 'object' && typeof (repoRaw as { url?: unknown }).url === 'string' ? String((repoRaw as { url: string }).url) : ''
  if (repoUrl) {
    repository = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '').replace(/^git:\/\//, 'https://').replace(/^ssh:\/\/git@/, 'https://')
  }

  const bugsRaw = doc.bugs
  const bugs = typeof bugsRaw === 'string' ? bugsRaw : bugsRaw && typeof bugsRaw === 'object' && typeof (bugsRaw as { url?: unknown }).url === 'string' ? String((bugsRaw as { url: string }).url) : undefined

  const readmeRaw = typeof doc.readme === 'string' ? doc.readme : ''
  const maintainers = Array.isArray(doc.maintainers)
    ? (doc.maintainers as Array<unknown>).map((m) => {
      const o = (m && typeof m === 'object' ? m : {}) as { name?: unknown; email?: unknown }
      return { name: typeof o.name === 'string' ? o.name : undefined, email: typeof o.email === 'string' ? o.email : undefined }
    }).slice(0, 20)
    : undefined

  const strRecord = (v: unknown): Record<string, string> | undefined => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined
    const out: Record<string, string> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === 'string') out[k] = val
    }
    return Object.keys(out).length > 0 ? out : undefined
  }

  const keywords = Array.isArray(doc.keywords)
    ? (doc.keywords as unknown[]).filter((k): k is string => typeof k === 'string').slice(0, 30)
    : undefined

  const info: PackageInfo = {
    name: doc.name,
    description: typeof doc.description === 'string' ? doc.description : undefined,
    latest,
    distTags: Object.keys(distTags).length > 0 ? distTags : undefined,
    license: typeof doc.license === 'string' ? doc.license : undefined,
    author,
    homepage: typeof doc.homepage === 'string' ? doc.homepage : undefined,
    repository,
    bugs,
    keywords,
    maintainers,
    created: time.created || undefined,
    modified: time.modified || undefined,
    versionsCount: versionNames.length,
    versions: briefs,
    latestDetail: latestManifest === undefined
      ? undefined
      : {
        publishTime: time[latest || ''] || undefined,
        fileCount: typeof latestDist.fileCount === 'number' ? latestDist.fileCount : undefined,
        unpackedSize: typeof latestDist.unpackedSize === 'number' ? latestDist.unpackedSize : undefined,
        dependencies: strRecord(latestManifest.dependencies),
        devDependencies: strRecord(latestManifest.devDependencies),
        peerDependencies: strRecord(latestManifest.peerDependencies),
        engines: strRecord(latestManifest.engines),
        tarball: typeof latestDist.tarball === 'string' ? latestDist.tarball : undefined,
        shasum: typeof latestDist.shasum === 'string' ? latestDist.shasum : undefined,
        npmUser: latestManifest._npmUser && typeof (latestManifest._npmUser as { name?: unknown }).name === 'string'
          ? String((latestManifest._npmUser as { name: string }).name)
          : undefined,
      },
    readme: readmeRaw ? readmeRaw.slice(0, 6000) : undefined,
    readmeTruncated: readmeRaw.length > 6000,
  }
  return { info }
}

/** 日粒度下载量（range/last-week �?range/last-month，按时间正序返回）�?*/
export async function fetchDailyRange(deps: NpmDeps, name: string, range: 'last-week' | 'last-month'): Promise<{ start: string; end: string; downloads: DailyPoint[] }> {
  const parsed = await npmGetJson(deps, `${downloadsBase(deps)}/range/${range}/${encodeURIComponent(name)}`, 'downloads') as Record<string, unknown>
  const rawList = Array.isArray(parsed.downloads) ? parsed.downloads : []
  const downloads: DailyPoint[] = []
  for (const item of rawList) {
    const o = (item && typeof item === 'object' ? item : {}) as { day?: unknown; downloads?: unknown }
    if (typeof o.day === 'string') downloads.push({ day: o.day, downloads: typeof o.downloads === 'number' ? o.downloads : 0 })
  }
  return {
    start: typeof parsed.start === 'string' ? parsed.start : '',
    end: typeof parsed.end === 'string' ? parsed.end : '',
    downloads,
  }
}

/** 单周期下载量汇总（point/last-day|last-week|last-month|last-year）�?*/
export async function fetchPoint(deps: NpmDeps, name: string, period: string): Promise<DownloadPoint> {
  const parsed = await npmGetJson(deps, `${downloadsBase(deps)}/point/${period}/${encodeURIComponent(name)}`, 'downloads') as Record<string, unknown>
  return {
    downloads: typeof parsed.downloads === 'number' ? parsed.downloads : 0,
    start: typeof parsed.start === 'string' ? parsed.start : '',
    end: typeof parsed.end === 'string' ? parsed.end : '',
  }
}

/**
 * 批量周期下载量（point/<period>/<pkg1,pkg2,�?，一次请求覆盖整个监控列表）�? *
 * 注意：downloads API 的批量接�?*不支�?scoped �?*（服务端 400�? * "scoped packages are not currently supported in bulk lookups"），调用方需
 * 先把 scoped 包拆出去单独查（�?ops.ts �?watchRefresh）。包名逐个编码�? * 分隔逗号保持原样（服务端按裸逗号切分）�? */
export async function fetchBulkPoints(deps: NpmDeps, names: string[], period: string): Promise<Record<string, DownloadPoint>> {
  if (names.length === 0) return {}
  if (names.some((n) => n.startsWith('@'))) throw new NpmError('bulk-scoped', 'bulk downloads API does not support scoped packages')
  const joined = names.map((n) => encodeURIComponent(n)).join(',')
  const parsed = await npmGetJson(deps, `${downloadsBase(deps)}/point/${period}/${joined}`, 'downloads') as Record<string, unknown>
  const out: Record<string, DownloadPoint> = {}
  if (parsed && typeof parsed === 'object') {
    for (const [key, value] of Object.entries(parsed)) {
      const o = (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as { downloads?: unknown; start?: unknown; end?: unknown }
      out[key] = {
        downloads: typeof o.downloads === 'number' ? o.downloads : 0,
        start: typeof o.start === 'string' ? o.start : '',
        end: typeof o.end === 'string' ? o.end : '',
      }
    }
  }
  return out
}

/** registry 搜索�?-/v1/search），供弹框输入联想�?*/
export async function searchPackages(deps: NpmDeps, text: string, size: number): Promise<SearchItem[]> {
  const capped = Math.max(1, Math.min(20, size))
  const url = `${registryBase(deps)}/-/v1/search?text=${encodeURIComponent(text)}&size=${capped}`
  const parsed = await npmGetJson(deps, url, 'registry') as { objects?: unknown }
  const objects = Array.isArray(parsed.objects) ? parsed.objects : []
  const out: SearchItem[] = []
  for (const obj of objects) {
    const o = (obj && typeof obj === 'object' ? obj : {}) as Record<string, unknown>
    const pkg = (o.package && typeof o.package === 'object' ? o.package : {}) as Record<string, unknown>
    const dl = (o.downloads && typeof o.downloads === 'object' ? o.downloads : {}) as Record<string, unknown>
    const publisher = (pkg.publisher && typeof pkg.publisher === 'object' ? pkg.publisher : {}) as { actor?: { name?: unknown } }
    const links = (pkg.links && typeof pkg.links === 'object' ? pkg.links : {}) as Record<string, unknown>
    out.push({
      name: typeof pkg.name === 'string' ? pkg.name : '',
      version: typeof pkg.version === 'string' ? pkg.version : undefined,
      description: typeof pkg.description === 'string' ? pkg.description : undefined,
      keywords: Array.isArray(pkg.keywords) ? (pkg.keywords as unknown[]).filter((k): k is string => typeof k === 'string').slice(0, 8) : undefined,
      weekly: typeof dl.weekly === 'number' ? dl.weekly : undefined,
      monthly: typeof dl.monthly === 'number' ? dl.monthly : undefined,
      dependents: typeof o.dependents === 'number' ? o.dependents : undefined,
      publisher: publisher.actor && typeof publisher.actor.name === 'string' ? publisher.actor.name : undefined,
      date: typeof pkg.date === 'string' ? pkg.date : undefined,
    })
    if (out.length >= capped) break
  }
  return out
}
