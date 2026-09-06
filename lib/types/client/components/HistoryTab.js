import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * dsh-listen-npm —— 历史 tab：监控包的快照时间线。
 *
 * 快照在「加入监控（init）」与「版本变更（version-change）」时由宿主记录，
 * 展示为时间倒序表格：记录时间 / latest 版本 / 昨日下载 / 近 7 天下载 / 类型。
 */
import { useEffect, useState } from 'react';
import { t, tErr } from "../i18n.js";
import { fmtCompact, fmtDateTime } from "../format.js";
export function HistoryTab({ run, names }) {
    const [pkg, setPkg] = useState('');
    const [snaps, setSnaps] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        // 默认选中第一个包（包列表变化时保持当前选择）。
        if (pkg.length === 0 && names.length > 0)
            setPkg(names[0]);
    }, [names, pkg]);
    useEffect(() => {
        if (pkg.length === 0) {
            setSnaps(null);
            return;
        }
        let alive = true;
        setLoading(true);
        setError('');
        void (async () => {
            try {
                const r = await run('', { op: 'history', pkg });
                if (!alive)
                    return;
                if (r && r.ok && Array.isArray(r.snapshots))
                    setSnaps(r.snapshots);
                else
                    setError(tErr(r));
            }
            catch (e) {
                if (alive)
                    setError(e instanceof Error ? e.message : String(e));
            }
            finally {
                if (alive)
                    setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [pkg, run]);
    if (names.length === 0) {
        return _jsx("div", { className: "dshn-empty", children: t('watchEmpty') });
    }
    return (_jsxs("div", { children: [_jsxs("div", { className: "dshn-history-bar", children: [_jsx("span", { style: { fontSize: 13 }, children: t('historyPick') }), _jsx("select", { className: "dshn-select", value: pkg, onChange: (e) => setPkg(e.target.value), children: names.map((n) => (_jsx("option", { value: n, children: n }, n))) })] }), error ? _jsx("div", { className: "dshn-err", children: error }) : null, loading ? _jsxs("div", { className: "dshn-empty", children: [_jsx("span", { className: "dshn-spin" }), t('loading')] }) : null, !loading && snaps !== null && snaps.length === 0 ? _jsx("div", { className: "dshn-empty", children: t('historyEmpty') }) : null, !loading && snaps !== null && snaps.length > 0 ? (_jsxs("table", { className: "dshn-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: t('historyColTime') }), _jsx("th", { children: t('historyColVersion') }), _jsx("th", { children: t('historyColDay') }), _jsx("th", { children: t('historyColWeek') }), _jsx("th", { children: t('historyColNote') })] }) }), _jsx("tbody", { children: snaps.map((s, i) => (_jsxs("tr", { children: [_jsx("td", { children: fmtDateTime(new Date(s.at).toISOString()) }), _jsx("td", { children: s.latest }), _jsx("td", { children: fmtCompact(s.day) }), _jsx("td", { children: fmtCompact(s.week) }), _jsx("td", { children: _jsx("span", { className: 'dshn-note-chip ' + (s.note === 'version-change' ? 'dshn-note-version' : 'dshn-note-init'), children: s.note === 'version-change' ? t('historyNoteVersion') : t('historyNoteInit') }) })] }, s.at + '-' + i))) })] })) : null] }));
}
