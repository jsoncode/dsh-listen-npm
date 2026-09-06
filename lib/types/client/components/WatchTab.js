import { jsxs as _jsxs, Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
/**
 * dsh-listen-npm —�?监控 tab：监控列表的增删与状态总览�? *
 * - 顶部：添加输入框 + 立即刷新 + 自动刷新间隔说明�? * - 列表项：包名（点击进查询 tab 看详情）、latest 版本、昨�?�?天下载量
 *   （与上个快照对比的趋势箭头）、新版本未读徽标、刷新失败原因、移除按钮；
 * - 打开 tab 时自动清除新版本未读标记（watchSeen op，footer 橙色胶囊随之消失）�? */
import { useEffect, useState } from 'react';
import { t, tErr } from "../i18n.js";
import { fmtCompact } from "../format.js";
export function WatchTab({ run, poller, onOpenDetail, refreshMinutes }) {
    const [items, setItems] = useState(() => poller.getWatch());
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [lastRefresh, setLastRefresh] = useState(0);
    useEffect(() => {
        const update = () => { setItems(poller.getWatch().slice()); setLastRefresh(poller.lastRefreshAt()); };
        update();
        return poller.subscribe(update);
    }, [poller]);
    // 打开 tab 即清除「有新版本」未读标记�?  useEffect(() => {
    poller.markSeen();
}
[poller];
const add = async () => {
    const pkg = input.trim();
    if (pkg.length === 0 || busy)
        return;
    setBusy(true);
    setError('');
    try {
        const r = await run('', { op: 'watchAdd', pkg });
        if (r && r.ok) {
            setInput('');
            poller.invalidate();
        }
        else {
            setError(tErr(r));
        }
    }
    finally {
        setBusy(false);
    }
};
const remove = async (name) => {
    if (busy)
        return;
    if (!window.confirm(t('watchRemoveConfirm')))
        return;
    setBusy(true);
    setError('');
    try {
        const r = await run('', { op: 'watchRemove', pkg: name });
        if (r && r.ok)
            poller.invalidate();
        else
            setError(tErr(r));
    }
    finally {
        setBusy(false);
    }
};
const refreshAll = async () => {
    if (busy)
        return;
    setBusy(true);
    try {
        await poller.refresh();
        setLastRefresh(poller.lastRefreshAt());
    }
    finally {
        setBusy(false);
    }
};
const dlText = (w) => {
    const dayDelta = w.prevDay !== undefined && w.lastDay !== undefined && w.prevDay > 0
        ? ((w.lastDay - w.prevDay) / w.prevDay) * 100
        : null;
    return (_jsxs(_Fragment, { children: [_jsxs("span", { children: [t('dlDay'), " ", fmtCompact(w.lastDay), dayDelta !== null && Math.abs(dayDelta) >= 0.5 ? _jsxs("span", { className: dayDelta >= 0 ? 'dshn-delta-up' : 'dshn-delta-down', children: [" (", dayDelta >= 0 ? '+' : '', dayDelta.toFixed(1), "%)"] }) : null] }), _jsxs("span", { children: [t('dlWeek'), " ", fmtCompact(w.lastWeek)] })] }));
};
return (_jsxs("div", { children: [_jsxs("div", { className: "dshn-watch-bar", children: [_jsx("input", { className: "dshn-input", value: input, placeholder: t('watchPlaceholder'), spellCheck: false, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter')
                        void add(); } }), _jsx("button", { type: "button", className: "dshn-btn dshn-btn-primary", disabled: busy || input.trim().length === 0, onClick: () => void add(), children: t('watchAddBtn') })] }), _jsxs("div", { className: "dshn-watch-status", children: [_jsx("span", { children: t('watchListCount', { n: items.length }) }), _jsx("span", { children: "\u00B7" }), _jsxs("span", { children: [t('autoRefreshHint', { n: refreshMinutes }), lastRefresh > 0 ? ` · ${t('refreshedAt')} ${fmtRel(lastRefresh)}` : ''] }), _jsx("span", { style: { marginLeft: 'auto' }, children: _jsx("button", { type: "button", className: "dshn-btn dshn-btn-small", disabled: busy || items.length === 0, onClick: () => void refreshAll(), children: busy ? _jsxs("span", { children: [_jsx("span", { className: "dshn-spin" }), t('loading')] }) : t('refreshNow') }) })] }), error ? _jsx("div", { className: "dshn-err", children: error }) : null, poller.lastError() ? _jsx("div", { className: "dshn-err", children: poller.lastError() }) : null, items.length === 0 ? (_jsx("div", { className: "dshn-empty", children: t('watchEmpty') })) : (items.map((w) => (_jsxs("div", { className: "dshn-watch-item", children: [_jsxs("div", { className: "dshn-watch-main", onClick: () => onOpenDetail(w.name), title: t('watchViewDetail'), children: [_jsxs("div", { className: "dshn-watch-name", children: [w.name, w.lastVersion ? _jsx("span", { className: "dshn-watch-ver", children: w.lastVersion }) : null, w.hasNewVersion ? _jsx("span", { className: "dshn-chip dshn-chip-new", children: t('newVersionBadge') }) : null, w.error ? _jsx("span", { className: "dshn-chip", title: w.error, children: t('watchErrBadge') }) : null] }), _jsxs("div", { className: "dshn-watch-dl", children: [dlText(w), _jsxs("span", { children: [t('refreshedAt'), " ", fmtRel(w.lastCheckAt)] })] })] }), _jsx("div", { className: "dshn-watch-ops", children: _jsx("button", { type: "button", className: "dshn-btn-icon", title: t('watchRemove'), onClick: () => void remove(w.name), children: "\uFFFD?              " }) })] }, w.name))))] }));
