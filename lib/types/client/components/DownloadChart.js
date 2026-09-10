import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { fmtCompact, fmtInt, seriesOf } from "../format.js";
import { t } from "../i18n.js";
const W = 720;
const H = 240;
const PAD_L = 52;
const PAD_R = 10;
const PAD_T = 20;
const PAD_B = 24;
export function DownloadChart({ data }) {
    const series = seriesOf(data);
    if (series.all.length === 0) {
        return _jsx("div", { className: "dshn-empty", children: t('versionsEmpty') });
    }
    const all = series.all;
    // 真实数据段的下标：最后一根真实柱（绿色高亮）与峰值柱（描金 + 数值标注）。
    // pending 段只是延迟补的 0，不参与峰值 / 日均 / y 轴尺度。
    let realLastIdx = -1;
    let realPeakIdx = -1;
    let peakValue = 0;
    let realTotal = 0;
    let realCount = 0;
    for (let i = 0; i < all.length; i++) {
        const p = all[i];
        if (p.pending === true)
            continue;
        realLastIdx = i;
        realTotal += p.downloads;
        realCount++;
        if (p.downloads > peakValue) {
            peakValue = p.downloads;
            realPeakIdx = i;
        }
    }
    const max = Math.max(peakValue, 1);
    const avg = realCount > 0 ? realTotal / realCount : 0;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;
    const slot = plotW / all.length;
    const barW = Math.max(2, Math.min(18, slot * 0.72));
    const yOf = (v) => PAD_T + plotH - (v / max) * plotH;
    const xOf = (i) => PAD_L + slot * i + (slot - barW) / 2;
    // y 轴 3 条网格线（0 / ½max / max），标签紧凑化
    const gridVals = [max, max / 2, 0];
    // x 轴稀疏标注：首 / 中 / 尾
    const xTicks = all.length >= 3
        ? [0, Math.floor((all.length - 1) / 2), all.length - 1]
        : all.map((_, i) => i);
    // 真实段 / 待统计段的分界虚线（横坐标：最后一根真实柱右侧的空隙中点）
    const splitX = realLastIdx >= 0 ? PAD_L + slot * (realLastIdx + 1) : 0;
    return (_jsxs("svg", { className: "dshn-chart-svg", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": t('dailyChartTitle'), children: [gridVals.map((v, i) => {
                const y = yOf(v);
                return (_jsxs("g", { children: [_jsx("line", { className: "dshn-chart-grid", x1: PAD_L, y1: y, x2: W - PAD_R, y2: y }), _jsx("text", { className: "dshn-chart-text", x: PAD_L - 6, y: y + 3, textAnchor: "end", children: fmtCompact(v) })] }, i));
            }), avg > 0 && avg < max ? (_jsxs("g", { children: [_jsx("line", { className: "dshn-chart-avg", x1: PAD_L, y1: yOf(avg), x2: W - PAD_R, y2: yOf(avg) }), _jsxs("text", { className: "dshn-chart-text", x: W - PAD_R - 2, y: yOf(avg) - 4, textAnchor: "end", children: [t('dailyAvg'), " ", fmtCompact(avg)] })] })) : null, series.lagDays > 0 && realLastIdx >= 0 ? (_jsx("line", { className: "dshn-chart-split", x1: splitX, y1: PAD_T, x2: splitX, y2: PAD_T + plotH })) : null, all.map((p, i) => {
                const pending = p.pending === true;
                const h = pending ? 2 : Math.max(1, PAD_T + plotH - yOf(p.downloads));
                const cls = 'dshn-chart-bar'
                    + (pending ? ' dshn-chart-bar-pending' : '')
                    + (!pending && i === realLastIdx ? ' dshn-chart-bar-last' : '')
                    + (!pending && i === realPeakIdx ? ' dshn-chart-bar-peak' : '');
                const tip = pending
                    ? `${p.day} · ${t('noDataYet')}`
                    : `${p.day} · ${fmtInt(p.downloads)}${i === realPeakIdx ? ' · ' + t('peakDay') : ''}`;
                return (_jsx("rect", { className: cls, x: xOf(i), y: PAD_T + plotH - h, width: barW, height: h, rx: Math.min(3, barW / 2), children: _jsx("title", { children: tip }) }, p.day));
            }), realPeakIdx >= 0 && realPeakIdx !== realLastIdx ? (_jsx("text", { className: "dshn-chart-text", x: xOf(realPeakIdx) + barW / 2, y: yOf(all[realPeakIdx].downloads) - 5, textAnchor: "middle", children: fmtCompact(all[realPeakIdx].downloads) })) : null, xTicks.map((i) => {
                const day = all[i].day;
                return (_jsx("text", { className: "dshn-chart-text", x: xOf(i) + barW / 2, y: H - 8, textAnchor: i === 0 ? 'start' : i === all.length - 1 ? 'end' : 'middle', children: day.slice(5) }, i));
            })] }));
}
