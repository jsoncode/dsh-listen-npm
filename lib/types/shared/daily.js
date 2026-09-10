/**
 * dsh-listen-npm —— 日粒度下载量序列的日历补齐（宿主 / 浏览器两边共用的纯函数）。
 *
 * 为什么需要补齐：npm downloads API 的 range 响应只覆盖「已经统计完」的自然日。
 * T+N 延迟下（实测：本地 09-10，数据只到 09-06），直接按响应画图会让柱子末端
 * 突然断掉、日期也停在几天前 —— 看起来像插件坏了。这里统一把序列补齐到
 * 「昨天」（npm 官方口径的最后一个完整统计日）：
 *
 * - 区间内部 API 漏给的日期 → 0（该区间 npm 已覆盖，缺即 0）；
 * - 最后一天之后的日期 → 0 且 `pending: true`（npm 尚未统计，仅为视觉连续）
 *   最多补 MAX_PENDING_DAYS 天，避免长时间断更把图表压扁；
 * - 聚合口径（最新单日 / 近 7 天 / 近 30 天）一律锚定最后一个「非 pending」日，
 *   否则延迟的 0 会把数字压低，反而更像 bug（见 realPoints / lastRealDay）。
 *
 * 纯函数：不读时钟（target 由调用方传入）、不依赖时区以外的东西，便于测试。
 */
const DAY_MS = 86_400_000;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
/** 尾部补 0 的上限（npm 长时间不更新时不至于把图表压扁）。 */
export const MAX_PENDING_DAYS = 14;
/** 'YYYY-MM-DD' 合法性（含真实日历校验，挡掉 2026-02-31）。 */
export function isValidDay(day) {
    if (typeof day !== 'string' || !DAY_RE.test(day))
        return false;
    const t = Date.parse(day + 'T00:00:00Z');
    return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === day;
}
/** Date → 本地时区的 'YYYY-MM-DD'。 */
export function localDay(date) {
    const p = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}
/** 'YYYY-MM-DD' ± n 天（UTC 基准做日期运算，规避夏令时/时区偏移）。 */
export function shiftDay(day, delta) {
    const t = Date.parse(day + 'T00:00:00Z');
    if (!Number.isFinite(t))
        return day;
    return new Date(t + delta * DAY_MS).toISOString().slice(0, 10);
}
/** to - from 的天数（纯日期字符串）。 */
export function daysBetween(from, to) {
    const a = Date.parse(from + 'T00:00:00Z');
    const b = Date.parse(to + 'T00:00:00Z');
    if (!Number.isFinite(a) || !Number.isFinite(b))
        return 0;
    return Math.round((b - a) / DAY_MS);
}
/** npm 统计口径里的最后一个完整自然日（本地时区）= 昨天。 */
export function latestExpectedDay(now = new Date()) {
    return shiftDay(localDay(now), -1);
}
const EMPTY_SERIES = () => ({ daily: [], dataStart: '', dataEnd: '', expectedEnd: '', lagDays: 0, pendingDays: 0 });
/**
 * range 响应 → 连续序列。
 *
 * @param raw       range 响应的 downloads 原始数组（脏数据自动丢弃）。
 * @param targetEnd 期望补齐到的最后一天（通常 latestExpectedDay()）；早于
 *                  dataEnd 或非法时不做尾部补齐。
 */
export function buildDailySeries(raw, targetEnd) {
    const clean = new Map();
    for (const item of raw ?? []) {
        if (item === null || typeof item !== 'object')
            continue;
        const day = item.day;
        if (!isValidDay(day))
            continue;
        const value = item.downloads;
        clean.set(day, typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0);
    }
    const days = [...clean.keys()].sort();
    if (days.length === 0)
        return EMPTY_SERIES();
    const dataStart = days[0];
    const dataEnd = days[days.length - 1];
    const lagDays = isValidDay(targetEnd) && targetEnd > dataEnd
        ? Math.min(daysBetween(dataEnd, targetEnd), MAX_PENDING_DAYS)
        : 0;
    const last = lagDays > 0 ? shiftDay(dataEnd, lagDays) : dataEnd;
    const daily = [];
    for (let day = dataStart; day <= last; day = shiftDay(day, 1)) {
        const value = clean.get(day);
        if (value !== undefined)
            daily.push({ day, downloads: value });
        else if (day > dataEnd)
            daily.push({ day, downloads: 0, pending: true });
        else
            daily.push({ day, downloads: 0 });
    }
    return { daily, dataStart, dataEnd, expectedEnd: last, lagDays, pendingDays: lagDays };
}
/* ── 选择器（聚合口径统一锚定真实数据段）────────────────────────── */
/** 真实（非 pending）数据点。 */
export function realPoints(daily) {
    return (daily ?? []).filter((p) => p.pending !== true);
}
/** 最后一个真实数据日（'' = 无数据）—— 「最新单日」的日期。 */
export function lastRealDay(daily) {
    const real = realPoints(daily);
    return real.length > 0 ? real[real.length - 1].day : '';
}
/** 尾部连续 pending 的天数（客户端展示「数据滞后 N 天」）。 */
export function pendingTail(daily) {
    const list = daily ?? [];
    let n = 0;
    for (let i = list.length - 1; i >= 0 && list[i].pending === true; i--)
        n++;
    return n;
}
/** 下载量求和（真实点）。 */
export function sumDownloads(points) {
    return (points ?? []).reduce((acc, p) => acc + (Number.isFinite(p.downloads) ? p.downloads : 0), 0);
}
/** 最后 n 个真实点（近 7 天 / 近 30 天窗口；不足则取全部）。 */
export function lastRealWindow(daily, n) {
    const real = realPoints(daily);
    return n > 0 ? real.slice(-n) : real;
}
