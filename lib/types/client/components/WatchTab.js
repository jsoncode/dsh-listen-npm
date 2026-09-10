import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * dsh-listen-npm —— 监控 tab：监控列表的增删与状态总览。
 *
 * - 顶部：「在菜单中显示」开关（与宿主「设置 → npm 监控」分区页同一偏好源，
 *   控制侧栏 footerAction 入口按钮的显隐）+ 添加输入框 + 立即刷新 + 自动刷新
 *   间隔说明；
 * - 列表项：包名（点击进查询 tab 看详情）、latest 版本（就是普通版本号，不做任何
 *   「有新版本」标记/高亮）、最新单日/近 7 天下载量（与上个快照对比的趋势箭头）、
 *   右侧近 7 天日安装量迷你柱状图（数据随刷新响应返回，无额外请求；尾部 npm
 *   尚未统计的日期按 0 补齐并以灰色显示，保持日期连续）、刷新失败原因、移除按钮；
 * - 打开 tab 时静默清除新版本未读标记（入口已不展示任何更新提示；版本变化只在
 *   「历史」tab 的快照时间线里体现）。
 */
import { useEffect, useState } from 'react';
import { t, tErr } from "../i18n.js";
import { fmtCompact, fmtInt, fmtRel, seriesOf } from "../format.js";
import { ShowInMenuToggle } from "./ShowInMenuToggle.js";
/** 迷你日安装量柱状图（近 7 天，随刷新更新；尾部未统计日灰色、每根柱带原生 tooltip）。 */
function MiniTrend({ daily }) {
    const series = seriesOf(daily);
    const data = series.all;
    if (data.length === 0)
        return null;
    // 尺度只看真实数据段（pending 是延迟补的 0）。
    const max = Math.max(...series.real.map((p) => p.downloads), 1);
    const lastRealDay = series.dataEnd;
    const title = series.lagDays > 0
        ? t('watchTrendLag', { end: lastRealDay || '—', n: series.lagDays })
        : t('watchTrend');
    return (_jsx("div", { className: "dshn-trend", title: title, "aria-label": title, children: data.map((p) => (_jsx("span", { className: 'dshn-trend-bar'
                + (p.pending === true ? ' dshn-trend-bar-pending' : '')
                + (p.pending !== true && p.day === lastRealDay ? ' dshn-trend-bar-last' : ''), style: { height: p.pending === true ? '4%' : Math.max(10, Math.round((p.downloads / max) * 100)) + '%' }, title: `${p.day} · ${p.pending === true ? t('noDataYet') : fmtInt(p.downloads)}` }, p.day))) }));
}
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
    // 打开 tab 即静默清除「有新版本」未读标记（入口不再展示任何更新提示）。
    useEffect(() => {
        poller.markSeen();
    }, [poller]);
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
        const series = seriesOf(w.daily);
        const dayDelta = w.prevDay !== undefined && w.lastDay !== undefined && w.prevDay > 0
            ? ((w.lastDay - w.prevDay) / w.prevDay) * 100
            : null;
        // 数据有延迟时不能写「昨日」：标签改成「最新单日」并补上真实日期。
        const lagged = series.lagDays > 0 && series.dataEnd.length > 0;
        const dayLabel = lagged ? `${t('dlLatest')} ${series.dataEnd}` : t('dlDay');
        return (_jsxs(_Fragment, { children: [_jsxs("span", { children: [dayLabel, " ", fmtCompact(w.lastDay), dayDelta !== null && Math.abs(dayDelta) >= 0.5 ? _jsxs("span", { className: dayDelta >= 0 ? 'dshn-delta-up' : 'dshn-delta-down', children: [" (", dayDelta >= 0 ? '+' : '', dayDelta.toFixed(1), "%)"] }) : null] }), _jsxs("span", { children: [t('dlWeek'), " ", fmtCompact(w.lastWeek)] }), lagged ? _jsx("span", { className: "dshn-hint", children: t('lagShort', { n: series.lagDays }) }) : null] }));
    };
    return (_jsxs("div", { children: [_jsx(ShowInMenuToggle, {}), _jsxs("div", { className: "dshn-watch-bar", children: [_jsx("input", { className: "dshn-input", value: input, placeholder: t('watchPlaceholder'), spellCheck: false, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter')
                            void add(); } }), _jsx("button", { type: "button", className: "dshn-btn dshn-btn-primary", disabled: busy || input.trim().length === 0, onClick: () => void add(), children: t('watchAddBtn') })] }), _jsxs("div", { className: "dshn-watch-status", children: [_jsx("span", { children: t('watchListCount', { n: items.length }) }), _jsx("span", { children: "\u00B7" }), _jsxs("span", { children: [t('autoRefreshHint', { n: refreshMinutes }), lastRefresh > 0 ? ` · ${t('refreshedAt')} ${fmtRel(lastRefresh)}` : ''] }), _jsx("span", { style: { marginLeft: 'auto' }, children: _jsx("button", { type: "button", className: "dshn-btn dshn-btn-small", disabled: busy || items.length === 0, onClick: () => void refreshAll(), children: busy ? _jsxs("span", { children: [_jsx("span", { className: "dshn-spin" }), t('loading')] }) : t('refreshNow') }) })] }), error ? _jsx("div", { className: "dshn-err", children: error }) : null, poller.lastError() ? _jsx("div", { className: "dshn-err", children: poller.lastError() }) : null, items.length === 0 ? (_jsx("div", { className: "dshn-empty", children: t('watchEmpty') })) : (items.map((w) => (_jsxs("div", { className: "dshn-watch-item", children: [_jsxs("div", { className: "dshn-watch-main", onClick: () => onOpenDetail(w.name), title: t('watchViewDetail'), children: [_jsxs("div", { className: "dshn-watch-name", children: [w.name, w.lastVersion ? _jsx("span", { className: "dshn-watch-ver", children: w.lastVersion }) : null, w.error ? _jsx("span", { className: "dshn-chip", title: w.error, children: t('watchErrBadge') }) : null] }), _jsxs("div", { className: "dshn-watch-dl", children: [dlText(w), _jsxs("span", { children: [t('refreshedAt'), " ", fmtRel(w.lastCheckAt)] })] })] }), _jsx(MiniTrend, { daily: w.daily }), _jsx("div", { className: "dshn-watch-ops", children: _jsx("button", { type: "button", className: "dshn-btn-icon", title: t('watchRemove'), onClick: () => void remove(w.name), children: "\u2715" }) })] }, w.name))))] }));
}
