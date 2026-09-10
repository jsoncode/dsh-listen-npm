/**
 * dsh-listen-npm —— 浏览器半边：语言与文案（中英双语，跟随主界面语言）。
 */

/**
 * 初始语言：仅作宿主 locale 服务不可用时的兜底。运行时以 plugin.tsx 里的
 * locale 订阅为准。
 */
function resolveLang(): 'zh' | 'en' {
  if (typeof document !== 'undefined') {
    const host = document.documentElement.lang || navigator.language || 'zh-CN'
    return /^zh/i.test(host) ? 'zh' : 'en'
  }
  return 'zh'
}

/** 当前语言（可变，随宿主 locale 切换；经 setLang 更新）。 */
let lang: 'zh' | 'en' = resolveLang()

/** 读当前语言（组件内请调用此函数而非读取静态快照）。 */
export const getLang = (): 'zh' | 'en' => lang

/** 写当前语言（由宿主 locale 订阅驱动；重渲染由 slot 出口的 locale revision 订阅触发）。 */
export const setLang = (next: 'zh' | 'en'): void => {
  lang = next
}

const COPY: Record<'zh' | 'en', Record<string, unknown>> = {
  zh: {
    configBtn: 'npm 监控',
    showInMenu: '在菜单中显示',
    showInMenuDesc: '开启后，在宿主侧栏底部显示「npm 监控」入口按钮',
    openPlugin: '打开 npm 监控',
    modalTitle: 'npm 包监控',
    modalSubtitle: '查询包信息与每日安装量，跟踪你的 npm 库的变化',
    tabQuery: '查询',
    tabWatch: '监控',
    tabHistory: '历史',
    dataHint: '数据源 npm 官方 registry · 下载量 T+1 更新',
    close: '关闭',
    loading: '加载中…',
    refreshNow: '立即刷新',
    refreshedAt: '上次刷新',
    autoRefreshHint: '每 {n} 分钟自动刷新',
    // 查询 tab
    queryPlaceholder: '输入 npm 包名，如 vue / @vue/core…',
    queryBtn: '查询',
    queryFailed: '查询失败',
    searching: '搜索中…',
    searchNoMatch: '无匹配的包',
    searchPickHint: '输入包名后回车查询，或从联想列表选择',
    watchThis: '加入监控',
    watching: '已监控',
    watchAddFailed: '加入监控失败',
    watchAdded: '已加入监控列表',
    // 详情
    latestVersion: '最新',
    noDescription: '（暂无描述）',
    downloadsTitle: '下载量 / 安装量',
    dlDay: '昨日',
    dlLatest: '最新单日',
    dlWeek: '近 7 天',
    dlMonth: '近 30 天',
    dlYear: '近一年',
    // 数据延迟说明（npm 尚未统计的日期按 0 补进图表，但不计入聚合）
    lagNote: '数据截至 {end} · 最后 {n} 天 npm 尚未统计（{from} ~ {to}）已按 0 补入图表保持连续，不计入上方合计。',
    lagShort: '滞后 {n} 天',
    noDataYet: 'npm 尚未统计',
    chartPending: '末端灰柱为未统计日',
    dailyChartTitle: '每日安装量（近 30 天）',
    dailyAvg: '日均',
    peakDay: '峰值',
    rangeLabel: '统计区间',
    basicTitle: '基本信息',
    fieldCreated: '首次发布',
    fieldModified: '最近更新',
    fieldLatestPublish: '最新版发布',
    fieldVersions: '版本总数',
    fieldMaintainers: '维护者',
    fieldPkgSize: '解包大小',
    fieldFileCount: '文件数',
    fieldNode: 'Node 要求',
    fieldNpmUser: '发布者',
    fieldLicense: '许可证',
    distTagsTitle: '版本标签（dist-tags）',
    versionsTitle: '版本列表（最近发布）',
    versionsEmpty: '（无版本数据）',
    readmeTitle: 'README 摘要',
    readmeEmpty: '（该包没有 README）',
    readmeExpand: '展开全部',
    readmeCollapse: '收起',
    npmPage: 'npm 页面',
    homepage: '主页',
    repository: '仓库',
    issues: 'Issues',
    // 监控 tab
    watchPlaceholder: '输入要监控的 npm 包名…',
    watchAddBtn: '添加',
    watchEmpty: '还没有监控任何包。查询一个包后点击「加入监控」，或直接在上方添加。',
    watchTrend: '每日安装量（近 7 天，T+1）',
    watchTrendLag: '每日安装量（数据截至 {end}，滞后 {n} 天）',
    watchRemove: '移除',
    watchRemoveConfirm: '确认移除对该包的监控？',
    watchErrBadge: '刷新失败',
    watchViewDetail: '查看详情',
    watchListCount: '共 {n} 个',
    watchChangedTo: '变为 {v}',
    // 历史 tab
    historyPick: '选择包',
    historyEmpty: '暂无快照记录。版本变更与首次加入监控时会自动记录。',
    historyColTime: '记录时间',
    historyColVersion: 'latest 版本',
    historyColDay: '最新单日下载',
    historyColWeek: '近 7 天下载',
    historyColNote: '类型',
    historyNoteInit: '加入监控',
    historyNoteVersion: '版本变更',
    // footer 胶囊（只有监控数量）
    footerWatch: '监控中',
    // 错误码映射
    errors: {
      'pkg-not-found': '未找到该 npm 包，请检查包名（大小写敏感）',
      'pkg-name-invalid': '包名不合法',
      'network-failed': '网络请求失败，请检查网络或 registry 地址',
      'rate-limited': '请求过于频繁（HTTP 429），请稍后再试',
      'registry-http': 'registry 返回错误',
      'parse-failed': '响应解析失败',
      'subprocess-missing': '宿主 subprocess 服务不可用',
      'watch-duplicate': '该包已在监控列表中',
      'watch-missing': '该包不在监控列表中',
      'forbidden': '请求被拒绝（非同源）',
      'method-error': '请求方法不允许',
      'body-too-large': '请求体过大',
      'params-invalid': '参数需为 JSON',
      'unknown-op': '未知操作',
      'op-failed': '操作失败',
      'cmdNoResult': '命令未返回结果',
    },
  },
  en: {
    configBtn: 'npm Monitor',
    showInMenu: 'Show in menu',
    showInMenuDesc: 'When on, an npm Monitor entry button appears at the bottom of the host sidebar',
    openPlugin: 'Open npm Monitor',
    modalTitle: 'npm Package Monitor',
    modalSubtitle: 'Query package info with daily install counts and track changes of your npm libraries',
    tabQuery: 'Query',
    tabWatch: 'Watch',
    tabHistory: 'History',
    dataHint: 'Data source: official npm registry · downloads update T+1',
    close: 'Close',
    loading: 'Loading…',
    refreshNow: 'Refresh now',
    refreshedAt: 'Last refresh',
    autoRefreshHint: 'Auto refresh every {n} min',
    queryPlaceholder: 'Enter an npm package name, e.g. vue / @vue/core…',
    queryBtn: 'Query',
    queryFailed: 'Query failed',
    searching: 'Searching…',
    searchNoMatch: 'No matching packages',
    searchPickHint: 'Press Enter to query, or pick from suggestions',
    watchThis: 'Watch',
    watching: 'Watching',
    watchAddFailed: 'Failed to watch',
    watchAdded: 'Added to watch list',
    latestVersion: 'latest',
    noDescription: '(no description)',
    downloadsTitle: 'Downloads / Installs',
    dlDay: 'Yesterday',
    dlLatest: 'Latest day',
    dlWeek: 'Last 7 days',
    dlMonth: 'Last 30 days',
    dlYear: 'Last year',
    lagNote: 'Data through {end} · last {n} day(s) are not yet reported by npm ({from} ~ {to}); shown as 0 in the chart to keep dates continuous, excluded from the totals above.',
    lagShort: '{n}-day lag',
    noDataYet: 'not yet reported by npm',
    chartPending: 'grey end bars are not reported yet',
    dailyChartTitle: 'Daily installs (last 30 days)',
    dailyAvg: 'avg',
    peakDay: 'peak',
    rangeLabel: 'Range',
    basicTitle: 'Basic Info',
    fieldCreated: 'First publish',
    fieldModified: 'Last updated',
    fieldLatestPublish: 'Latest publish',
    fieldVersions: 'Versions',
    fieldMaintainers: 'Maintainers',
    fieldPkgSize: 'Unpacked size',
    fieldFileCount: 'Files',
    fieldNode: 'Node engine',
    fieldNpmUser: 'Publisher',
    fieldLicense: 'License',
    distTagsTitle: 'Version tags (dist-tags)',
    versionsTitle: 'Versions (recently published)',
    versionsEmpty: '(no version data)',
    readmeTitle: 'README excerpt',
    readmeEmpty: '(no README for this package)',
    readmeExpand: 'Expand',
    readmeCollapse: 'Collapse',
    npmPage: 'npm page',
    homepage: 'Homepage',
    repository: 'Repository',
    issues: 'Issues',
    watchPlaceholder: 'Enter an npm package name to watch…',
    watchAddBtn: 'Add',
    watchEmpty: 'Nothing watched yet. Query a package and click "Watch", or add one above.',
    watchTrend: 'Daily installs (last 7 days, T+1)',
    watchTrendLag: 'Daily installs (data through {end}, {n}-day lag)',
    watchRemove: 'Remove',
    watchRemoveConfirm: 'Remove this package from the watch list?',
    watchErrBadge: 'refresh failed',
    watchViewDetail: 'View detail',
    watchListCount: '{n} total',
    watchChangedTo: 'changed to {v}',
    historyPick: 'Pick a package',
    historyEmpty: 'No snapshots yet. Snapshots are recorded on watch-add and version changes.',
    historyColTime: 'Recorded at',
    historyColVersion: 'latest version',
    historyColDay: 'Latest-day downloads',
    historyColWeek: '7-day downloads',
    historyColNote: 'Type',
    historyNoteInit: 'watch added',
    historyNoteVersion: 'version change',
    footerWatch: 'watching',
    errors: {
      'pkg-not-found': 'Package not found; check the name (case-sensitive)',
      'pkg-name-invalid': 'Invalid package name',
      'network-failed': 'Network request failed; check your network or the registry URL',
      'rate-limited': 'Rate limited (HTTP 429); try again later',
      'registry-http': 'Registry returned an error',
      'parse-failed': 'Failed to parse the response',
      'subprocess-missing': 'Host subprocess service unavailable',
      'watch-duplicate': 'This package is already watched',
      'watch-missing': 'This package is not watched',
      'forbidden': 'Request rejected (not same-origin)',
      'method-error': 'Method not allowed',
      'body-too-large': 'Request body too large',
      'params-invalid': 'Parameters must be JSON',
      'unknown-op': 'Unknown operation',
      'op-failed': 'Operation failed',
      'cmdNoResult': 'Command returned no result',
    },
  },
}

/** 当前语言的词典（每次调用解析 —— 语言切换后即刻生效，无需重建模块状态）。 */
const dictOf = (): Record<string, any> => (COPY[lang] || COPY.zh) as Record<string, any>

/** 取文案并替换 {var} 占位符。 */
export const t = (key: string, vars?: Record<string, string | number>): string => {
  const dict = dictOf()
  let s = dict[key] !== undefined ? dict[key] : String(key)
  if (vars) {
    for (const k of Object.keys(vars)) {
      s = s.split('{' + k + '}').join(String(vars[k]))
    }
  }
  return s
}

/** 宿主错误通过 code 映射为本地化文本，未知错误回退原文。 */
export const tErr = (res: { code?: string; status?: number; error?: string } | null | undefined, fallback?: string): string => {
  const dict = dictOf()
  if (res && res.code) {
    const local = dict.errors[res.code]
    if (local !== undefined) return local
  }
  return (res && res.error) || fallback || ''
}
