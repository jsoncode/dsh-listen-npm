/**
 * verify-client —— 模拟宿主加载 lib/client.js，验证 __ModuleLoader__ 工厂可用。
 *
 * 模拟内容（对齐宿主 ClientModuleSystem 行为）：
 * - window.__ModuleLoader__.load 收集工厂；
 * - seed 表：react / react/jsx-runtime 用真实包，@deepseek-ai/* 用 stub
 *   （Node 环境无法真实渲染，仅验证模块形状与 require 解析）；
 * - 执行 bundle 后物化工厂，断言返回 { name, inject, apply }。
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const bundlePath = resolve(root, 'lib/client.js')
const code = readFileSync(bundlePath, 'utf8')

const PLUGIN_ID = 'dsh-listen-npm'

const factories = new Map()
const window = {
  __ModuleLoader__: {
    load(handoff) {
      if (factories.has(handoff.id)) throw new Error(`duplicate factory registration for "${handoff.id}"`)
      factories.set(handoff.id, handoff.factory)
    },
  },
}

// 宿主 seed 表（frozen module table）：外部依赖只能解析这里
const seed = {
  'react': require('react'),
  'react/jsx-runtime': require('react/jsx-runtime'),
  'react-dom': require('react-dom'),
  'react-dom/client': require('react-dom/client'),
  '@deepseek-ai/dsh-client-ui-primitives': { Modal: () => null },
}

const sandbox = {
  window,
  console,
  setTimeout,
  clearTimeout,
  document: undefined,
  navigator: { language: 'zh-CN' },
}
vm.createContext(sandbox)
vm.runInContext(code, sandbox, { filename: 'lib/client.js' })

if (!factories.has(PLUGIN_ID)) {
  console.error(`verify-client FAIL: bundle 未注册 "${PLUGIN_ID}" 工厂`)
  process.exit(1)
}

const makeRequire = (edges) => (spec) => {
  edges.add(spec)
  if (!(spec in seed)) {
    throw new Error(`require("${spec}") 不在模拟 seed 表（构建时 external 漂移？）`)
  }
  return seed[spec]
}

// 物化（对齐 materialize：同步、memoized）
const edges = new Set()
const exports = factories.get(PLUGIN_ID)(makeRequire(edges))
const mod = exports || {}

const shapeOk = mod.name === PLUGIN_ID && typeof mod.apply === 'function' && Array.isArray(mod.inject)
if (!shapeOk) {
  console.error('verify-client FAIL: 模块形状错误', JSON.stringify({ name: mod.name, apply: typeof mod.apply, inject: mod.inject }))
  process.exit(1)
}

console.log(`verify-client OK: ${mod.name} · inject=${JSON.stringify(mod.inject)} · external=${[...edges].join(', ')}`)

/* ── 追加断言：样式注入带宿主可识别的归属标记 ──────────────────────
 * 宿主 client-modules 的 claimStyles(id) 会认领所有 `style:not([data-plugin])`，
 * client-hmr 的 removeOwnedStyles(id) 会删除 `style[data-plugin=id]`。裸 <style>
 * 会被下一个物化的插件认领，那个插件一热重载就把本插件 CSS 一起删掉 ——
 * footerAction 图标失去尺寸规则后按替换元素默认尺寸（300×150）渲染、撑爆按钮。
 * 这里用最小 document stub 跑一次 apply，验证：标签自带 data-plugin(-css)、
 * 重复 apply 不产生重复标签（幂等，且不会被自己删除）。
 */
const CSS_ID = 'dsh-listen-npm/settings.css'

function makeFakeDocument() {
  const head = { children: [], appendChild(el) { head.children.push(el) } }
  return {
    documentElement: { lang: 'zh-CN' },
    head,
    /** 只实现 `style[data-plugin-css="..."]` 这一种选择器（injectStyles 的唯一查询）。 */
    querySelector(selector) {
      const m = /^style\[data-plugin-css="(.*)"\]$/.exec(selector)
      if (m === null) return null
      return head.children.find((el) => el.attrs['data-plugin-css'] === m[1]) ?? null
    },
    createElement() {
      const el = { attrs: {}, textContent: '', setAttribute(k, v) { el.attrs[k] = v } }
      return el
    },
  }
}

const fakeDocument = makeFakeDocument()
sandbox.document = fakeDocument
const fakeCtx = {
  get: (name) => (name === 'slots' ? { inject: () => undefined, register: () => () => {} } : undefined),
  interval: () => () => {},
  remote: { commands: { execute: async () => ({ ok: false }) } },
}
mod.apply(fakeCtx)
mod.apply(fakeCtx)

const owned = fakeDocument.head.children.filter((el) => el.attrs['data-plugin-css'] === CSS_ID)
const cssText = owned.length === 1 ? owned[0].textContent : ''
// tab 交互契约（两条都曾被踩过）：
// 1) 选中态必须是**半透明**主色底（不是实心 brand 底）——实心底上，brand 令牌色的
//    数量胶囊会与底同色（对比度 1:1）而看不见；
// 2) `.dshn-tab:hover` 特异性 (0,2,0) 高于 `.dshn-tab-active` (0,1,0)，所以 hover
//    必须排除选中项，否则鼠标移入选中项会把它从实底变成一层半透明灰。
const baseCapsule = /(?:^|\n)\.dshn-capsule-watch\{([^}]*)\}/.exec(cssText)
const activeTab = /(?:^|\n)\.dshn-tab-active\{([^}]*)\}/.exec(cssText)
/** 选中态 tab 的所有 background 声明（最后一条生效，前面的只能是兼容兜底）。 */
const activeTabBg = activeTab ? [...activeTab[1].matchAll(/(?:^|;)background:([^;]+)/g)].map((m) => m[1]) : []
const winningBg = activeTabBg.length > 0 ? activeTabBg[activeTabBg.length - 1] : ''
const styleChecks = [
  ['style 标签唯一', owned.length === 1],
  ['style 标签归属', owned.length === 1 && owned[0].attrs['data-plugin'] === PLUGIN_ID],
  ['footer 图标尺寸规则存在', cssText.includes('.dshn-footer-logo') && cssText.includes('max-width:26px')],
  ['数量胶囊：brand 令牌描边胶囊', !!baseCapsule && baseCapsule[1].includes('color:var(--dsw-alias-brand-primary')],
  ['选中态 tab：规则存在', !!activeTab],
  [
    '选中态 tab：生效底色为半透明主色（非实心）',
    winningBg.startsWith('color-mix(in srgb,var(--dsw-alias-button-primary-fill')
      && winningBg.endsWith(',transparent)')
      && !activeTabBg.some((bg) => bg.startsWith('var(--dsw-alias-button-primary-fill')),
  ],
  [
    '选中态 tab：文字回到主文字色',
    !!activeTab && /(?:^|;)color:var\(--dsw-alias-label-primary,/.test(activeTab[1]),
  ],
  [
    'hover 规则排除选中项（移入选中不变色）',
    cssText.includes('.dshn-tab:hover:not(.dshn-tab-active)'),
  ],
  [
    '没有任何 .dshn-tab-active:hover 覆盖',
    !/\.dshn-tab-active:hover/.test(cssText),
  ],
  [
    '不再需要胶囊反色规则（选中底已非实心）',
    !/\.dshn-tab-active \.dshn-capsule-watch/.test(cssText),
  ],
]
const styleOk = styleChecks.every(([, ok]) => ok)
if (!styleOk) {
  console.error('verify-client FAIL: 样式标签归属/内容断言失败', JSON.stringify({
    count: owned.length,
    plugin: owned[0] && owned[0].attrs['data-plugin'],
    bytes: cssText.length,
    failed: styleChecks.filter(([, ok]) => !ok).map(([name]) => name),
    activeTab: activeTab ? activeTab[1] : null,
    baseCapsule: baseCapsule ? baseCapsule[1] : null,
    tabContext: cssText.slice(Math.max(0, cssText.indexOf('.dshn-tab{') - 20), cssText.indexOf('.dshn-tab{') + 420),
  }))
  process.exit(1)
}
console.log(`verify-client OK: style tag owned by "${PLUGIN_ID}" · data-plugin-css="${CSS_ID}" · ${owned[0].textContent.length} bytes · 幂等`)
