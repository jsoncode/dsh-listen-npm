/**
 * dsh-listen-npm —— 插件 logo。
 *
 * npm 品牌红（#CB3837）圆角方块 + 白色 "npm" 字样，以 data URI 内联，
 * 不依赖宿主静态资源路由（bundle 内自包含）。使用 encodeURIComponent 形式
 * （而非 btoa），在任意宿主环境（含受限沙箱）都可用。
 */

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#CB3837"/><text x="32" y="41.5" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">npm</text></svg>'

/** footer 入口按钮图标（data URI，自包含）。 */
export const NPM_LOGO = 'data:image/svg+xml,' + encodeURIComponent(SVG)
