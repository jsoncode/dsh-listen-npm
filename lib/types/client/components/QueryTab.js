import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * dsh-listen-npm —�?查询 tab：包名输�?+ 联想搜索 + 详情展示�? *
 * - 输入 �? 字符时防�?300ms �?search op 弹出联想列表（名�?描述/周下载量）；
 * - 回车或点击「查询」直接拉�?info op 展示完整详情�? * - 详情头部可一键加入监控（watchAdd op）�? */
import { useCallback, useRef, useState } from 'react';
import { t, tErr } from "../i18n.js";
export function QueryTab({ run, initialPkg, watchedNames, onWatchChanged }) {
    const [input, setInput] = useState(initialPkg || '');
    const [querying, setQuerying] = useState(false);
    const [error, setError] = useState('');
    const [res, setRes] = useState(null);
    const [watchBusy, setWatchBusy] = useState(false);
    const [watchNotice, setWatchNotice] = useState('');
    const [suggests, setSuggests] = useState(null);
    const [suggesting, setSuggesting] = useState(false);
    const suggestSeq = useRef(0);
    const querySeq = useRef(0);
    const query = useCallback(async (pkgRaw) => {
        const pkg = pkgRaw.trim();
        if (pkg.length === 0)
            return;
        const seq = ++querySeq.current;
        setQuerying(true);
        setError('');
        setRes(null);
        setWatchNotice('');
        setSuggests(null);
        try {
            const r = await run('', { op: 'info', pkg });
            if (seq !== querySeq.current)
                return;
            setRes(r);
            if (!(r && r.ok))
                setError(tErr(r));
        }
        finally {
            if (seq === querySeq.current)
                setQuerying(false);
        }
    }, [run]);
    // 外部传入 initialPkg（监�?历史跳转）时自动查询一次�?  useEffect(() => {
    if (initialPkg && initialPkg.trim().length > 0)
        void query(initialPkg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
}
[initialPkg];
// 联想搜索：输�?�? 字符防抖 300ms�?  useEffect(() => {
const q = input.trim();
if (q.length < 2 || q === initialPkg) {
    setSuggests(null);
    return;
}
const seq = ++suggestSeq.current;
setSuggesting(true);
const timer = setTimeout(async () => {
    try {
        const r = await run('', { op: 'search', text: q, size: 8 });
        if (seq !== suggestSeq.current)
            return;
        if (r && r.ok && Array.isArray(r.results))
            setSuggests(r.results);
        else
            setSuggests([]);
    }
    catch {
        if (seq === suggestSeq.current)
            setSuggests([]);
    }
    finally {
        if (seq === suggestSeq.current)
            setSuggesting(false);
    }
}, 300);
return () => clearTimeout(timer);
[input, run, initialPkg];
const doWatch = async () => {
    if (!res?.info)
        return;
    setWatchBusy(true);
    setWatchNotice('');
    try {
        const r = await run('', { op: 'watchAdd', pkg: res.info.name });
        if (r && r.ok) {
            setWatchNotice(t('watchAdded'));
            onWatchChanged();
        }
        else {
            setWatchNotice('!' + t('watchAddFailed') + ': ' + tErr(r));
        }
    }
    finally {
        setWatchBusy(false);
    }
};
const watchedSet = watchedNames;
return (_jsxs("div", { children: [_jsxs("div", { className: "dshn-query-wrap", children: [_jsxs("div", { className: "dshn-query-bar", children: [_jsx("input", { className: "dshn-input", value: input, placeholder: t('queryPlaceholder'), spellCheck: false, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter')
                                void query(input); } }), _jsx("button", { type: "button", className: "dshn-btn dshn-btn-primary", disabled: querying || input.trim().length === 0, onClick: () => void query(input), children: querying ? _jsxs("span", { children: [_jsx("span", { className: "dshn-spin" }), t('loading')] }) : t('queryBtn') })] }), suggests !== null && suggests.length > 0 ? (_jsx("div", { className: "dshn-search-pop", children: suggests.map((s) => (_jsxs("button", { type: "button", className: "dshn-search-item", onClick: () => { setInput(s.name); void query(s.name); }, children: [_jsxs("div", { className: "dshn-search-item-name", children: [s.name, s.version ? _jsx("span", { className: "dshn-link", children: s.version }) : null, typeof s.weekly === 'number' ? _jsxs("span", { style: { marginLeft: 'auto', fontSize: 11 }, children: [fmtCompact(s.weekly), "/w"] }) : null] }), s.description ? _jsx("div", { className: "dshn-search-item-desc", children: s.description }) : null, s.publisher || s.date ? _jsxs("div", { className: "dshn-search-item-meta", children: [s.publisher || '', s.date ? ' · ' + s.date.slice(0, 10) : ''] }) : null] }, s.name))) })) : suggesting && input.trim().length >= 2 ? (_jsx("div", { className: "dshn-search-pop", children: _jsxs("div", { className: "dshn-empty", style: { padding: '10px 12px' }, children: [_jsx("span", { className: "dshn-spin" }), t('searching')] }) })) : null] }), error ? _jsx("div", { className: "dshn-err", children: error }) : null, !res && !querying && !error ? _jsx("div", { className: "dshn-empty", children: t('searchPickHint') }) : null, res && res.ok && res.info ? (_jsx(PackageDetail, { res: res, watched: watchedSet.has(res.info.name), onWatch: () => void doWatch(), watchBusy: watchBusy, notice: watchNotice })) : null] }));
