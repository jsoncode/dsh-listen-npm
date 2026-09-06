/**
 * dsh-listen-npm —�?浏览器半边：语言与文案（中英双语，跟随主界面语言）�? */

/**
 * 初始语言：仅作宿�?locale 服务不可用时的兜底。运行时�?plugin.tsx 里的
 * locale 订阅为准�? */
function resolveLang(): 'zh' | 'en' {
  if (typeof document !== 'undefined') {
    const host = document.documentElement.lang || navigator.language || 'zh-CN'
    return /^zh/i.test(host) ? 'zh' : 'en'
  }
  return 'zh'
}

/** 当前语言（可变，随宿�?locale 切换；经 setLang 更新）�?*/
let lang: 'zh' | 'en' = resolveLang()

/** 读当前语言（组件内请调用此函数而非读取静态快照）�?*/
export const getLang = (): 'zh' | 'en' => lang

/** 写当前语言（由宿主 locale 订阅驱动；重渲染�?slot 出口�?locale revision 订阅触发）�?*/
export const setLang = (next: 'zh' | 'en'): void => {
  lang = next
}

const COPY: Record<'zh' | 'en', Record<string, unknown>> = {
  zh: {
    configBtn: 'npm 监控',
    modalTitle: 'npm 包监�?,
    modalSubtitle: '查询包信息与每日安装量，跟踪你的 npm 库的变化',
    tabQuery: '查询',
    tabWatch: '监控',
    tabHistory: '历史',
    dataHint: '数据�?npm 官方 registry · 下载�?T+1 更新',
    close: '关闭',
    loading: '加载中�?,
    refreshNow: '立即刷新',
    refreshedAt: '上次刷新',
    autoRefreshHint: '�?{n} 分钟自动刷新',
    // 查询 tab
    queryPlaceholder: '输入 npm 包名，如 vue / @vue/core�?,
    queryBtn: '查询',
    queryFailed: '查询失败',
    searching: '搜索中�?,
    searchNoMatch: '无匹配的�?,
    searchPickHint: '输入包名后回车查询，或从联想列表选择',
    watchThis: '加入监控',
    watching: '已监�?,
    watchAddFailed: '加入监控失败',
    watchAdded: '已加入监控列�?,
    // 详情
    latestVersion: '最�?,
    noDescription: '（暂无描述）',
    downloadsTitle: '下载�?/ 安装�?,
    dlDay: '昨日',
    dlWeek: '�?7 �?,
    dlMonth: '�?30 �?,
    dlYear: '近一�?,
    dailyChartTitle: '每日安装量（�?30 天）',
    dailyAvg: '日均',
    peakDay: '峰�?,
    rangeLabel: '统计区间',
    basicTitle: '基本信息',
    fieldCreated: '首次发布',
    fieldModified: '最近更�?,
    fieldLatestPublish: '最新版发布',
    fieldVersions: '版本总数',
    fieldMaintainers: '维护�?,
    fieldPkgSize: '解包大小',
    fieldFileCount: '文件�?,
    fieldNode: 'Node 要求',
    fieldNpmUser: '发布�?,
    fieldLicense: '许可�?,
    distTagsTitle: '版本标签（dist-tags�?,
    depsTitle: '依赖',
    depsRuntime: 'dependencies',
    depsDev: 'devDependencies',
    depsPeer: 'peerDependencies',
    depsNone: '�?,
    versionsTitle: '版本列表（最近发布）',
    versionsEmpty: '（无版本数据�?,
    readmeTitle: 'README 摘要',
    readmeEmpty: '（该包没�?README�?,
    readmeExpand: '展开全部',
    readmeCollapse: '收起',
    npmPage: 'npm 页面',
    homepage: '主页',
    repository: '仓库',
    issues: 'Issues',
    tarball: 'tarball',
    // 监控 tab
    watchPlaceholder: '输入要监控的 npm 包名�?,
    watchAddBtn: '添加',
    watchEmpty: '还没有监控任何包。查询一个包后点击「加入监控」，或直接在上方添加�?,
    watchRemove: '移除',
    watchRemoveConfirm: '确认移除对该包的监控�?,
    newVersionBadge: '有新版本',
    watchErrBadge: '刷新失败',
    watchViewDetail: '查看详情',
    watchListCount: '�?{n} �?,
    watchChangedTo: '变为 {v}',
    // 历史 tab
    historyPick: '选择�?,
    historyEmpty: '暂无快照记录。版本变更与首次加入监控时会自动记录�?,
    historyColTime: '记录时间',
    historyColVersion: 'latest 版本',
    historyColDay: '昨日下载',
    historyColWeek: '�?7 天下�?,
    historyColNote: '类型',
    historyNoteInit: '加入监控',
    historyNoteVersion: '版本变更',
    // footer 胶囊
    footerWatch: '监控�?,
    footerNewVersion: '有更�?,
    footerNewVersionTitle: '监控的包有新版本，点击查�?,
    // 错误码映�?    errors: {
      'pkg-not-found': '未找到该 npm 包，请检查包名（大小写敏感）',
      'pkg-name-invalid': '包名不合�?,
      'network-failed': '网络请求失败，请检查网络或 registry 地址',
      'rate-limited': '请求过于频繁（HTTP 429），请稍后再�?,
      'registry-http': 'registry 返回错误',
      'parse-failed': '响应解析失败',
      'subprocess-missing': '宿主 subprocess 服务不可�?,
      'watch-duplicate': '该包已在监控列表�?,
      'watch-missing': '该包不在监控列表�?,
      'forbidden': '请求被拒绝（非同源）',
      'method-error': '请求方法不允�?,
      'body-too-large': '请求体过�?,
      'params-invalid': '参数需�?JSON',
      'unknown-op': '未知操作',
      'op-failed': '操作失败',
      'cmdNoResult': '命令未返回结�?,
    },
  },
  en: {
    configBtn: 'npm Monitor',
    modalTitle: 'npm Package Monitor',
    modalSubtitle: 'Query package info with daily install counts and track changes of your npm libraries',
    tabQuery: 'Query',
    tabWatch: 'Watch',
    tabHistory: 'History',
    dataHint: 'Data source: official npm registry · downloads update T+1',
    close: 'Close',
    loading: 'Loading�?,
    refreshNow: 'Refresh now',
    refreshedAt: 'Last refresh',
    autoRefreshHint: 'Auto refresh every {n} min',
    queryPlaceholder: 'Enter an npm package name, e.g. vue / @vue/core�?,
    queryBtn: 'Query',
    queryFailed: 'Query failed',
    searching: 'Searching�?,
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
    dlWeek: 'Last 7 days',
    dlMonth: 'Last 30 days',
    dlYear: 'Last year',
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
    depsTitle: 'Dependencies',
    depsRuntime: 'dependencies',
    depsDev: 'devDependencies',
    depsPeer: 'peerDependencies',
    depsNone: 'none',
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
    tarball: 'tarball',
    watchPlaceholder: 'Enter an npm package name to watch�?,
    watchAddBtn: 'Add',
    watchEmpty: 'Nothing watched yet. Query a package and click "Watch", or add one above.',
    watchRemove: 'Remove',
    watchRemoveConfirm: 'Remove this package from the watch list?',
    newVersionBadge: 'NEW',
    watchErrBadge: 'refresh failed',
    watchViewDetail: 'View detail',
    watchListCount: '{n} total',
    watchChangedTo: 'changed to {v}',
    historyPick: 'Pick a package',
    historyEmpty: 'No snapshots yet. Snapshots are recorded on watch-add and version changes.',
    historyColTime: 'Recorded at',
    historyColVersion: 'latest version',
    historyColDay: 'Day downloads',
    historyColWeek: '7-day downloads',
    historyColNote: 'Type',
    historyNoteInit: 'watch added',
    historyNoteVersion: 'version change',
    footerWatch: 'watching',
    footerNewVersion: 'UPDATE',
    footerNewVersionTitle: 'Watched packages have new versions �?click to view',
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

/** 当前语言的词典（每次调用解析 —�?语言切换后即刻生效，无需重建模块状态）�?*/
const dictOf = (): Record<string, any> => (COPY[lang] || COPY.zh) as Record<string, any>

/** 取文案并替换 {var} 占位符�?*/
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

/** 宿主错误通过 code 映射为本地化文本，未知错误回退原文�?*/
export const tErr = (res: { code?: string; status?: number; error?: string } | null | undefined, fallback?: string): string => {
  const dict = dictOf()
  if (res && res.code) {
    const local = dict.errors[res.code]
    if (local !== undefined) return local
  }
  return (res && res.error) || fallback || ''
}
