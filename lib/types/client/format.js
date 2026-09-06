/**
 * dsh-listen-npm —— 展示格式化工具（数字紧凑化 / 日期 / 相对时间 / 趋势）。
 */
/** 大数紧凑化：1.2B / 15.6M / 234.5k / 987。 */
export const fmtCompact = (n) => {
    if (typeof n !== 'number' || !Number.isFinite(n))
        return '—';
    const abs = Math.abs(n);
    if (abs >= 1e9)
        return (n / 1e9).toFixed(abs >= 1e10 ? 0 : 1) + 'B';
    if (abs >= 1e6)
        return (n / 1e6).toFixed(abs >= 1e7 ? 0 : 1) + 'M';
    if (abs >= 1e3)
        return (n / 1e3).toFixed(abs >= 1e4 ? 0 : 1) + 'k';
    return String(n);
};
/** 千分位整数。 */
export const fmtInt = (n) => typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('en-US') : '—';
/** ISO 时间 → 本地 "YYYY-MM-DD HH:mm"（仅日期字段容错）。 */
export const fmtDateTime = (iso) => {
    if (!iso)
        return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return iso.slice(0, 19).replace('T', ' ');
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
/** ISO 时间 → 本地日期 "YYYY-MM-DD"。 */
export const fmtDate = (iso) => {
    if (!iso)
        return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return iso.slice(0, 10);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
/** epoch ms → 相对时间（分钟/小时/天前）。 */
export const fmtRel = (ms) => {
    if (typeof ms !== 'number' || !Number.isFinite(ms))
        return '—';
    const diff = Date.now() - ms;
    if (diff < 60 * 1000)
        return '<1m';
    if (diff < 60 * 60 * 1000)
        return Math.floor(diff / 60000) + 'm';
    if (diff < 24 * 60 * 60 * 1000)
        return Math.floor(diff / 3600000) + 'h';
    return Math.floor(diff / 86400000) + 'd';
};
/** 字节数 → 可读（1.2 MB / 340 kB）。 */
export const fmtBytes = (n) => {
    if (typeof n !== 'number' || !Number.isFinite(n))
        return '—';
    if (n >= 1e6)
        return (n / 1e6).toFixed(1) + ' MB';
    if (n >= 1e3)
        return (n / 1e3).toFixed(1) + ' kB';
    return n + ' B';
};
export const deltaOf = (current, prev) => {
    if (typeof current !== 'number' || typeof prev !== 'number' || prev <= 0 || current === prev)
        return null;
    const pct = ((current - prev) / prev) * 100;
    const sign = pct >= 0 ? '+' : '';
    return {
        cls: pct >= 0 ? 'dshn-delta-up' : 'dshn-delta-down',
        text: sign + (pct >= 0 ? '' : '') + (Math.abs(pct) >= 100 ? Math.round(pct) : Math.abs(pct).toFixed(1)) + '%',
    };
};
