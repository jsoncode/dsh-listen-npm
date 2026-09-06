import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { fmtCompact } from "../format.js";
import { t } from "../i18n.js";
const W = 720;
const H = 240;
const PAD_L = 52;
const PAD_R = 10;
const PAD_T = 20;
const PAD_B = 24;
export function DownloadChart({ data }) {
    if (!data || data.length === 0) {
        return _jsx("div", { className: "dshn-empty", children: t('versionsEmpty') });
    }
    const values = data.map((p) => p.downloads);
    const max = Math.max(...values, 1);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const peakIdx = values.indexOf(Math.max(...values));
    const lastIdx = data.length - 1;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;
    const slot = plotW / data.length;
    const barW = Math.max(2, Math.min(18, slot * 0.72));
    const yOf = (v) => PAD_T + plotH - (v / max) * plotH;
    const xOf = (i) => PAD_L + slot * i + (slot - barW) / 2
        // y �?3 条网格线�? / ½max / max），标签紧凑�?  const gridVals = [max, max / 2, 0]
        // x 轴稀疏标注：�?/ �?/ �?  const xTicks = data.length >= 3
        ? [0, Math.floor((data.length - 1) / 2), data.length - 1]
        : data.map((_, i) => i);
    return (_jsxs("svg", { className: "dshn-chart-svg", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": t('dailyChartTitle'), children: [gridVals.map((v, i) => {
                const y = yOf(v);
                return (_jsxs("g", { children: [_jsx("line", { className: "dshn-chart-grid", x1: PAD_L, y1: y, x2: W - PAD_R, y2: y }), _jsx("text", { className: "dshn-chart-text", x: PAD_L - 6, y: y + 3, textAnchor: "end", children: fmtCompact(v) })] }, i));
            }), avg > 0 && avg < max ? (_jsxs("g", { children: [_jsx("line", { className: "dshn-chart-avg", x1: PAD_L, y1: yOf(avg), x2: W - PAD_R, y2: yOf(avg) }), _jsxs("text", { className: "dshn-chart-text", x: W - PAD_R - 2, y: yOf(avg) - 4, textAnchor: "end", children: [t('dailyAvg'), " ", fmtCompact(avg)] })] })) : null, peakIdx !== -1 && peakIdx !== lastIdx && data[peakIdx].downloads > 0 ? (_jsx("text", { className: "dshn-chart-text", x: xOf(peakIdx) + barW / 2, y: yOf(data[peakIdx].downloads) - 5, textAnchor: "middle", children: fmtCompact(data[peakIdx].downloads) })) : null, xTicks.map((i) => {
                const day = data[i].day;
                return (_jsx("text", { className: "dshn-chart-text", x: xOf(i) + barW / 2, y: H - 8, textAnchor: i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle', children: day.slice(5) }, i));
            })] }));
}
