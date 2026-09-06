/**
 * dsh-listen-npm —— 客户端共享类型（宿主 API 载荷的客户端视图）。
 */

/** 日粒度下载量（api.npmjs.org/downloads/range）。 */
export interface DailyPoint {
  day: string
  downloads: number
}

/** info op 返回的包完整信息。 */
export interface PackageInfoView {
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
  readme?: string
  readmeTruncated?: boolean
}

export interface DownloadPointView {
  downloads: number
  start: string
  end: string
}

/** info op 响应。 */
export interface InfoResponse {
  ok: boolean
  code?: string
  error?: string
  info?: PackageInfoView
  daily?: DailyPoint[]
  rangeStart?: string
  rangeEnd?: string
  points?: {
    day?: DownloadPointView
    week?: DownloadPointView
    month?: DownloadPointView
    year?: DownloadPointView
  }
}

/** search op 单条结果。 */
export interface SearchItemView {
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
