import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * dsh-listen-npm —�?统一「npm 包监控」弹框：查询 / 监控 / 历史 三个 tab�? *
 * �?shell.overlay 槽位渲染（打开状态来自共�?ModalStore）；footer 入口�? * 监控徽标数据来自共享的后台轮询器（弹框关闭后仍在刷新）�? */
import { useState } from 'react';
export function NpmModal({ run, useOpen, close, poller, useSummary, useRefreshMinutes }) {
    const open = useOpen();
    const [tab, setTab] = useState('query');
    const [detailPkg, setDetailPkg] = useState('');
    const summary = useSummary();
    const refreshMinutes = useRefreshMinutes();
    const [watchNames, setWatchNames] = useState([]);
    // 监控缓存变化时同步名称列表（监控/历史 tab 用）�?  useEffect(() => {
    const update = () => setWatchNames(poller.getWatch().map((w) => w.name));
    update();
    return poller.subscribe(update);
}
[poller];
// 打开监控 tab 时清一次新版本未读（footer 橙色胶囊消失）�?  useEffect(() => {
if (open && tab === 'watch')
    poller.markSeen();
[open, tab, poller];
if (!open)
    return null;
const watchedSet = new Set(watchNames);
return (_jsx(ModalPortal, { onBackdropClose: close, children: _jsxs("div", { className: "dshn-modal-head", children: [_jsx("img", { src: NPM_LOGO, alt: "", className: "dshn-modal-logo" }), _jsxs("div", { children: [_jsx("div", { className: "dshn-modal-title", children: t('modalTitle') }), _jsx("div", { className: "dshn-modal-sub", children: t('modalSubtitle') })] }), _jsx("div", { className: "dshn-modal-head-ops", children: _jsxs("button", { type: "button", className: "dshn-btn-icon", title: t('refreshNow'), onClick: () => void poller.refresh(), children: ["\uFFFD?/button>", _jsx("button", { type: "button", className: "dshn-btn-icon", title: t('close'), onClick: close, children: "\uFFFD?/button>" })] }) }), _jsxs("div", { className: "dshn-tabs", children: [_jsx("button", { type: "button", className: 'dshn-tab' + (tab === 'query' ? ' dshn-tab-active' : ''), onClick: () => setTab('query'), children: t('tabQuery') }), _jsxs("button", { type: "button", className: 'dshn-tab' + (tab === 'watch' ? ' dshn-tab-active' : ''), onClick: () => setTab('watch'), children: [t('tabWatch'), summary.watching > 0 ? _jsx("span", { className: "dshn-capsule dshn-capsule-watch", style: { marginLeft: 6 }, children: summary.watching }) : null] }), _jsx("button", { type: "button", className: 'dshn-tab' + (tab === 'history' ? ' dshn-tab-active' : ''), onClick: () => setTab('history'), children: t('tabHistory') })] }), _jsxs("div", { className: "dshn-modal-body", children: [tab === 'query' ? (_jsx(QueryTab, { run: run, initialPkg: detailPkg, watchedNames: watchedSet, onWatchChanged: () => poller.invalidate() })) : null, tab === 'watch' ? (_jsx(WatchTab, { run: run, poller: poller, refreshMinutes: refreshMinutes, onOpenDetail: (pkg) => { setDetailPkg(pkg); setTab('query'); } })) : null, tab === 'history' ? (_jsx(HistoryTab, { run: run, names: watchNames })) : null] }), _jsx("div", { className: "dshn-modal-foot", children: _jsx("span", { children: t('dataHint') }) })] }) }));
