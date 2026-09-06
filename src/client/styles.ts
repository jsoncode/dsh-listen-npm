/**
 * dsh-listen-npm —— 浏览器半边：样式注入（dshn- 前缀，与 dsh-jenkins 同一
 * 的 bundle CSS 注入模式；设计令牌复用宿主 --dsw-alias-* 变量，深浅色自适应）。
 */

const CSS_ID = 'dsh-listen-npm/settings.css'

export const css = [
  // ── 通用控件 ────────────────────────────────────────────────────
  '.dshn-btn{border:1px solid var(--dsw-alias-border-l2,#ccc);background:transparent;color:var(--dsw-alias-label-primary,#222);border-radius:8px;padding:6px 14px;font-size:13px;cursor:pointer}',
  '.dshn-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12))}',
  '.dshn-btn:disabled{opacity:.5;cursor:not-allowed}',
  '.dshn-btn-primary{background:var(--dsw-alias-brand-primary,#1668e3);border-color:transparent;color:var(--dsw-alias-label-primary-foreground,#fff)}',
  '.dshn-btn-primary:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 86%,#fff)}',
  '.dshn-btn-danger{color:var(--dsw-alias-state-error-primary,#d33);border-color:currentColor}',
  '.dshn-btn-danger:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#d33) 10%,transparent)}',
  '.dshn-btn-small{padding:3px 10px;font-size:12px;border-radius:6px}',
  '.dshn-btn-icon{border:none;background:transparent;color:var(--dsw-alias-label-secondary,#888);width:26px;height:26px;padding:0;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px}',
  '.dshn-btn-icon:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,#222)}',
  '.dshn-link{color:var(--dsw-alias-brand-primary,#1668e3);text-decoration:none;font-size:13px}',
  '.dshn-link:hover{text-decoration:underline}',
  '.dshn-err{color:var(--dsw-alias-state-error-primary,#d33);font-size:13px;margin:8px 0;white-space:pre-wrap;word-break:break-word}',
  '.dshn-ok{color:var(--dsw-alias-state-success-primary,#2a7d3c);font-size:13px;margin:8px 0}',
  '.dshn-empty{padding:32px 16px;text-align:center;color:var(--dsw-alias-label-secondary,#888);font-size:13px;line-height:1.8}',
  '.dshn-loading{display:flex;align-items:center;justify-content:center;padding:48px 16px;color:var(--dsw-alias-label-secondary,#888);font-size:13px}',
  '.dshn-spin{display:inline-block;width:14px;height:14px;border:2px solid color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 30%,transparent);border-top-color:var(--dsw-alias-brand-primary,#1668e3);border-radius:50%;animation:dshn-spin 0.8s linear infinite;vertical-align:-2px;margin-right:6px}',
  '@keyframes dshn-spin{to{transform:rotate(360deg)}}',
  '.dshn-input,.dshn-select{width:100%;box-sizing:border-box;background:color-mix(in srgb,var(--dsw-alias-bg-base,#fff) 86%,transparent);color:var(--dsw-alias-label-primary,#222);border:1px solid var(--dsw-alias-border-l2,#ccc);border-radius:8px;padding:8px 12px;font-size:13px;font-family:inherit;transition:border-color .15s,box-shadow .15s;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
  '.dshn-input:focus,.dshn-select:focus{outline:none;border-color:var(--dsw-alias-brand-primary,#1668e3);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 18%,transparent)}',
  '.dshn-input::placeholder{color:var(--dsw-alias-label-tertiary,#aaa)}',
  '.dshn-select{cursor:pointer;appearance:none;-webkit-appearance:none;padding-right:28px;background-image:linear-gradient(45deg,transparent 50%,var(--dsw-alias-label-secondary,#888) 50%),linear-gradient(135deg,var(--dsw-alias-label-secondary,#888) 50%,transparent 50%);background-position:calc(100% - 16px) 50%,calc(100% - 11px) 50%;background-size:5px 5px;background-repeat:no-repeat}',

  // ── 侧边栏底部入口（对齐 dsh-jenkins footer 形态）───────────────
  '.dshn-footer-group{width:100%;min-width:0;position:relative}',
  '.dshn-footer-rail-group{width:auto;display:flex;flex-direction:column;align-items:center}',
  '.dshn-footer-btn{box-sizing:border-box;cursor:pointer;width:calc(100% + 4px);height:42px;color:var(--dsw-alias-label-primary);background:transparent;border:none;border-radius:12px;flex:none;align-items:center;gap:8px;margin:4px -2px;padding:0 10px 0 8px;font-family:inherit;font-size:14px;line-height:22px;display:flex;overflow:hidden}',
  '.dshn-footer-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}',
  '.dshn-footer-btn-rail{border-radius:50%;justify-content:center;gap:0;width:36px;height:36px;margin:8px 0 10px;padding:0}',
  '.dshn-footer-logo{height:26px;width:26px;flex:none;display:block;object-fit:contain;border-radius:6px;pointer-events:none}',
  '.dshn-footer-label{white-space:nowrap;overflow:hidden}',
  '.dshn-footer-caps{position:absolute;right:10px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:4px;z-index:2;pointer-events:none}',
  '.dshn-footer-rail-group .dshn-footer-caps{position:static;transform:none;justify-content:center;margin-top:-4px}',
  '.dshn-capsule{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 5px;border-radius:999px;font-size:10px;line-height:1;font-weight:700;font-variant-numeric:tabular-nums;box-sizing:border-box;white-space:nowrap}',
  // 监控数量：中性蓝描边胶囊
  '.dshn-capsule-watch{color:var(--dsw-alias-brand-primary,#1668e3);border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 55%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 12%,transparent)}',
  // 有新版本：琥珀橙实心胶囊（醒目提醒）
  '.dshn-capsule-new{color:#4a3500;background:#f0b429;border:1px solid color-mix(in srgb,#f0b429 60%,#fff)}',

  // ── 弹框骨架 ────────────────────────────────────────────────────
  // 背景令牌必须用宿主真实存在的 bg-layer-1（与 dsh-jenkins 的 .dshj-modal 同源；
  // 不可用不存在的 --dsw-alias-bg-elevated，否则回退白底 + 深色主题浅字无法辨识）。
  // 92% 不透明 + 高斯模糊：磨砂玻璃质感的同时保证任意主题下文字对比度。
  '.dshn-backdrop{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}',
  '.dshn-modal{background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#fff) 92%,transparent);color:var(--dsw-alias-label-primary,#222);border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.25);width:min(980px,94vw);height:min(760px,88vh);display:flex;flex-direction:column;overflow:hidden;-webkit-backdrop-filter:blur(24px) saturate(1.5);backdrop-filter:blur(24px) saturate(1.5)}',
  '.dshn-modal-head{display:flex;align-items:center;gap:10px;padding:14px 18px 10px;border-bottom:1px solid var(--dsw-alias-border-l1,#eee);flex:none}',
  '.dshn-modal-logo{height:30px;width:30px;border-radius:8px;flex:none}',
  '.dshn-modal-title{font-size:15px;font-weight:700;line-height:20px}',
  '.dshn-modal-sub{font-size:12px;color:var(--dsw-alias-label-secondary,#888);line-height:17px;margin-top:2px}',
  '.dshn-modal-head-ops{margin-left:auto;display:flex;align-items:center;gap:8px}',
  '.dshn-modal-hint{font-size:11px;color:var(--dsw-alias-label-tertiary,#aaa);margin-left:auto;white-space:nowrap}',
  '.dshn-tabs{display:flex;gap:4px;padding:10px 18px 0;border-bottom:1px solid var(--dsw-alias-border-l1,#eee);flex:none}',
  '.dshn-tab{border:none;background:transparent;color:var(--dsw-alias-label-secondary,#888);font-size:13px;padding:8px 14px;cursor:pointer;border-radius:8px 8px 0 0;position:relative}',
  '.dshn-tab:hover{color:var(--dsw-alias-label-primary,#222)}',
  '.dshn-tab-active{color:var(--dsw-alias-brand-primary,#1668e3);font-weight:600}',
  '.dshn-tab-active::after{content:"";position:absolute;left:10px;right:10px;bottom:-1px;height:2px;background:var(--dsw-alias-brand-primary,#1668e3);border-radius:2px 2px 0 0}',
  '.dshn-modal-body{flex:1;min-height:0;overflow-y:auto;padding:14px 18px 18px}',
  '.dshn-modal-foot{flex:none;display:flex;align-items:center;gap:10px;padding:8px 18px;border-top:1px solid var(--dsw-alias-border-l1,#eee);font-size:11px;color:var(--dsw-alias-label-tertiary,#aaa)}',

  // ── 查询 tab ────────────────────────────────────────────────────
  '.dshn-query-bar{display:flex;gap:8px;align-items:center}',
  '.dshn-query-bar .dshn-input{flex:1;min-width:0;font-size:14px}',
  '.dshn-query-wrap{position:relative;margin-bottom:14px}',
  '.dshn-search-pop{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:30;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#fff) 97%,transparent);border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.18);max-height:300px;overflow-y:auto;-webkit-backdrop-filter:blur(16px) saturate(1.4);backdrop-filter:blur(16px) saturate(1.4)}',
  '.dshn-search-item{display:block;width:100%;text-align:left;border:none;background:transparent;color:inherit;font-family:inherit;cursor:pointer;padding:8px 12px;font-size:13px}',
  '.dshn-search-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12))}',
  '.dshn-search-item-name{font-weight:600;display:flex;align-items:center;gap:8px}',
  '.dshn-search-item-name .dshn-link{font-weight:400;font-size:12px}',
  '.dshn-search-item-desc{color:var(--dsw-alias-label-secondary,#888);font-size:12px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.dshn-search-item-meta{color:var(--dsw-alias-label-tertiary,#aaa);font-size:11px;margin-top:2px;font-variant-numeric:tabular-nums}',

  // ── 详情：头部 / 下载量卡片 / 图表 / 元信息 ─────────────────────
  '.dshn-detail-head{display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap}',
  '.dshn-detail-name{font-size:20px;font-weight:700;line-height:28px;word-break:break-all}',
  '.dshn-detail-ver{display:inline-flex;align-items:center;gap:6px;margin-left:8px}',
  '.dshn-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:11px;line-height:16px;border:1px solid var(--dsw-alias-border-l2,#ddd);color:var(--dsw-alias-label-secondary,#666);white-space:nowrap}',
  '.dshn-chip-latest{color:var(--dsw-alias-brand-primary,#1668e3);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 10%,transparent);font-weight:600}',
  '.dshn-chip-new{color:#4a3500;background:#f0b429;border-color:transparent;font-weight:700}',
  '.dshn-detail-desc{color:var(--dsw-alias-label-secondary,#666);font-size:13px;line-height:1.6;margin-top:4px}',
  '.dshn-detail-links{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}',
  '.dshn-card{border:1px solid var(--dsw-alias-border-l1,#eee);border-radius:12px;padding:14px;margin-top:14px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2,#fafafa) 60%,transparent)}',
  '.dshn-card-title{font-size:13px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:8px}',
  '.dshn-card-title .dshn-hint{font-weight:400;font-size:11px;color:var(--dsw-alias-label-tertiary,#aaa)}',
  // 下载量统计瓦片：突出显示，昨日为焦点
  '.dshn-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}',
  '.dshn-stat{border:1px solid var(--dsw-alias-border-l1,#eee);border-radius:10px;padding:10px 12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2,#fafafa) 65%,transparent)}',
  '.dshn-stat-hero{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 35%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 8%,transparent)}',
  '.dshn-stat-label{font-size:11px;color:var(--dsw-alias-label-secondary,#888)}',
  '.dshn-stat-value{font-size:20px;font-weight:700;font-variant-numeric:tabular-nums;margin-top:2px;line-height:26px;word-break:break-all}',
  '.dshn-stat-sub{font-size:10px;color:var(--dsw-alias-label-tertiary,#aaa);margin-top:2px;font-variant-numeric:tabular-nums}',
  // 图表
  '.dshn-chart-wrap{margin-top:12px}',
  '.dshn-chart-svg{width:100%;height:auto;display:block}',
  '.dshn-chart-bar{fill:var(--dsw-alias-brand-primary,#1668e3);opacity:.82;transition:opacity .12s}',
  '.dshn-chart-bar:hover{opacity:1}',
  '.dshn-chart-bar-last{fill:var(--dsw-alias-state-success-primary,#2a7d3c);opacity:1}',
  '.dshn-chart-bar-peak{opacity:1}',
  '.dshn-chart-grid{stroke:var(--dsw-alias-border-l1,#eee);stroke-width:1}',
  '.dshn-chart-avg{stroke:var(--dsw-alias-state-warn-primary,#b8860b);stroke-width:1;stroke-dasharray:4 3}',
  '.dshn-chart-text{fill:var(--dsw-alias-label-tertiary,#999);font-size:10px;font-family:inherit}',
  // 元信息两列
  '.dshn-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 18px}',
  '.dshn-meta-row{display:flex;gap:8px;font-size:12.5px;line-height:20px;min-width:0}',
  '.dshn-meta-key{color:var(--dsw-alias-label-secondary,#888);flex:none;width:84px;text-align:right}',
  '.dshn-meta-val{color:var(--dsw-alias-label-primary,#222);min-width:0;word-break:break-all;font-variant-numeric:tabular-nums}',
  '.dshn-tags{display:flex;gap:6px;flex-wrap:wrap}',
  // 版本表（固定高度滚动容器：版本过多时不撑开弹框主体，表头吸附）
  '.dshn-table-scroll{max-height:240px;overflow-y:auto;border-radius:6px}',
  '.dshn-table{width:100%;border-collapse:collapse;font-size:12.5px}',
  '.dshn-table th{text-align:left;color:var(--dsw-alias-label-secondary,#888);font-weight:500;padding:6px 8px;border-bottom:1px solid var(--dsw-alias-border-l1,#eee);white-space:nowrap}',
  '.dshn-table-scroll th{position:sticky;top:0;background:var(--dsw-alias-bg-layer-1,#fff);z-index:1}',
  '.dshn-table td{padding:6px 8px;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-border-l1,#eee) 60%,transparent);font-variant-numeric:tabular-nums;word-break:break-all}',
  '.dshn-table tr:hover td{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.08))}',
  // README（Markdown 渲染；容器限高 + 底部渐隐，展开后取消限高）
  '.dshn-readme{font-size:12.5px;line-height:1.7;word-break:break-word;color:var(--dsw-alias-label-primary,#222);max-height:220px;overflow:hidden;position:relative}',
  '.dshn-readme-open{max-height:none}',
  '.dshn-readme-fade{position:absolute;left:0;right:0;bottom:0;height:56px;background:linear-gradient(transparent,color-mix(in srgb,var(--dsw-alias-bg-layer-1,#fff) 92%,transparent))}',
  // Markdown 元素（零依赖渲染器输出，配色走宿主令牌）
  '.dshn-md > :first-child{margin-top:0}',
  '.dshn-md > :last-child{margin-bottom:0}',
  '.dshn-md-p{margin:6px 0}',
  '.dshn-md-h{margin:12px 0 6px;font-weight:700;line-height:1.4}',
  '.dshn-md-h1{font-size:17px}.dshn-md-h2{font-size:15.5px}.dshn-md-h3{font-size:14px}.dshn-md-h4{font-size:13px}',
  '.dshn-md-list{margin:6px 0;padding-left:20px}',
  '.dshn-md-list li{margin:2px 0}',
  '.dshn-md-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11.5px;background:color-mix(in srgb,var(--dsw-alias-label-secondary,#888) 14%,transparent);border-radius:4px;padding:1px 5px;word-break:break-all}',
  '.dshn-md-pre{margin:8px 0;padding:10px 12px;background:color-mix(in srgb,var(--dsw-alias-label-secondary,#888) 10%,transparent);border-radius:8px;overflow-x:auto}',
  '.dshn-md-pre code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11.5px;background:transparent;padding:0}',
  '.dshn-md-quote{margin:8px 0;padding:4px 12px;border-left:3px solid var(--dsw-alias-border-l2,#ddd);color:var(--dsw-alias-label-secondary,#888)}',
  '.dshn-md-link{color:var(--dsw-alias-brand-primary,#1668e3);text-decoration:none}',
  '.dshn-md-link:hover{text-decoration:underline}',
  '.dshn-md-img{max-width:100%;height:auto;border-radius:6px}',
  '.dshn-md-hr{border:none;border-top:1px solid var(--dsw-alias-border-l1,#eee);margin:10px 0}',
  '.dshn-md-table{border-collapse:collapse;font-size:12px;margin:8px 0;max-width:100%;display:block;overflow-x:auto}',
  '.dshn-md-table th,.dshn-md-table td{border:1px solid var(--dsw-alias-border-l1,#eee);padding:4px 8px;text-align:left}',

  // ── 监控 tab ────────────────────────────────────────────────────
  '.dshn-watch-bar{display:flex;gap:8px;align-items:center;margin-bottom:6px}',
  '.dshn-watch-bar .dshn-input{flex:1;min-width:0}',
  '.dshn-watch-status{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--dsw-alias-label-secondary,#888);margin:6px 0 10px;flex-wrap:wrap}',
  '.dshn-watch-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1,#eee);border-radius:10px;margin-bottom:8px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2,#fafafa) 60%,transparent)}',
  '.dshn-watch-item:hover{border-color:var(--dsw-alias-border-l3,#bbb)}',
  '.dshn-watch-main{min-width:0;flex:1;cursor:pointer}',
  '.dshn-watch-name{font-size:14px;font-weight:600;word-break:break-all;display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
  '.dshn-watch-ver{font-size:12px;color:var(--dsw-alias-brand-primary,#1668e3);font-variant-numeric:tabular-nums}',
  '.dshn-watch-dl{font-size:12px;color:var(--dsw-alias-label-secondary,#888);margin-top:3px;font-variant-numeric:tabular-nums;display:flex;gap:14px;flex-wrap:wrap}',
  '.dshn-delta-up{color:var(--dsw-alias-state-success-primary,#2a7d3c)}',
  '.dshn-delta-down{color:var(--dsw-alias-state-error-primary,#d33)}',
  // 迷你日安装量柱状图（列表项右侧）：柱体沿底部对齐，最后一根（昨日）绿色高亮
  '.dshn-trend{display:flex;align-items:flex-end;gap:2px;height:28px;flex:none;padding:2px 2px 0}',
  '.dshn-trend-bar{display:block;width:5px;min-height:2px;border-radius:2px 2px 0 0;background:color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 55%,transparent)}',
  '.dshn-trend-bar:hover{background:var(--dsw-alias-brand-primary,#1668e3)}',
  '.dshn-trend-bar-last{background:var(--dsw-alias-state-success-primary,#2a7d3c)}',
  '.dshn-watch-ops{display:flex;align-items:center;gap:6px;flex:none}',

  // ── 历史 tab ────────────────────────────────────────────────────
  '.dshn-history-bar{display:flex;gap:8px;align-items:center;margin-bottom:12px}',
  '.dshn-history-bar .dshn-select{max-width:320px}',
  '.dshn-note-chip{display:inline-flex;padding:1px 8px;border-radius:999px;font-size:11px;line-height:16px;border:1px solid var(--dsw-alias-border-l2,#ddd);color:var(--dsw-alias-label-secondary,#777)}',
  // 版本变更徽章：实心琥珀底 + 深琥珀字（自包含配色，深浅主题下对比度一致）
  '.dshn-note-version{color:#4a3500;background:#f0b429;border-color:transparent}',
  '.dshn-note-init{color:var(--dsw-alias-brand-primary,#1668e3);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 40%,transparent)}',

  // ── 兜底：不支持 backdrop-filter 的浏览器 ──────────────────────
  // 半透明玻璃退化为不透明面板，避免底层内容透出干扰文字对比度。
  '@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))){.dshn-modal,.dshn-search-pop{background:var(--dsw-alias-bg-layer-1,#fff)}.dshn-card,.dshn-stat,.dshn-watch-item{background:var(--dsw-alias-bg-layer-2,#fafafa)}.dshn-input,.dshn-select{background:var(--dsw-alias-bg-base,#fff)}}',
]

/** 幂等注入样式（style id 去重）。 */
export function injectStyles(): void {
  if (typeof document === 'undefined') return
  const existing = document.getElementById(CSS_ID)
  if (existing !== null) existing.remove()
  const style = document.createElement('style')
  style.id = CSS_ID
  style.textContent = css.join('\n')
  document.head.appendChild(style)
}
