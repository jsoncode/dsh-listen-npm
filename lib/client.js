window.__ModuleLoader__.load({ id: 'dsh-listen-npm', factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let react = require("react");
let react_jsx_runtime = require("react/jsx-runtime");
let react_dom = require("react-dom");
//#region src/client/styles.ts
/**
* dsh-listen-npm —— 浏览器半边：样式注入（dshn- 前缀，与 dsh-jenkins 同一
* 的 bundle CSS 注入模式；设计令牌复用宿主 --dsw-alias-* 变量，深浅色自适应）。
*/
const CSS_ID = "dsh-listen-npm/settings.css";
const css = [
	".dshn-btn{border:1px solid var(--dsw-alias-border-l2,#ccc);background:transparent;color:var(--dsw-alias-label-primary,#222);border-radius:8px;padding:6px 14px;font-size:13px;cursor:pointer}",
	".dshn-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12))}",
	".dshn-btn:disabled{opacity:.5;cursor:not-allowed}",
	".dshn-btn-primary{background:var(--dsw-alias-brand-primary,#1668e3);border-color:transparent;color:var(--dsw-alias-label-primary-foreground,#fff)}",
	".dshn-btn-primary:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 86%,#fff)}",
	".dshn-btn-danger{color:var(--dsw-alias-state-error-primary,#d33);border-color:currentColor}",
	".dshn-btn-danger:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#d33) 10%,transparent)}",
	".dshn-btn-small{padding:3px 10px;font-size:12px;border-radius:6px}",
	".dshn-btn-icon{border:none;background:transparent;color:var(--dsw-alias-label-secondary,#888);width:26px;height:26px;padding:0;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px}",
	".dshn-btn-icon:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,#222)}",
	".dshn-link{color:var(--dsw-alias-brand-primary,#1668e3);text-decoration:none;font-size:13px}",
	".dshn-link:hover{text-decoration:underline}",
	".dshn-err{color:var(--dsw-alias-state-error-primary,#d33);font-size:13px;margin:8px 0;white-space:pre-wrap;word-break:break-word}",
	".dshn-ok{color:var(--dsw-alias-state-success-primary,#2a7d3c);font-size:13px;margin:8px 0}",
	".dshn-empty{padding:32px 16px;text-align:center;color:var(--dsw-alias-label-secondary,#888);font-size:13px;line-height:1.8}",
	".dshn-loading{display:flex;align-items:center;justify-content:center;padding:48px 16px;color:var(--dsw-alias-label-secondary,#888);font-size:13px}",
	".dshn-spin{display:inline-block;width:14px;height:14px;border:2px solid color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 30%,transparent);border-top-color:var(--dsw-alias-brand-primary,#1668e3);border-radius:50%;animation:dshn-spin 0.8s linear infinite;vertical-align:-2px;margin-right:6px}",
	"@keyframes dshn-spin{to{transform:rotate(360deg)}}",
	".dshn-input,.dshn-select{width:100%;box-sizing:border-box;background:color-mix(in srgb,var(--dsw-alias-bg-base,#fff) 86%,transparent);color:var(--dsw-alias-label-primary,#222);border:1px solid var(--dsw-alias-border-l2,#ccc);border-radius:8px;padding:8px 12px;font-size:13px;font-family:inherit;transition:border-color .15s,box-shadow .15s;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}",
	".dshn-input:focus,.dshn-select:focus{outline:none;border-color:var(--dsw-alias-brand-primary,#1668e3);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 18%,transparent)}",
	".dshn-input::placeholder{color:var(--dsw-alias-label-tertiary,#aaa)}",
	".dshn-select{cursor:pointer;appearance:none;-webkit-appearance:none;padding-right:28px;background-image:linear-gradient(45deg,transparent 50%,var(--dsw-alias-label-secondary,#888) 50%),linear-gradient(135deg,var(--dsw-alias-label-secondary,#888) 50%,transparent 50%);background-position:calc(100% - 16px) 50%,calc(100% - 11px) 50%;background-size:5px 5px;background-repeat:no-repeat}",
	".dshn-footer-group{width:100%;min-width:0;position:relative}",
	".dshn-footer-rail-group{width:auto;display:flex;flex-direction:column;align-items:center}",
	".dshn-footer-btn{box-sizing:border-box;cursor:pointer;width:calc(100% + 4px);height:42px;color:var(--dsw-alias-label-primary);background:transparent;border:none;border-radius:12px;flex:none;align-items:center;gap:8px;margin:4px -2px;padding:0 10px 0 8px;font-family:inherit;font-size:14px;line-height:22px;display:flex;overflow:hidden}",
	".dshn-footer-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}",
	".dshn-footer-btn-rail{border-radius:50%;justify-content:center;gap:0;width:36px;height:36px;margin:8px 0 10px;padding:0}",
	".dshn-footer-logo{height:26px;width:26px;flex:none;display:block;object-fit:contain;border-radius:6px;pointer-events:none}",
	".dshn-footer-label{white-space:nowrap;overflow:hidden}",
	".dshn-footer-caps{position:absolute;right:10px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:4px;z-index:2;pointer-events:none}",
	".dshn-footer-rail-group .dshn-footer-caps{position:static;transform:none;justify-content:center;margin-top:-4px}",
	".dshn-capsule{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 5px;border-radius:999px;font-size:10px;line-height:1;font-weight:700;font-variant-numeric:tabular-nums;box-sizing:border-box;white-space:nowrap}",
	".dshn-capsule-watch{color:var(--dsw-alias-brand-primary,#1668e3);border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 55%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 12%,transparent)}",
	".dshn-capsule-new{color:#4a3500;background:#f0b429;border:1px solid color-mix(in srgb,#f0b429 60%,#fff)}",
	".dshn-backdrop{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}",
	".dshn-modal{background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#fff) 92%,transparent);color:var(--dsw-alias-label-primary,#222);border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.25);width:min(980px,94vw);height:min(760px,88vh);display:flex;flex-direction:column;overflow:hidden;-webkit-backdrop-filter:blur(24px) saturate(1.5);backdrop-filter:blur(24px) saturate(1.5)}",
	".dshn-modal-head{display:flex;align-items:center;gap:10px;padding:14px 18px 10px;border-bottom:1px solid var(--dsw-alias-border-l1,#eee);flex:none}",
	".dshn-modal-logo{height:30px;width:30px;border-radius:8px;flex:none}",
	".dshn-modal-title{font-size:15px;font-weight:700;line-height:20px}",
	".dshn-modal-sub{font-size:12px;color:var(--dsw-alias-label-secondary,#888);line-height:17px;margin-top:2px}",
	".dshn-modal-head-ops{margin-left:auto;display:flex;align-items:center;gap:8px}",
	".dshn-modal-hint{font-size:11px;color:var(--dsw-alias-label-tertiary,#aaa);margin-left:auto;white-space:nowrap}",
	".dshn-tabs{display:flex;gap:4px;padding:10px 18px 0;border-bottom:1px solid var(--dsw-alias-border-l1,#eee);flex:none}",
	".dshn-tab{border:none;background:transparent;color:var(--dsw-alias-label-secondary,#888);font-size:13px;padding:8px 14px;cursor:pointer;border-radius:8px 8px 0 0;position:relative}",
	".dshn-tab:hover{color:var(--dsw-alias-label-primary,#222)}",
	".dshn-tab-active{color:var(--dsw-alias-brand-primary,#1668e3);font-weight:600}",
	".dshn-tab-active::after{content:\"\";position:absolute;left:10px;right:10px;bottom:-1px;height:2px;background:var(--dsw-alias-brand-primary,#1668e3);border-radius:2px 2px 0 0}",
	".dshn-modal-body{flex:1;min-height:0;overflow-y:auto;padding:14px 18px 18px}",
	".dshn-modal-foot{flex:none;display:flex;align-items:center;gap:10px;padding:8px 18px;border-top:1px solid var(--dsw-alias-border-l1,#eee);font-size:11px;color:var(--dsw-alias-label-tertiary,#aaa)}",
	".dshn-query-bar{display:flex;gap:8px;align-items:center}",
	".dshn-query-bar .dshn-input{flex:1;min-width:0;font-size:14px}",
	".dshn-query-wrap{position:relative;margin-bottom:14px}",
	".dshn-search-pop{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:30;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#fff) 97%,transparent);border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.18);max-height:300px;overflow-y:auto;-webkit-backdrop-filter:blur(16px) saturate(1.4);backdrop-filter:blur(16px) saturate(1.4)}",
	".dshn-search-item{display:block;width:100%;text-align:left;border:none;background:transparent;color:inherit;font-family:inherit;cursor:pointer;padding:8px 12px;font-size:13px}",
	".dshn-search-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12))}",
	".dshn-search-item-name{font-weight:600;display:flex;align-items:center;gap:8px}",
	".dshn-search-item-name .dshn-link{font-weight:400;font-size:12px}",
	".dshn-search-item-desc{color:var(--dsw-alias-label-secondary,#888);font-size:12px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
	".dshn-search-item-meta{color:var(--dsw-alias-label-tertiary,#aaa);font-size:11px;margin-top:2px;font-variant-numeric:tabular-nums}",
	".dshn-detail-head{display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap}",
	".dshn-detail-name{font-size:20px;font-weight:700;line-height:28px;word-break:break-all}",
	".dshn-detail-ver{display:inline-flex;align-items:center;gap:6px;margin-left:8px}",
	".dshn-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:11px;line-height:16px;border:1px solid var(--dsw-alias-border-l2,#ddd);color:var(--dsw-alias-label-secondary,#666);white-space:nowrap}",
	".dshn-chip-latest{color:var(--dsw-alias-brand-primary,#1668e3);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 10%,transparent);font-weight:600}",
	".dshn-chip-new{color:#4a3500;background:#f0b429;border-color:transparent;font-weight:700}",
	".dshn-detail-desc{color:var(--dsw-alias-label-secondary,#666);font-size:13px;line-height:1.6;margin-top:4px}",
	".dshn-detail-links{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}",
	".dshn-card{border:1px solid var(--dsw-alias-border-l1,#eee);border-radius:12px;padding:14px;margin-top:14px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2,#fafafa) 60%,transparent)}",
	".dshn-card-title{font-size:13px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:8px}",
	".dshn-card-title .dshn-hint{font-weight:400;font-size:11px;color:var(--dsw-alias-label-tertiary,#aaa)}",
	".dshn-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}",
	".dshn-stat{border:1px solid var(--dsw-alias-border-l1,#eee);border-radius:10px;padding:10px 12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2,#fafafa) 65%,transparent)}",
	".dshn-stat-hero{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 35%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 8%,transparent)}",
	".dshn-stat-label{font-size:11px;color:var(--dsw-alias-label-secondary,#888)}",
	".dshn-stat-value{font-size:20px;font-weight:700;font-variant-numeric:tabular-nums;margin-top:2px;line-height:26px;word-break:break-all}",
	".dshn-stat-sub{font-size:10px;color:var(--dsw-alias-label-tertiary,#aaa);margin-top:2px;font-variant-numeric:tabular-nums}",
	".dshn-chart-wrap{margin-top:12px}",
	".dshn-chart-svg{width:100%;height:auto;display:block}",
	".dshn-chart-bar{fill:var(--dsw-alias-brand-primary,#1668e3);opacity:.82;transition:opacity .12s}",
	".dshn-chart-bar:hover{opacity:1}",
	".dshn-chart-bar-last{fill:var(--dsw-alias-state-success-primary,#2a7d3c);opacity:1}",
	".dshn-chart-bar-peak{opacity:1}",
	".dshn-chart-grid{stroke:var(--dsw-alias-border-l1,#eee);stroke-width:1}",
	".dshn-chart-avg{stroke:var(--dsw-alias-state-warn-primary,#b8860b);stroke-width:1;stroke-dasharray:4 3}",
	".dshn-chart-text{fill:var(--dsw-alias-label-tertiary,#999);font-size:10px;font-family:inherit}",
	".dshn-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 18px}",
	".dshn-meta-row{display:flex;gap:8px;font-size:12.5px;line-height:20px;min-width:0}",
	".dshn-meta-key{color:var(--dsw-alias-label-secondary,#888);flex:none;width:84px;text-align:right}",
	".dshn-meta-val{color:var(--dsw-alias-label-primary,#222);min-width:0;word-break:break-all;font-variant-numeric:tabular-nums}",
	".dshn-tags{display:flex;gap:6px;flex-wrap:wrap}",
	".dshn-table-scroll{max-height:240px;overflow-y:auto;border-radius:6px}",
	".dshn-table{width:100%;border-collapse:collapse;font-size:12.5px}",
	".dshn-table th{text-align:left;color:var(--dsw-alias-label-secondary,#888);font-weight:500;padding:6px 8px;border-bottom:1px solid var(--dsw-alias-border-l1,#eee);white-space:nowrap}",
	".dshn-table-scroll th{position:sticky;top:0;background:var(--dsw-alias-bg-layer-1,#fff);z-index:1}",
	".dshn-table td{padding:6px 8px;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-border-l1,#eee) 60%,transparent);font-variant-numeric:tabular-nums;word-break:break-all}",
	".dshn-table tr:hover td{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.08))}",
	".dshn-readme{font-size:12.5px;line-height:1.7;word-break:break-word;color:var(--dsw-alias-label-primary,#222);max-height:220px;overflow:hidden;position:relative}",
	".dshn-readme-open{max-height:none}",
	".dshn-readme-fade{position:absolute;left:0;right:0;bottom:0;height:56px;background:linear-gradient(transparent,color-mix(in srgb,var(--dsw-alias-bg-layer-1,#fff) 92%,transparent))}",
	".dshn-md > :first-child{margin-top:0}",
	".dshn-md > :last-child{margin-bottom:0}",
	".dshn-md-p{margin:6px 0}",
	".dshn-md-h{margin:12px 0 6px;font-weight:700;line-height:1.4}",
	".dshn-md-h1{font-size:17px}.dshn-md-h2{font-size:15.5px}.dshn-md-h3{font-size:14px}.dshn-md-h4{font-size:13px}",
	".dshn-md-list{margin:6px 0;padding-left:20px}",
	".dshn-md-list li{margin:2px 0}",
	".dshn-md-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11.5px;background:color-mix(in srgb,var(--dsw-alias-label-secondary,#888) 14%,transparent);border-radius:4px;padding:1px 5px;word-break:break-all}",
	".dshn-md-pre{margin:8px 0;padding:10px 12px;background:color-mix(in srgb,var(--dsw-alias-label-secondary,#888) 10%,transparent);border-radius:8px;overflow-x:auto}",
	".dshn-md-pre code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11.5px;background:transparent;padding:0}",
	".dshn-md-quote{margin:8px 0;padding:4px 12px;border-left:3px solid var(--dsw-alias-border-l2,#ddd);color:var(--dsw-alias-label-secondary,#888)}",
	".dshn-md-link{color:var(--dsw-alias-brand-primary,#1668e3);text-decoration:none}",
	".dshn-md-link:hover{text-decoration:underline}",
	".dshn-md-img{max-width:100%;height:auto;border-radius:6px}",
	".dshn-md-hr{border:none;border-top:1px solid var(--dsw-alias-border-l1,#eee);margin:10px 0}",
	".dshn-md-table{border-collapse:collapse;font-size:12px;margin:8px 0;max-width:100%;display:block;overflow-x:auto}",
	".dshn-md-table th,.dshn-md-table td{border:1px solid var(--dsw-alias-border-l1,#eee);padding:4px 8px;text-align:left}",
	".dshn-watch-bar{display:flex;gap:8px;align-items:center;margin-bottom:6px}",
	".dshn-watch-bar .dshn-input{flex:1;min-width:0}",
	".dshn-watch-status{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--dsw-alias-label-secondary,#888);margin:6px 0 10px;flex-wrap:wrap}",
	".dshn-watch-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1,#eee);border-radius:10px;margin-bottom:8px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2,#fafafa) 60%,transparent)}",
	".dshn-watch-item:hover{border-color:var(--dsw-alias-border-l3,#bbb)}",
	".dshn-watch-main{min-width:0;flex:1;cursor:pointer}",
	".dshn-watch-name{font-size:14px;font-weight:600;word-break:break-all;display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
	".dshn-watch-ver{font-size:12px;color:var(--dsw-alias-brand-primary,#1668e3);font-variant-numeric:tabular-nums}",
	".dshn-watch-dl{font-size:12px;color:var(--dsw-alias-label-secondary,#888);margin-top:3px;font-variant-numeric:tabular-nums;display:flex;gap:14px;flex-wrap:wrap}",
	".dshn-delta-up{color:var(--dsw-alias-state-success-primary,#2a7d3c)}",
	".dshn-delta-down{color:var(--dsw-alias-state-error-primary,#d33)}",
	".dshn-trend{display:flex;align-items:flex-end;gap:2px;height:28px;flex:none;padding:2px 2px 0}",
	".dshn-trend-bar{display:block;width:5px;min-height:2px;border-radius:2px 2px 0 0;background:color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 55%,transparent)}",
	".dshn-trend-bar:hover{background:var(--dsw-alias-brand-primary,#1668e3)}",
	".dshn-trend-bar-last{background:var(--dsw-alias-state-success-primary,#2a7d3c)}",
	".dshn-watch-ops{display:flex;align-items:center;gap:6px;flex:none}",
	".dshn-history-bar{display:flex;gap:8px;align-items:center;margin-bottom:12px}",
	".dshn-history-bar .dshn-select{max-width:320px}",
	".dshn-note-chip{display:inline-flex;padding:1px 8px;border-radius:999px;font-size:11px;line-height:16px;border:1px solid var(--dsw-alias-border-l2,#ddd);color:var(--dsw-alias-label-secondary,#777)}",
	".dshn-note-version{color:#4a3500;background:#f0b429;border-color:transparent}",
	".dshn-note-init{color:var(--dsw-alias-brand-primary,#1668e3);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#1668e3) 40%,transparent)}",
	"@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))){.dshn-modal,.dshn-search-pop{background:var(--dsw-alias-bg-layer-1,#fff)}.dshn-card,.dshn-stat,.dshn-watch-item{background:var(--dsw-alias-bg-layer-2,#fafafa)}.dshn-input,.dshn-select{background:var(--dsw-alias-bg-base,#fff)}}"
];
/** 幂等注入样式（style id 去重）。 */
function injectStyles() {
	if (typeof document === "undefined") return;
	const existing = document.getElementById(CSS_ID);
	if (existing !== null) existing.remove();
	const style = document.createElement("style");
	style.id = CSS_ID;
	style.textContent = css.join("\n");
	document.head.appendChild(style);
}
//#endregion
//#region src/client/i18n.ts
/**
* dsh-listen-npm —— 浏览器半边：语言与文案（中英双语，跟随主界面语言）。
*/
/**
* 初始语言：仅作宿主 locale 服务不可用时的兜底。运行时以 plugin.tsx 里的
* locale 订阅为准。
*/
function resolveLang() {
	if (typeof document !== "undefined") {
		const host = document.documentElement.lang || navigator.language || "zh-CN";
		return /^zh/i.test(host) ? "zh" : "en";
	}
	return "zh";
}
/** 当前语言（可变，随宿主 locale 切换；经 setLang 更新）。 */
let lang = resolveLang();
/** 写当前语言（由宿主 locale 订阅驱动；重渲染由 slot 出口的 locale revision 订阅触发）。 */
const setLang = (next) => {
	lang = next;
};
const COPY = {
	zh: {
		configBtn: "npm 监控",
		modalTitle: "npm 包监控",
		modalSubtitle: "查询包信息与每日安装量，跟踪你的 npm 库的变化",
		tabQuery: "查询",
		tabWatch: "监控",
		tabHistory: "历史",
		dataHint: "数据源 npm 官方 registry · 下载量 T+1 更新",
		close: "关闭",
		loading: "加载中…",
		refreshNow: "立即刷新",
		refreshedAt: "上次刷新",
		autoRefreshHint: "每 {n} 分钟自动刷新",
		queryPlaceholder: "输入 npm 包名，如 vue / @vue/core…",
		queryBtn: "查询",
		queryFailed: "查询失败",
		searching: "搜索中…",
		searchNoMatch: "无匹配的包",
		searchPickHint: "输入包名后回车查询，或从联想列表选择",
		watchThis: "加入监控",
		watching: "已监控",
		watchAddFailed: "加入监控失败",
		watchAdded: "已加入监控列表",
		latestVersion: "最新",
		noDescription: "（暂无描述）",
		downloadsTitle: "下载量 / 安装量",
		dlDay: "昨日",
		dlWeek: "近 7 天",
		dlMonth: "近 30 天",
		dlYear: "近一年",
		dailyChartTitle: "每日安装量（近 30 天）",
		dailyAvg: "日均",
		peakDay: "峰值",
		rangeLabel: "统计区间",
		basicTitle: "基本信息",
		fieldCreated: "首次发布",
		fieldModified: "最近更新",
		fieldLatestPublish: "最新版发布",
		fieldVersions: "版本总数",
		fieldMaintainers: "维护者",
		fieldPkgSize: "解包大小",
		fieldFileCount: "文件数",
		fieldNode: "Node 要求",
		fieldNpmUser: "发布者",
		fieldLicense: "许可证",
		distTagsTitle: "版本标签（dist-tags）",
		versionsTitle: "版本列表（最近发布）",
		versionsEmpty: "（无版本数据）",
		readmeTitle: "README 摘要",
		readmeEmpty: "（该包没有 README）",
		readmeExpand: "展开全部",
		readmeCollapse: "收起",
		npmPage: "npm 页面",
		homepage: "主页",
		repository: "仓库",
		issues: "Issues",
		watchPlaceholder: "输入要监控的 npm 包名…",
		watchAddBtn: "添加",
		watchEmpty: "还没有监控任何包。查询一个包后点击「加入监控」，或直接在上方添加。",
		watchTrend: "每日安装量（近 7 天，T+1）",
		watchRemove: "移除",
		watchRemoveConfirm: "确认移除对该包的监控？",
		newVersionBadge: "有新版本",
		watchErrBadge: "刷新失败",
		watchViewDetail: "查看详情",
		watchListCount: "共 {n} 个",
		watchChangedTo: "变为 {v}",
		historyPick: "选择包",
		historyEmpty: "暂无快照记录。版本变更与首次加入监控时会自动记录。",
		historyColTime: "记录时间",
		historyColVersion: "latest 版本",
		historyColDay: "昨日下载",
		historyColWeek: "近 7 天下载",
		historyColNote: "类型",
		historyNoteInit: "加入监控",
		historyNoteVersion: "版本变更",
		footerWatch: "监控中",
		footerNewVersion: "有更新",
		footerNewVersionTitle: "监控的包有新版本，点击查看",
		errors: {
			"pkg-not-found": "未找到该 npm 包，请检查包名（大小写敏感）",
			"pkg-name-invalid": "包名不合法",
			"network-failed": "网络请求失败，请检查网络或 registry 地址",
			"rate-limited": "请求过于频繁（HTTP 429），请稍后再试",
			"registry-http": "registry 返回错误",
			"parse-failed": "响应解析失败",
			"subprocess-missing": "宿主 subprocess 服务不可用",
			"watch-duplicate": "该包已在监控列表中",
			"watch-missing": "该包不在监控列表中",
			"forbidden": "请求被拒绝（非同源）",
			"method-error": "请求方法不允许",
			"body-too-large": "请求体过大",
			"params-invalid": "参数需为 JSON",
			"unknown-op": "未知操作",
			"op-failed": "操作失败",
			"cmdNoResult": "命令未返回结果"
		}
	},
	en: {
		configBtn: "npm Monitor",
		modalTitle: "npm Package Monitor",
		modalSubtitle: "Query package info with daily install counts and track changes of your npm libraries",
		tabQuery: "Query",
		tabWatch: "Watch",
		tabHistory: "History",
		dataHint: "Data source: official npm registry · downloads update T+1",
		close: "Close",
		loading: "Loading…",
		refreshNow: "Refresh now",
		refreshedAt: "Last refresh",
		autoRefreshHint: "Auto refresh every {n} min",
		queryPlaceholder: "Enter an npm package name, e.g. vue / @vue/core…",
		queryBtn: "Query",
		queryFailed: "Query failed",
		searching: "Searching…",
		searchNoMatch: "No matching packages",
		searchPickHint: "Press Enter to query, or pick from suggestions",
		watchThis: "Watch",
		watching: "Watching",
		watchAddFailed: "Failed to watch",
		watchAdded: "Added to watch list",
		latestVersion: "latest",
		noDescription: "(no description)",
		downloadsTitle: "Downloads / Installs",
		dlDay: "Yesterday",
		dlWeek: "Last 7 days",
		dlMonth: "Last 30 days",
		dlYear: "Last year",
		dailyChartTitle: "Daily installs (last 30 days)",
		dailyAvg: "avg",
		peakDay: "peak",
		rangeLabel: "Range",
		basicTitle: "Basic Info",
		fieldCreated: "First publish",
		fieldModified: "Last updated",
		fieldLatestPublish: "Latest publish",
		fieldVersions: "Versions",
		fieldMaintainers: "Maintainers",
		fieldPkgSize: "Unpacked size",
		fieldFileCount: "Files",
		fieldNode: "Node engine",
		fieldNpmUser: "Publisher",
		fieldLicense: "License",
		distTagsTitle: "Version tags (dist-tags)",
		versionsTitle: "Versions (recently published)",
		versionsEmpty: "(no version data)",
		readmeTitle: "README excerpt",
		readmeEmpty: "(no README for this package)",
		readmeExpand: "Expand",
		readmeCollapse: "Collapse",
		npmPage: "npm page",
		homepage: "Homepage",
		repository: "Repository",
		issues: "Issues",
		watchPlaceholder: "Enter an npm package name to watch…",
		watchAddBtn: "Add",
		watchEmpty: "Nothing watched yet. Query a package and click \"Watch\", or add one above.",
		watchTrend: "Daily installs (last 7 days, T+1)",
		watchRemove: "Remove",
		watchRemoveConfirm: "Remove this package from the watch list?",
		newVersionBadge: "NEW",
		watchErrBadge: "refresh failed",
		watchViewDetail: "View detail",
		watchListCount: "{n} total",
		watchChangedTo: "changed to {v}",
		historyPick: "Pick a package",
		historyEmpty: "No snapshots yet. Snapshots are recorded on watch-add and version changes.",
		historyColTime: "Recorded at",
		historyColVersion: "latest version",
		historyColDay: "Day downloads",
		historyColWeek: "7-day downloads",
		historyColNote: "Type",
		historyNoteInit: "watch added",
		historyNoteVersion: "version change",
		footerWatch: "watching",
		footerNewVersion: "UPDATE",
		footerNewVersionTitle: "Watched packages have new versions — click to view",
		errors: {
			"pkg-not-found": "Package not found; check the name (case-sensitive)",
			"pkg-name-invalid": "Invalid package name",
			"network-failed": "Network request failed; check your network or the registry URL",
			"rate-limited": "Rate limited (HTTP 429); try again later",
			"registry-http": "Registry returned an error",
			"parse-failed": "Failed to parse the response",
			"subprocess-missing": "Host subprocess service unavailable",
			"watch-duplicate": "This package is already watched",
			"watch-missing": "This package is not watched",
			"forbidden": "Request rejected (not same-origin)",
			"method-error": "Method not allowed",
			"body-too-large": "Request body too large",
			"params-invalid": "Parameters must be JSON",
			"unknown-op": "Unknown operation",
			"op-failed": "Operation failed",
			"cmdNoResult": "Command returned no result"
		}
	}
};
/** 当前语言的词典（每次调用解析 —— 语言切换后即刻生效，无需重建模块状态）。 */
const dictOf = () => COPY[lang] || COPY.zh;
/** 取文案并替换 {var} 占位符。 */
const t = (key, vars) => {
	const dict = dictOf();
	let s = dict[key] !== void 0 ? dict[key] : String(key);
	if (vars) for (const k of Object.keys(vars)) s = s.split("{" + k + "}").join(String(vars[k]));
	return s;
};
/** 宿主错误通过 code 映射为本地化文本，未知错误回退原文。 */
const tErr = (res, fallback) => {
	const dict = dictOf();
	if (res && res.code) {
		const local = dict.errors[res.code];
		if (local !== void 0) return local;
	}
	return res && res.error || fallback || "";
};
//#endregion
//#region src/client/rpc.ts
/**
* dsh-listen-npm —— 浏览器半边：与宿主通信。
*
* 默认走宿主 webServer 注册的带信任围栏的 HTTP 路由 /dsh-listen-npm/api
* （fetch POST JSON → { ok, value } 信封），请求不进入对话命令通道，因此不会在
* 页面产生 command 节点，后台轮询也不会追加会话记录。
*
* 老宿主（未注册该路由，如 headless 组合）自动回退到 commands.execute 命令通道，
* 仅作兼容，不影响新宿主上的行为。
*/
/**
* 尝试经 HTTP 路由执行一次 op。
* @returns 路由可用并返回有效载荷时返回 RunResult；否则返回 null（调用方回退命令通道）。
*/
async function runHttp(sessionId, op) {
	try {
		const response = await fetch("/dsh-listen-npm/api", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(Object.assign({ sessionId: sessionId || "" }, op))
		});
		if (!response.ok) return null;
		const parsed = await response.json().catch(() => null);
		if (parsed === null || parsed.ok !== true || parsed.value === void 0) return null;
		const value = parsed.value;
		return value !== null && typeof value === "object" ? value : {
			ok: false,
			error: String(value)
		};
	} catch {
		return null;
	}
}
function makeRun(ctx) {
	return async function run(sessionId, op) {
		const viaHttp = await runHttp(sessionId, op);
		if (viaHttp !== null) return viaHttp;
		try {
			const execution = await ctx.remote.commands.execute(sessionId || "", "/dsh-listen-npm " + JSON.stringify(op));
			const value = execution && execution.ok === true ? execution.value : void 0;
			const text = value && value.result && typeof value.result.text === "string" ? value.result.text : null;
			if (text === null || text.length === 0) return {
				ok: false,
				code: "cmdNoResult",
				error: t("errors.cmdNoResult")
			};
			try {
				return JSON.parse(text);
			} catch {
				return {
					ok: false,
					error: text.slice(0, 200)
				};
			}
		} catch (e) {
			return {
				ok: false,
				error: e instanceof Error ? e.message : String(e)
			};
		}
	};
}
//#endregion
//#region src/client/store.ts
/**
* dsh-listen-npm —— 浏览器半边：弹框开关 + footer 胶囊摘要（footer 入口 ↔ overlay 弹框共享）。
*/
function createStore(initial) {
	return {
		value: initial,
		listeners: [],
		emit() {
			for (let i = 0; i < this.listeners.length; i++) this.listeners[i]();
		},
		subscribe(l) {
			this.listeners.push(l);
			return () => {
				const i = this.listeners.indexOf(l);
				if (i >= 0) this.listeners.splice(i, 1);
			};
		}
	};
}
function useStoreValue(target) {
	const [v, setV] = (0, react.useState)(target.value);
	(0, react.useEffect)(() => target.subscribe(() => setV(target.value)), [target]);
	return v;
}
function makeModalStore() {
	const store = createStore(false);
	return {
		useOpen: () => useStoreValue(store),
		open: () => {
			store.value = true;
			store.emit();
		},
		close: () => {
			store.value = false;
			store.emit();
		}
	};
}
function makeSummaryStore() {
	const store = createStore({
		watching: 0,
		newVersions: 0
	});
	return {
		set: (s) => {
			store.value = s;
			store.emit();
		},
		useSummary: () => useStoreValue(store)
	};
}
function makeNumberStore(initial) {
	const store = createStore(initial);
	return {
		set: (n) => {
			if (store.value === n) return;
			store.value = n;
			store.emit();
		},
		use: () => useStoreValue(store)
	};
}
//#endregion
//#region src/client/poller.ts
const DEFAULT_REFRESH_MINUTES = 10;
function createPoller(run, summary) {
	let refreshMinutes = DEFAULT_REFRESH_MINUTES;
	let lastRefreshAt = 0;
	let busy = false;
	let booted = false;
	let dirty = false;
	let errorText = "";
	let cachedWatch = [];
	let currentSummary = {
		watching: 0,
		newVersions: 0
	};
	const listeners = [];
	const emit = () => {
		for (const l of listeners) l();
	};
	const applyWatch = (watch) => {
		cachedWatch = watch;
		currentSummary = {
			watching: watch.length,
			newVersions: watch.filter((w) => w.hasNewVersion === true).length
		};
		summary.set(currentSummary);
		emit();
	};
	const doRefresh = async () => {
		if (busy) return;
		if (cachedWatch.length === 0 && !dirty) return;
		busy = true;
		try {
			const res = await run("", { op: "watchRefresh" });
			if (res && res.ok && Array.isArray(res.watch)) {
				lastRefreshAt = Date.now();
				errorText = "";
				dirty = false;
				applyWatch(res.watch);
			} else {
				errorText = tErr(res, res && res.error ? String(res.error) : "");
				emit();
			}
		} catch (e) {
			errorText = e instanceof Error ? e.message : String(e);
			emit();
		} finally {
			busy = false;
		}
	};
	const loadWatch = async () => {
		try {
			const res = await run("", { op: "watchList" });
			if (res && res.ok && Array.isArray(res.watch)) applyWatch(res.watch);
		} catch {}
	};
	return {
		refresh: () => {
			dirty = true;
			return doRefresh();
		},
		tick() {
			if (busy) return;
			if (dirty) {
				doRefresh();
				return;
			}
			if (cachedWatch.length === 0) return;
			if (Date.now() - lastRefreshAt < refreshMinutes * 60 * 1e3) return;
			doRefresh();
		},
		bootstrap() {
			if (booted) return;
			booted = true;
			(async () => {
				try {
					const cfg = await run("", { op: "config" });
					if (cfg && cfg.ok && typeof cfg.refreshMinutes === "number" && cfg.refreshMinutes > 0) refreshMinutes = cfg.refreshMinutes;
				} catch {}
				await loadWatch();
			})();
		},
		getSummary: () => currentSummary,
		subscribe(fn) {
			listeners.push(fn);
			return () => {
				const i = listeners.indexOf(fn);
				if (i >= 0) listeners.splice(i, 1);
			};
		},
		getWatch: () => cachedWatch,
		markSeen() {
			const has = cachedWatch.some((w) => w.hasNewVersion === true);
			applyWatch(cachedWatch.map((w) => w.hasNewVersion === true ? {
				...w,
				hasNewVersion: false
			} : w));
			if (has) run("", { op: "watchSeen" }).catch(() => {});
		},
		invalidate() {
			dirty = true;
			loadWatch();
		},
		lastError: () => errorText,
		lastRefreshAt: () => lastRefreshAt
	};
}
/** footer 入口按钮图标（data URI，自包含）。 */
const NPM_LOGO = "data:image/svg+xml," + encodeURIComponent("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" rx=\"14\" fill=\"#CB3837\"/><text x=\"32\" y=\"41.5\" font-family=\"Arial, Helvetica, sans-serif\" font-size=\"23\" font-weight=\"700\" fill=\"#ffffff\" text-anchor=\"middle\" letter-spacing=\"0.5\">npm</text></svg>");
//#endregion
//#region src/client/components/FooterButton.tsx
/**
* dsh-listen-npm —— 侧边栏底部入口（sidebar.footer.action）：
* 常驻「npm 监控」按钮，点击打开统一弹框（查询 / 监控 / 历史 三个 tab）。
*
* 按钮右侧小胶囊：
* - 蓝描边：监控中的包数量（有监控时显示）；
* - 琥珀橙【有更新】：监控的包出现新版本且未查看时显示（数据来自后台轮询器）。
*/
const EMPTY_SUMMARY = {
	watching: 0,
	newVersions: 0
};
function FooterButton({ onOpen, reportSession, wide = false, useSessions, poller }) {
	const currentSessionId = useSessions ? useSessions((s) => s && s.current) : null;
	if (reportSession && currentSessionId) reportSession(currentSessionId);
	const [summary, setSummary] = (0, react.useState)(EMPTY_SUMMARY);
	(0, react.useEffect)(() => {
		if (!poller) return;
		const update = () => {
			setSummary(poller.getSummary());
		};
		update();
		return poller.subscribe(update);
	}, [poller]);
	const showWatch = summary.watching > 0;
	const showNew = summary.newVersions > 0;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: "dshn-footer-group" + (wide ? "" : " dshn-footer-rail-group"),
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "dshn-footer-btn" + (wide ? "" : " dshn-footer-btn-rail"),
			title: t("configBtn"),
			"aria-label": t("configBtn"),
			onClick: onOpen,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
				src: NPM_LOGO,
				alt: "",
				className: "dshn-footer-logo"
			}), wide ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "dshn-footer-label",
				children: t("configBtn")
			}) : null]
		}), showWatch || showNew ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
			className: "dshn-footer-caps",
			children: [showWatch ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "dshn-capsule dshn-capsule-watch",
				title: t("footerWatch") + ": " + summary.watching,
				children: summary.watching
			}) : null, showNew ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "dshn-capsule dshn-capsule-new",
				title: t("footerNewVersionTitle"),
				children: t("footerNewVersion")
			}) : null]
		}) : null]
	});
}
//#endregion
//#region src/client/components/ModalPortal.tsx
function ModalPortal({ onBackdropClose, children }) {
	return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		className: "dshn-backdrop",
		onClick: onBackdropClose ? (e) => {
			e.stopPropagation();
			onBackdropClose();
		} : void 0,
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: "dshn-modal",
			onClick: (e) => e.stopPropagation(),
			children
		})
	}), document.body);
}
//#endregion
//#region src/client/format.ts
/**
* dsh-listen-npm —— 展示格式化工具（数字紧凑化 / 日期 / 相对时间 / 趋势）。
*/
/** 大数紧凑化：1.2B / 15.6M / 234.5k / 987。 */
const fmtCompact = (n) => {
	if (typeof n !== "number" || !Number.isFinite(n)) return "—";
	const abs = Math.abs(n);
	if (abs >= 1e9) return (n / 1e9).toFixed(abs >= 1e10 ? 0 : 1) + "B";
	if (abs >= 1e6) return (n / 1e6).toFixed(abs >= 1e7 ? 0 : 1) + "M";
	if (abs >= 1e3) return (n / 1e3).toFixed(abs >= 1e4 ? 0 : 1) + "k";
	return String(n);
};
/** 千分位整数。 */
const fmtInt = (n) => typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("en-US") : "—";
/** ISO 时间 → 本地 "YYYY-MM-DD HH:mm"（仅日期字段容错）。 */
const fmtDateTime = (iso) => {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso.slice(0, 19).replace("T", " ");
	const p = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
/** ISO 时间 → 本地日期 "YYYY-MM-DD"。 */
const fmtDate = (iso) => {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
	const p = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
/** epoch ms → 相对时间（分钟/小时/天前）。 */
const fmtRel = (ms) => {
	if (typeof ms !== "number" || !Number.isFinite(ms)) return "—";
	const diff = Date.now() - ms;
	if (diff < 6e4) return "<1m";
	if (diff < 36e5) return Math.floor(diff / 6e4) + "m";
	if (diff < 864e5) return Math.floor(diff / 36e5) + "h";
	return Math.floor(diff / 864e5) + "d";
};
/** 字节数 → 可读（1.2 MB / 340 kB）。 */
const fmtBytes = (n) => {
	if (typeof n !== "number" || !Number.isFinite(n)) return "—";
	if (n >= 1e6) return (n / 1e6).toFixed(1) + " MB";
	if (n >= 1e3) return (n / 1e3).toFixed(1) + " kB";
	return n + " B";
};
//#endregion
//#region src/client/components/DownloadChart.tsx
const W = 720;
const H = 240;
const PAD_L = 52;
function DownloadChart({ data }) {
	if (!data || data.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		className: "dshn-empty",
		children: t("versionsEmpty")
	});
	const values = data.map((p) => p.downloads);
	const max = Math.max(...values, 1);
	const avg = values.reduce((a, b) => a + b, 0) / values.length;
	const peakIdx = values.indexOf(Math.max(...values));
	const lastIdx = data.length - 1;
	const plotW = 658;
	const plotH = 196;
	const slot = plotW / data.length;
	const barW = Math.max(2, Math.min(18, slot * .72));
	const yOf = (v) => 216 - v / max * plotH;
	const xOf = (i) => PAD_L + slot * i + (slot - barW) / 2;
	const gridVals = [
		max,
		max / 2,
		0
	];
	const xTicks = data.length >= 3 ? [
		0,
		Math.floor((data.length - 1) / 2),
		data.length - 1
	] : data.map((_, i) => i);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
		className: "dshn-chart-svg",
		viewBox: `0 0 ${W} ${H}`,
		role: "img",
		"aria-label": t("dailyChartTitle"),
		children: [
			gridVals.map((v, i) => {
				const y = yOf(v);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
					className: "dshn-chart-grid",
					x1: PAD_L,
					y1: y,
					x2: 710,
					y2: y
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("text", {
					className: "dshn-chart-text",
					x: 46,
					y: y + 3,
					textAnchor: "end",
					children: fmtCompact(v)
				})] }, i);
			}),
			avg > 0 && avg < max ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
				className: "dshn-chart-avg",
				x1: PAD_L,
				y1: yOf(avg),
				x2: 710,
				y2: yOf(avg)
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("text", {
				className: "dshn-chart-text",
				x: 708,
				y: yOf(avg) - 4,
				textAnchor: "end",
				children: [
					t("dailyAvg"),
					" ",
					fmtCompact(avg)
				]
			})] }) : null,
			data.map((p, i) => {
				const y = yOf(p.downloads);
				const h = Math.max(1, 216 - y);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					className: "dshn-chart-bar" + (i === lastIdx ? " dshn-chart-bar-last" : "") + (i === peakIdx ? " dshn-chart-bar-peak" : ""),
					x: xOf(i),
					y,
					width: barW,
					height: h,
					rx: Math.min(3, barW / 2),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("title", { children: `${p.day} · ${fmtInt(p.downloads)}${i === peakIdx ? " · " + t("peakDay") : ""}` })
				}, p.day);
			}),
			peakIdx !== -1 && peakIdx !== lastIdx && data[peakIdx].downloads > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("text", {
				className: "dshn-chart-text",
				x: xOf(peakIdx) + barW / 2,
				y: yOf(data[peakIdx].downloads) - 5,
				textAnchor: "middle",
				children: fmtCompact(data[peakIdx].downloads)
			}) : null,
			xTicks.map((i) => {
				const day = data[i].day;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("text", {
					className: "dshn-chart-text",
					x: xOf(i) + barW / 2,
					y: 232,
					textAnchor: i === 0 ? "start" : i === data.length - 1 ? "end" : "middle",
					children: day.slice(5)
				}, i);
			})
		]
	});
}
//#endregion
//#region src/client/components/Markdown.tsx
/** 行内 token（交替顺序即优先级：代码 → 加粗 → 斜体 → 删除线 → 图片 → 链接 → 裸链接）。 */
const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|(\*[^*\n]+\*)|((?<![\w])_[^_\n]+_(?!\w))|(~~[^~\n]+~~)|(!\[[^\]]*\]\([^)\s]+\))|(\[[^\]]*\]\([^)\s]+\))|(https?:\/\/[^\s<>()[\]]+)/g;
/** 行内解析：markdown 片段 → React 节点。breaks=true 时单换行渲染为 <br>。 */
function inline(text, breaks = false) {
	const out = [];
	let last = 0;
	let k = 0;
	for (const m of text.matchAll(INLINE)) {
		const idx = m.index ?? 0;
		if (idx > last) out.push(...plain(text.slice(last, idx), breaks));
		const tok = m[0];
		if (tok.startsWith("`")) out.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
			className: "dshn-md-code",
			children: tok.slice(1, -1)
		}, k++));
		else if (tok.startsWith("**") || tok.startsWith("__")) out.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: inline(tok.slice(2, -2), breaks) }, k++));
		else if (tok.startsWith("~~")) out.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("del", { children: inline(tok.slice(2, -2), breaks) }, k++));
		else if (tok.startsWith("*") || tok.startsWith("_")) out.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: inline(tok.slice(1, -1), breaks) }, k++));
		else if (tok.startsWith("![")) {
			const mm = tok.match(/!\[([^\]]*)\]\(([^)\s]+)\)/);
			if (mm && /^https?:\/\//i.test(mm[2])) out.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
				className: "dshn-md-img",
				src: mm[2],
				alt: mm[1],
				loading: "lazy"
			}, k++));
			else out.push(...plain(tok, breaks));
		} else if (tok.startsWith("[")) {
			const mm = tok.match(/\[([^\]]*)\]\(([^)\s]+)\)/);
			if (mm && /^https?:\/\//i.test(mm[2])) out.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
				className: "dshn-md-link",
				href: mm[2],
				target: "_blank",
				rel: "noreferrer",
				children: inline(mm[1])
			}, k++));
			else out.push(...plain(tok, breaks));
		} else out.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
			className: "dshn-md-link",
			href: tok,
			target: "_blank",
			rel: "noreferrer",
			children: tok
		}, k++));
		last = idx + tok.length;
	}
	if (last < text.length) out.push(...plain(text.slice(last), breaks));
	return out;
}
/** 纯文本段：breaks=true 时按 \n 切 <br>（保留 README 常见的手工换行）。 */
function plain(text, breaks) {
	if (!breaks || !text.includes("\n")) return [text];
	const out = [];
	text.split("\n").forEach((p, idx) => {
		if (idx > 0) out.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("br", {}, "br" + idx));
		if (p.length > 0) out.push(p);
	});
	return out;
}
/** 表格分隔行（| --- | :---: |）。 */
const isTableSep = (line) => /^\s*\|?[\s:|-]*-[\s:|-]*\|/.test(line) || /^\s*\|[\s:|-]+$/.test(line);
/** 表格行拆列（容忍首尾竖线与转义竖线的缺失场景）。 */
const splitRow = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
/** 块级起始判断（段落聚合的终止条件）。 */
function isBlockStart(line, next) {
	if (/^(#{1,6}\s|```|\s*>)/.test(line)) return true;
	if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) return true;
	if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) return true;
	return line.includes("|") && next !== void 0 && next.includes("-") && isTableSep(next);
}
/** Markdown 渲染入口：整段文本 → React 元素列表。 */
function Markdown({ text }) {
	const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
	const blocks = [];
	let i = 0;
	let key = 0;
	while (i < lines.length) {
		const line = lines[i];
		if (/^```/.test(line.trim()) || /^~~~/.test(line.trim())) {
			const buf = [];
			i++;
			while (i < lines.length && !/^(```|~~~)\s*$/.test(lines[i].trim())) {
				buf.push(lines[i]);
				i++;
			}
			i++;
			blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
				className: "dshn-md-pre",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: buf.join("\n") })
			}, key++));
			continue;
		}
		const h = line.match(/^(#{1,6})\s+(.*)$/);
		if (h) {
			const level = Math.min(h[1].length, 4);
			const Tag = "h" + level;
			blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tag, {
				className: `dshn-md-h dshn-md-h${level}`,
				children: inline(h[2])
			}, key++));
			i++;
			continue;
		}
		if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
			blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("hr", { className: "dshn-md-hr" }, key++));
			i++;
			continue;
		}
		if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
			const header = splitRow(line);
			i += 2;
			const rows = [];
			while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
				rows.push(splitRow(lines[i]));
				i++;
			}
			blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("table", {
				className: "dshn-md-table",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tr", { children: header.map((c, ci) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: inline(c) }, ci)) }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", { children: rows.map((r, ri) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tr", { children: r.map((c, ci) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: inline(c) }, ci)) }, ri)) })]
			}, key++));
			continue;
		}
		if (/^\s*>\s?/.test(line)) {
			const buf = [];
			while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
				buf.push(lines[i].replace(/^\s*>\s?/, ""));
				i++;
			}
			blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("blockquote", {
				className: "dshn-md-quote",
				children: inline(buf.join("\n"), true)
			}, key++));
			continue;
		}
		if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
			const ordered = /^\s*\d+[.)]\s+/.test(line);
			const items = [];
			while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
				items.push(lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, ""));
				i++;
			}
			const List = ordered ? "ol" : "ul";
			blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(List, {
				className: "dshn-md-list",
				children: items.map((it, ii) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: inline(it, true) }, ii))
			}, key++));
			continue;
		}
		if (line.trim() === "") {
			i++;
			continue;
		}
		const buf = [];
		while (i < lines.length && lines[i].trim() !== "" && !isBlockStart(lines[i], lines[i + 1])) {
			buf.push(lines[i]);
			i++;
		}
		blocks.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
			className: "dshn-md-p",
			children: inline(buf.join("\n"), true)
		}, key++));
	}
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		className: "dshn-md",
		children: blocks
	});
}
//#endregion
//#region src/client/components/PackageDetail.tsx
/**
* dsh-listen-npm —— 包详情视图（查询 tab 主体）。
*
* 布局：头部（名称/版本/许可证/操作）→ 描述与链接 → 下载量卡片（突出显示：
* 昨日/近7天/近30天/近一年 + 每日安装量柱状图）→ 基本信息 → dist-tags →
* 版本列表（固定高度滚动）→ README 摘要（Markdown 渲染）。
*/
/** 拼一行链接（无值时跳过）。 */
function Links({ res }) {
	const info = res.info;
	if (!info) return null;
	const npmPage = "https://www.npmjs.com/package/" + encodeURIComponent(info.name).replace("%40", "@");
	const links = [];
	if (info.homepage) links.push({
		label: t("homepage"),
		href: info.homepage
	});
	if (info.repository) links.push({
		label: t("repository"),
		href: info.repository
	});
	if (info.bugs) links.push({
		label: t("issues"),
		href: info.bugs
	});
	links.push({
		label: t("npmPage"),
		href: npmPage
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		className: "dshn-detail-links",
		children: links.map((l) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("a", {
			className: "dshn-link",
			href: l.href,
			target: "_blank",
			rel: "noreferrer",
			children: [l.label, " ↗"]
		}, l.label + l.href))
	});
}
function PackageDetail({ res, watched, onWatch, watchBusy, notice }) {
	const [readmeOpen, setReadmeOpen] = (0, react.useState)(false);
	const info = res.info;
	if (!res.ok || !info) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: "dshn-err",
		children: [
			t("queryFailed"),
			": ",
			res.error || res.code || ""
		]
	});
	const p = res.points;
	const daily = res.daily || [];
	const detail = info.latestDetail;
	const versionRows = info.versions || [];
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dshn-detail-head",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					minWidth: 0,
					flex: 1
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-detail-name",
						children: [info.name, /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "dshn-detail-ver",
							children: [info.latest ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "dshn-chip dshn-chip-latest",
								children: [
									t("latestVersion"),
									" ",
									info.latest
								]
							}) : null, info.license ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dshn-chip",
								children: info.license
							}) : null]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dshn-detail-desc",
						children: info.description || t("noDescription")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Links, { res })
				]
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					gap: 6,
					alignItems: "flex-end"
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: "dshn-btn dshn-btn-small",
					disabled: watched || watchBusy,
					onClick: onWatch,
					children: watched ? t("watching") : t("watchThis")
				})
			})]
		}),
		notice ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: notice.startsWith("!") ? "dshn-err" : "dshn-ok",
			children: notice.startsWith("!") ? notice.slice(1) : notice
		}) : null,
		/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dshn-card",
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dshn-card-title",
					children: [t("downloadsTitle"), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "dshn-hint",
						children: [
							t("rangeLabel"),
							" ",
							res.rangeStart || "—",
							" ~ ",
							res.rangeEnd || "—"
						]
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dshn-stats",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dshn-stat dshn-stat-hero",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dshn-stat-label",
									children: t("dlDay")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dshn-stat-value",
									children: fmtInt(p?.day?.downloads)
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dshn-stat-sub",
									children: p?.day?.end || ""
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dshn-stat",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dshn-stat-label",
									children: t("dlWeek")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dshn-stat-value",
									children: fmtCompact(p?.week?.downloads)
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dshn-stat-sub",
									children: fmtInt(p?.week?.downloads)
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dshn-stat",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dshn-stat-label",
									children: t("dlMonth")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dshn-stat-value",
									children: fmtCompact(p?.month?.downloads)
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dshn-stat-sub",
									children: fmtInt(p?.month?.downloads)
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dshn-stat",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dshn-stat-label",
									children: t("dlYear")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dshn-stat-value",
									children: fmtCompact(p?.year?.downloads)
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dshn-stat-sub",
									children: fmtInt(p?.year?.downloads)
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dshn-chart-wrap",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-card-title",
						style: { marginBottom: 4 },
						children: [t("dailyChartTitle"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-hint",
							children: daily.length > 0 ? `${daily[0].day} ~ ${daily[daily.length - 1].day}` : ""
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DownloadChart, { data: daily })]
				})
			]
		}),
		/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dshn-card",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dshn-card-title",
				children: t("basicTitle")
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dshn-meta",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-meta-row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-key",
							children: t("fieldCreated")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-val",
							children: fmtDate(info.created)
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-meta-row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-key",
							children: t("fieldModified")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-val",
							children: fmtDateTime(info.modified)
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-meta-row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-key",
							children: t("fieldLatestPublish")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "dshn-meta-val",
							children: [fmtDateTime(detail?.publishTime), detail?.npmUser ? "（" + detail.npmUser + "）" : ""]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-meta-row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-key",
							children: t("fieldVersions")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-val",
							children: info.versionsCount ?? "—"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-meta-row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-key",
							children: t("fieldPkgSize")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-val",
							children: fmtBytes(detail?.unpackedSize)
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-meta-row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-key",
							children: t("fieldFileCount")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-val",
							children: detail?.fileCount ?? "—"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-meta-row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-key",
							children: t("fieldNode")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-val",
							children: detail?.engines?.node || "—"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-meta-row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-key",
							children: t("fieldMaintainers")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-val",
							children: (info.maintainers || []).map((m) => m.name || m.email || "").filter(Boolean).join(", ") || "—"
						})]
					}),
					info.author ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-meta-row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-key",
							children: "author"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-meta-val",
							children: info.author
						})]
					}) : null
				]
			})]
		}),
		info.distTags && Object.keys(info.distTags).length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dshn-card",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dshn-card-title",
				children: t("distTagsTitle")
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dshn-tags",
				children: Object.entries(info.distTags).map(([tag, ver]) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: "dshn-chip" + (tag === "latest" ? " dshn-chip-latest" : ""),
					children: [
						tag,
						": ",
						ver
					]
				}, tag))
			})]
		}) : null,
		/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dshn-card",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dshn-card-title",
				children: [t("versionsTitle"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dshn-hint",
					children: versionRows.length
				})]
			}), versionRows.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dshn-empty",
				children: t("versionsEmpty")
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dshn-table-scroll",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("table", {
					className: "dshn-table",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
						style: { width: "30%" },
						children: "version"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("historyColTime") })] }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", { children: versionRows.map((v) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", { children: [v.version, v.latest ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dshn-chip dshn-chip-latest",
						style: { marginLeft: 8 },
						children: t("latestVersion")
					}) : null] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: fmtDateTime(v.time) })] }, v.version)) })]
				})
			})]
		}),
		/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dshn-card",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dshn-card-title",
				children: [t("readmeTitle"), info.readme ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: "dshn-btn dshn-btn-small",
					onClick: () => setReadmeOpen(!readmeOpen),
					children: readmeOpen ? t("readmeCollapse") : t("readmeExpand")
				}) : null]
			}), info.readme ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: { position: "relative" },
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dshn-readme" + (readmeOpen ? " dshn-readme-open" : ""),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Markdown, { text: info.readme })
				}), !readmeOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dshn-readme-fade" }) : null]
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dshn-empty",
				children: t("readmeEmpty")
			})]
		})
	] });
}
//#endregion
//#region src/client/components/QueryTab.tsx
/**
* dsh-listen-npm —— 查询 tab：包名输入 + 联想搜索 + 详情展示。
*
* - 输入 ≥2 字符时防抖 300ms 调 search op 弹出联想列表（名称/描述/周下载量）；
* - 回车或点击「查询」直接拉取 info op 展示完整详情；
* - 详情头部可一键加入监控（watchAdd op）。
*/
function QueryTab({ run, initialPkg, watchedNames, onWatchChanged }) {
	const [input, setInput] = (0, react.useState)(initialPkg || "");
	const [querying, setQuerying] = (0, react.useState)(false);
	const [error, setError] = (0, react.useState)("");
	const [res, setRes] = (0, react.useState)(null);
	const [watchBusy, setWatchBusy] = (0, react.useState)(false);
	const [watchNotice, setWatchNotice] = (0, react.useState)("");
	const [suggests, setSuggests] = (0, react.useState)(null);
	const [suggesting, setSuggesting] = (0, react.useState)(false);
	const suggestSeq = (0, react.useRef)(0);
	const querySeq = (0, react.useRef)(0);
	const query = (0, react.useCallback)(async (pkgRaw) => {
		const pkg = pkgRaw.trim();
		if (pkg.length === 0) return;
		const seq = ++querySeq.current;
		setQuerying(true);
		setError("");
		setRes(null);
		setWatchNotice("");
		setSuggests(null);
		try {
			const r = await run("", {
				op: "info",
				pkg
			});
			if (seq !== querySeq.current) return;
			setRes(r);
			if (!(r && r.ok)) setError(tErr(r));
		} finally {
			if (seq === querySeq.current) setQuerying(false);
		}
	}, [run]);
	(0, react.useEffect)(() => {
		if (initialPkg && initialPkg.trim().length > 0) query(initialPkg);
	}, [initialPkg]);
	(0, react.useEffect)(() => {
		const q = input.trim();
		if (q.length < 2 || q === initialPkg) {
			setSuggests(null);
			return;
		}
		const seq = ++suggestSeq.current;
		setSuggesting(true);
		const timer = setTimeout(async () => {
			try {
				const r = await run("", {
					op: "search",
					text: q,
					size: 8
				});
				if (seq !== suggestSeq.current) return;
				if (r && r.ok && Array.isArray(r.results)) setSuggests(r.results);
				else setSuggests([]);
			} catch {
				if (seq === suggestSeq.current) setSuggests([]);
			} finally {
				if (seq === suggestSeq.current) setSuggesting(false);
			}
		}, 300);
		return () => clearTimeout(timer);
	}, [
		input,
		run,
		initialPkg
	]);
	const doWatch = async () => {
		if (!res?.info) return;
		setWatchBusy(true);
		setWatchNotice("");
		try {
			const r = await run("", {
				op: "watchAdd",
				pkg: res.info.name
			});
			if (r && r.ok) {
				setWatchNotice(t("watchAdded"));
				onWatchChanged();
			} else setWatchNotice("!" + t("watchAddFailed") + ": " + tErr(r));
		} finally {
			setWatchBusy(false);
		}
	};
	const watchedSet = watchedNames;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dshn-query-wrap",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dshn-query-bar",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					className: "dshn-input",
					value: input,
					placeholder: t("queryPlaceholder"),
					spellCheck: false,
					onChange: (e) => setInput(e.target.value),
					onKeyDown: (e) => {
						if (e.key === "Enter") query(input);
					}
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: "dshn-btn dshn-btn-primary",
					disabled: querying || input.trim().length === 0,
					onClick: () => void query(input),
					children: querying ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dshn-spin" }), t("loading")] }) : t("queryBtn")
				})]
			}), suggests !== null && suggests.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dshn-search-pop",
				children: suggests.map((s) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "dshn-search-item",
					onClick: () => {
						setInput(s.name);
						query(s.name);
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dshn-search-item-name",
							children: [
								s.name,
								s.version ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dshn-link",
									children: s.version
								}) : null,
								typeof s.weekly === "number" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									style: {
										marginLeft: "auto",
										fontSize: 11
									},
									children: [fmtCompact(s.weekly), "/w"]
								}) : null
							]
						}),
						s.description ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dshn-search-item-desc",
							children: s.description
						}) : null,
						s.publisher || s.date ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dshn-search-item-meta",
							children: [s.publisher || "", s.date ? " · " + s.date.slice(0, 10) : ""]
						}) : null
					]
				}, s.name))
			}) : suggesting && input.trim().length >= 2 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dshn-search-pop",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dshn-empty",
					style: { padding: "10px 12px" },
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dshn-spin" }), t("searching")]
				})
			}) : null]
		}),
		error ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: "dshn-err",
			children: error
		}) : null,
		querying ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dshn-loading",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dshn-spin" }), t("loading")]
		}) : null,
		!res && !querying && !error ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: "dshn-empty",
			children: t("searchPickHint")
		}) : null,
		res && res.ok && res.info ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PackageDetail, {
			res,
			watched: watchedSet.has(res.info.name),
			onWatch: () => void doWatch(),
			watchBusy,
			notice: watchNotice
		}) : null
	] });
}
//#endregion
//#region src/client/components/WatchTab.tsx
/**
* dsh-listen-npm —— 监控 tab：监控列表的增删与状态总览。
*
* - 顶部：添加输入框 + 立即刷新 + 自动刷新间隔说明；
* - 列表项：包名（点击进查询 tab 看详情）、latest 版本、昨日/近7天下载量
*   （与上个快照对比的趋势箭头）、右侧近 7 天日安装量迷你柱状图（数据随
*   刷新响应返回，无额外请求）、新版本未读徽标、刷新失败原因、移除按钮；
* - 打开 tab 时自动清除新版本未读标记（watchSeen op，footer 橙色胶囊随之消失）。
*/
/** 迷你日安装量柱状图（近 7 天，随刷新更新；每根柱带原生 tooltip）。 */
function MiniTrend({ daily }) {
	const data = daily || [];
	if (data.length === 0) return null;
	const max = Math.max(...data.map((p) => p.downloads), 1);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		className: "dshn-trend",
		title: t("watchTrend"),
		"aria-label": t("watchTrend"),
		children: data.map((p, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			className: "dshn-trend-bar" + (i === data.length - 1 ? " dshn-trend-bar-last" : ""),
			style: { height: Math.max(10, Math.round(p.downloads / max * 100)) + "%" },
			title: `${p.day} · ${fmtInt(p.downloads)}`
		}, p.day))
	});
}
function WatchTab({ run, poller, onOpenDetail, refreshMinutes }) {
	const [items, setItems] = (0, react.useState)(() => poller.getWatch());
	const [input, setInput] = (0, react.useState)("");
	const [busy, setBusy] = (0, react.useState)(false);
	const [error, setError] = (0, react.useState)("");
	const [lastRefresh, setLastRefresh] = (0, react.useState)(0);
	(0, react.useEffect)(() => {
		const update = () => {
			setItems(poller.getWatch().slice());
			setLastRefresh(poller.lastRefreshAt());
		};
		update();
		return poller.subscribe(update);
	}, [poller]);
	(0, react.useEffect)(() => {
		poller.markSeen();
	}, [poller]);
	const add = async () => {
		const pkg = input.trim();
		if (pkg.length === 0 || busy) return;
		setBusy(true);
		setError("");
		try {
			const r = await run("", {
				op: "watchAdd",
				pkg
			});
			if (r && r.ok) {
				setInput("");
				poller.invalidate();
			} else setError(tErr(r));
		} finally {
			setBusy(false);
		}
	};
	const remove = async (name) => {
		if (busy) return;
		if (!window.confirm(t("watchRemoveConfirm"))) return;
		setBusy(true);
		setError("");
		try {
			const r = await run("", {
				op: "watchRemove",
				pkg: name
			});
			if (r && r.ok) poller.invalidate();
			else setError(tErr(r));
		} finally {
			setBusy(false);
		}
	};
	const refreshAll = async () => {
		if (busy) return;
		setBusy(true);
		try {
			await poller.refresh();
			setLastRefresh(poller.lastRefreshAt());
		} finally {
			setBusy(false);
		}
	};
	const dlText = (w) => {
		const dayDelta = w.prevDay !== void 0 && w.lastDay !== void 0 && w.prevDay > 0 ? (w.lastDay - w.prevDay) / w.prevDay * 100 : null;
		return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
			t("dlDay"),
			" ",
			fmtCompact(w.lastDay),
			dayDelta !== null && Math.abs(dayDelta) >= .5 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: dayDelta >= 0 ? "dshn-delta-up" : "dshn-delta-down",
				children: [
					" (",
					dayDelta >= 0 ? "+" : "",
					dayDelta.toFixed(1),
					"%)"
				]
			}) : null
		] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
			t("dlWeek"),
			" ",
			fmtCompact(w.lastWeek)
		] })] });
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dshn-watch-bar",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				className: "dshn-input",
				value: input,
				placeholder: t("watchPlaceholder"),
				spellCheck: false,
				onChange: (e) => setInput(e.target.value),
				onKeyDown: (e) => {
					if (e.key === "Enter") add();
				}
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: "dshn-btn dshn-btn-primary",
				disabled: busy || input.trim().length === 0,
				onClick: () => void add(),
				children: t("watchAddBtn")
			})]
		}),
		/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dshn-watch-status",
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("watchListCount", { n: items.length }) }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "·" }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [t("autoRefreshHint", { n: refreshMinutes }), lastRefresh > 0 ? ` · ${t("refreshedAt")} ${fmtRel(lastRefresh)}` : ""] }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: { marginLeft: "auto" },
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dshn-btn dshn-btn-small",
						disabled: busy || items.length === 0,
						onClick: () => void refreshAll(),
						children: busy ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dshn-spin" }), t("loading")] }) : t("refreshNow")
					})
				})
			]
		}),
		error ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: "dshn-err",
			children: error
		}) : null,
		poller.lastError() ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: "dshn-err",
			children: poller.lastError()
		}) : null,
		items.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: "dshn-empty",
			children: t("watchEmpty")
		}) : items.map((w) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dshn-watch-item",
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dshn-watch-main",
					onClick: () => onOpenDetail(w.name),
					title: t("watchViewDetail"),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-watch-name",
						children: [
							w.name,
							w.lastVersion ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dshn-watch-ver",
								children: w.lastVersion
							}) : null,
							w.hasNewVersion ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dshn-chip dshn-chip-new",
								children: t("newVersionBadge")
							}) : null,
							w.error ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dshn-chip",
								title: w.error,
								children: t("watchErrBadge")
							}) : null
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-watch-dl",
						children: [dlText(w), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
							t("refreshedAt"),
							" ",
							fmtRel(w.lastCheckAt)
						] })]
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MiniTrend, { daily: w.daily }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dshn-watch-ops",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dshn-btn-icon",
						title: t("watchRemove"),
						onClick: () => void remove(w.name),
						children: "✕"
					})
				})
			]
		}, w.name))
	] });
}
//#endregion
//#region src/client/components/HistoryTab.tsx
/**
* dsh-listen-npm —— 历史 tab：监控包的快照时间线。
*
* 快照在「加入监控（init）」与「版本变更（version-change）」时由宿主记录，
* 展示为时间倒序表格：记录时间 / latest 版本 / 昨日下载 / 近 7 天下载 / 类型。
*/
function HistoryTab({ run, names }) {
	const [pkg, setPkg] = (0, react.useState)("");
	const [snaps, setSnaps] = (0, react.useState)(null);
	const [error, setError] = (0, react.useState)("");
	const [loading, setLoading] = (0, react.useState)(false);
	(0, react.useEffect)(() => {
		if (pkg.length === 0 && names.length > 0) setPkg(names[0]);
	}, [names, pkg]);
	(0, react.useEffect)(() => {
		if (pkg.length === 0) {
			setSnaps(null);
			return;
		}
		let alive = true;
		setLoading(true);
		setError("");
		(async () => {
			try {
				const r = await run("", {
					op: "history",
					pkg
				});
				if (!alive) return;
				if (r && r.ok && Array.isArray(r.snapshots)) setSnaps(r.snapshots);
				else setError(tErr(r));
			} catch (e) {
				if (alive) setError(e instanceof Error ? e.message : String(e));
			} finally {
				if (alive) setLoading(false);
			}
		})();
		return () => {
			alive = false;
		};
	}, [pkg, run]);
	if (names.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		className: "dshn-empty",
		children: t("watchEmpty")
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dshn-history-bar",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				style: { fontSize: 13 },
				children: t("historyPick")
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
				className: "dshn-select",
				value: pkg,
				onChange: (e) => setPkg(e.target.value),
				children: names.map((n) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
					value: n,
					children: n
				}, n))
			})]
		}),
		error ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: "dshn-err",
			children: error
		}) : null,
		loading ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dshn-empty",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dshn-spin" }), t("loading")]
		}) : null,
		!loading && snaps !== null && snaps.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: "dshn-empty",
			children: t("historyEmpty")
		}) : null,
		!loading && snaps !== null && snaps.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("table", {
			className: "dshn-table",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("historyColTime") }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("historyColVersion") }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("historyColDay") }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("historyColWeek") }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("historyColNote") })
			] }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", { children: snaps.map((s, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: fmtDateTime(new Date(s.at).toISOString()) }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: s.latest }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: fmtCompact(s.day) }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: fmtCompact(s.week) }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dshn-note-chip " + (s.note === "version-change" ? "dshn-note-version" : "dshn-note-init"),
					children: s.note === "version-change" ? t("historyNoteVersion") : t("historyNoteInit")
				}) })
			] }, s.at + "-" + i)) })]
		}) : null
	] });
}
//#endregion
//#region src/client/components/NpmModal.tsx
/**
* dsh-listen-npm —— 统一「npm 包监控」弹框：查询 / 监控 / 历史 三个 tab。
*
* 由 shell.overlay 槽位渲染（打开状态来自共享 ModalStore）；footer 入口与
* 监控徽标数据来自共享的后台轮询器（弹框关闭后仍在刷新）。
*/
function NpmModal({ run, useOpen, close, poller, useSummary, useRefreshMinutes }) {
	const open = useOpen();
	const [tab, setTab] = (0, react.useState)("query");
	const [detailPkg, setDetailPkg] = (0, react.useState)("");
	const summary = useSummary();
	const refreshMinutes = useRefreshMinutes();
	const [watchNames, setWatchNames] = (0, react.useState)([]);
	(0, react.useEffect)(() => {
		const update = () => setWatchNames(poller.getWatch().map((w) => w.name));
		update();
		return poller.subscribe(update);
	}, [poller]);
	(0, react.useEffect)(() => {
		if (open && tab === "watch") poller.markSeen();
	}, [
		open,
		tab,
		poller
	]);
	if (!open) return null;
	const watchedSet = new Set(watchNames);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(ModalPortal, {
		onBackdropClose: close,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dshn-modal-head",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
						src: NPM_LOGO,
						alt: "",
						className: "dshn-modal-logo"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dshn-modal-title",
						children: t("modalTitle")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dshn-modal-sub",
						children: t("modalSubtitle")
					})] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-modal-head-ops",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dshn-btn-icon",
							title: t("refreshNow"),
							onClick: () => void poller.refresh(),
							children: "⟳"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dshn-btn-icon",
							title: t("close"),
							onClick: close,
							children: "✕"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dshn-tabs",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dshn-tab" + (tab === "query" ? " dshn-tab-active" : ""),
						onClick: () => setTab("query"),
						children: t("tabQuery")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "dshn-tab" + (tab === "watch" ? " dshn-tab-active" : ""),
						onClick: () => setTab("watch"),
						children: [t("tabWatch"), summary.watching > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-capsule dshn-capsule-watch",
							style: { marginLeft: 6 },
							children: summary.watching
						}) : null]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dshn-tab" + (tab === "history" ? " dshn-tab-active" : ""),
						onClick: () => setTab("history"),
						children: t("tabHistory")
					})
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dshn-modal-body",
				children: [
					tab === "query" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(QueryTab, {
						run,
						initialPkg: detailPkg,
						watchedNames: watchedSet,
						onWatchChanged: () => poller.invalidate()
					}) : null,
					tab === "watch" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WatchTab, {
						run,
						poller,
						refreshMinutes,
						onOpenDetail: (pkg) => {
							setDetailPkg(pkg);
							setTab("query");
						}
					}) : null,
					tab === "history" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HistoryTab, {
						run,
						names: watchNames
					}) : null
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dshn-modal-foot",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("dataHint") })
			})
		]
	});
}
//#endregion
//#region src/client/plugin.tsx
/** 侧边栏 footer 插槽 key 与本插件入口 id。 */
const FOOTER_SLOT = "sidebar.footer.action";
const FOOTER_ENTRY_ID = "dsh-listen-npm";
const OVERLAY_ID = "dsh-listen-npm";
function createPlugin() {
	return {
		name: "dsh-listen-npm",
		inject: [
			"slots",
			"remote",
			"remote.commands",
			"timer"
		],
		apply(ctx) {
			const toLang = (active) => /^zh/i.test(active) ? "zh" : "en";
			const locale = ctx.get("locale");
			if (locale !== void 0) {
				const syncLang = () => {
					setLang(toLang(locale.getSnapshot().active));
				};
				syncLang();
				locale.subscribe(syncLang);
			} else if (typeof ctx.on === "function") ctx.on("locale/change", (snapshot) => {
				const active = snapshot?.active;
				if (typeof active === "string") setLang(toLang(active));
			});
			const run = makeRun(ctx);
			const slots = ctx.get("slots");
			if (slots === void 0) return;
			injectStyles();
			const { useOpen, open: openModal, close: closeModal } = makeModalStore();
			const summaryStore = makeSummaryStore();
			const refreshMinutesStore = makeNumberStore(10);
			const sessionRef = { current: "" };
			const getSession = () => sessionRef.current;
			const runWithSession = (sessionId, op) => run(sessionId || getSession(), op);
			const poller = createPoller(runWithSession, summaryStore);
			ctx.interval(() => poller.tick(), 3e3);
			poller.bootstrap();
			runWithSession("", { op: "config" }).then((cfg) => {
				if (cfg && cfg.ok && typeof cfg.refreshMinutes === "number" && cfg.refreshMinutes > 0) refreshMinutesStore.set(cfg.refreshMinutes);
			}).catch(() => {});
			try {
				slots.inject("conversation.chat.commandview", () => slots.register({
					name: "conversation.chat.commandview",
					key: "dsh-listen-npm",
					priority: 0
				}, () => null));
			} catch {}
			slots.inject(FOOTER_SLOT, () => slots.register({
				name: FOOTER_SLOT,
				id: FOOTER_ENTRY_ID,
				order: 21
			}, (props) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FooterButton, {
				onOpen: openModal,
				reportSession: (s) => {
					if (s) sessionRef.current = s;
				},
				wide: props.wide,
				useSessions: props.useSessions,
				poller
			})));
			slots.inject("shell.overlay", () => slots.register({
				name: "shell.overlay",
				id: OVERLAY_ID,
				order: 100
			}, () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(NpmModal, {
				run: runWithSession,
				useOpen,
				close: closeModal,
				poller,
				useSummary: summaryStore.useSummary,
				useRefreshMinutes: refreshMinutesStore.use
			})));
		}
	};
}
//#endregion
//#region src/client/index.ts
/**
* dsh-listen-npm —— 浏览器半边入口（tsdown 打包，对齐 dsh-jenkins）。
*
* 本文件为纯 ESM 模块，直接导出插件形状 { name, inject, apply }；
* window.__ModuleLoader__.load 工厂包装由 tsdown 的 banner/intro/footer
* 在构建时生成（见 tsdown.config.ts）。外部依赖（react /
* react/jsx-runtime / react-dom）构建时保持 external，运行时经 factory
* 的 require 解析宿主模块表（seed）。
*/
const plugin = createPlugin();
const name = plugin.name;
const inject = plugin.inject;
const apply = plugin.apply;
//#endregion
exports.apply = apply;
exports.inject = inject;
exports.name = name;

return module.exports; } });
//# sourceMappingURL=client.js.map