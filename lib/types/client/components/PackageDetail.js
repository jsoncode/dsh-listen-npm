import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * dsh-listen-npm —— 包详情视图（查询 tab 主体）。
 *
 * 布局：头部（名称/版本/许可证/操作）→ 描述与链接 → 下载量卡片（突出显示：
 * 最新单日/近7天/近30天/近一年 + 每日安装量柱状图）→ 基本信息 → dist-tags →
 * 版本列表（固定高度滚动）→ README 摘要（Markdown 渲染）。
 *
 * 下载量口径（对齐 npm 的 T+N 统计延迟）：
 * - 序列由宿主补齐到昨天（缺失日 0，尾部待统计日 0 + pending），图表日期连续；
 * - 聚合值与日期标签锚定最后一个「真实数据日」：只有当它就是昨天时才写「昨日」，
 *   否则写「最新单日 + 日期」，并用一行说明标出尚未统计的日期区间（避免把延迟
 *   读成插件 bug）。
 */
import { useState } from 'react';
import { t } from "../i18n.js";
import { fmtBytes, fmtCompact, fmtDate, fmtDateTime, fmtInt, seriesOf } from "../format.js";
import { DownloadChart } from "./DownloadChart.js";
import { Markdown } from "./Markdown.js";
/** 拼一行链接（无值时跳过）。 */
function Links({ res }) {
    const info = res.info;
    if (!info)
        return null;
    const npmPage = 'https://www.npmjs.com/package/' + encodeURIComponent(info.name).replace('%40', '@');
    const links = [];
    if (info.homepage)
        links.push({ label: t('homepage'), href: info.homepage });
    if (info.repository)
        links.push({ label: t('repository'), href: info.repository });
    if (info.bugs)
        links.push({ label: t('issues'), href: info.bugs });
    links.push({ label: t('npmPage'), href: npmPage });
    return (_jsx("div", { className: "dshn-detail-links", children: links.map((l) => (_jsxs("a", { className: "dshn-link", href: l.href, target: "_blank", rel: "noreferrer", children: [l.label, " \u2197"] }, l.label + l.href))) }));
}
export function PackageDetail({ res, watched, onWatch, watchBusy, notice }) {
    const [readmeOpen, setReadmeOpen] = useState(false);
    const info = res.info;
    if (!res.ok || !info) {
        return _jsxs("div", { className: "dshn-err", children: [t('queryFailed'), ": ", res.error || res.code || ''] });
    }
    const p = res.points;
    const daily = res.daily || [];
    // 序列在客户端幂等重算（补齐到昨天）：旧版宿主也能正确显示连续性。
    const series = seriesOf(daily);
    const lagDays = series.lagDays;
    const dataEnd = series.dataEnd;
    // 区间提示按补齐后的日历区间显示（与图表 x 轴一致，不受宿主版本影响）。
    const rangeFrom = series.all.length > 0 ? series.all[0].day : (res.rangeStart || '—');
    const rangeTo = series.expectedEnd || res.rangeEnd || '—';
    // 「最新单日」== 昨天 时才能叫「昨日」；有延迟就写实际日期，别让人误读。
    const dayLabel = lagDays > 0 ? t('dlLatest') : t('dlDay');
    const detail = info.latestDetail;
    const versionRows = info.versions || [];
    return (_jsxs("div", { children: [_jsxs("div", { className: "dshn-detail-head", children: [_jsxs("div", { style: { minWidth: 0, flex: 1 }, children: [_jsxs("div", { className: "dshn-detail-name", children: [info.name, _jsxs("span", { className: "dshn-detail-ver", children: [info.latest ? _jsxs("span", { className: "dshn-chip dshn-chip-latest", children: [t('latestVersion'), " ", info.latest] }) : null, info.license ? _jsx("span", { className: "dshn-chip", children: info.license }) : null] })] }), _jsx("div", { className: "dshn-detail-desc", children: info.description || t('noDescription') }), _jsx(Links, { res: res })] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }, children: _jsx("button", { type: "button", className: "dshn-btn dshn-btn-small", disabled: watched || watchBusy, onClick: onWatch, children: watched ? t('watching') : t('watchThis') }) })] }), notice ? _jsx("div", { className: notice.startsWith('!') ? 'dshn-err' : 'dshn-ok', children: notice.startsWith('!') ? notice.slice(1) : notice }) : null, _jsxs("div", { className: "dshn-card", children: [_jsxs("div", { className: "dshn-card-title", children: [t('downloadsTitle'), _jsxs("span", { className: "dshn-hint", children: [t('rangeLabel'), " ", rangeFrom, " ~ ", rangeTo, lagDays > 0 ? ` · ${t('lagShort', { n: lagDays })}` : ''] })] }), _jsxs("div", { className: "dshn-stats", children: [_jsxs("div", { className: "dshn-stat dshn-stat-hero", children: [_jsx("div", { className: "dshn-stat-label", children: dayLabel }), _jsx("div", { className: "dshn-stat-value", children: fmtInt(p?.day?.downloads) }), _jsx("div", { className: "dshn-stat-sub", children: dataEnd || p?.day?.end || '' })] }), _jsxs("div", { className: "dshn-stat", title: p?.week ? `${p.week.start} ~ ${p.week.end}` : undefined, children: [_jsx("div", { className: "dshn-stat-label", children: t('dlWeek') }), _jsx("div", { className: "dshn-stat-value", children: fmtCompact(p?.week?.downloads) }), _jsx("div", { className: "dshn-stat-sub", children: fmtInt(p?.week?.downloads) })] }), _jsxs("div", { className: "dshn-stat", title: p?.month ? `${p.month.start} ~ ${p.month.end}` : undefined, children: [_jsx("div", { className: "dshn-stat-label", children: t('dlMonth') }), _jsx("div", { className: "dshn-stat-value", children: fmtCompact(p?.month?.downloads) }), _jsx("div", { className: "dshn-stat-sub", children: fmtInt(p?.month?.downloads) })] }), _jsxs("div", { className: "dshn-stat", children: [_jsx("div", { className: "dshn-stat-label", children: t('dlYear') }), _jsx("div", { className: "dshn-stat-value", children: fmtCompact(p?.year?.downloads) }), _jsx("div", { className: "dshn-stat-sub", children: fmtInt(p?.year?.downloads) })] })] }), lagDays > 0 ? (_jsx("div", { className: "dshn-note", children: t('lagNote', { end: dataEnd || '—', n: lagDays, from: series.pendingFrom || '', to: series.pendingTo || '' }) })) : null, _jsxs("div", { className: "dshn-chart-wrap", children: [_jsxs("div", { className: "dshn-card-title", style: { marginBottom: 4 }, children: [t('dailyChartTitle'), _jsxs("span", { className: "dshn-hint", children: [series.all.length > 0 ? `${series.all[0].day} ~ ${series.all[series.all.length - 1].day}` : '', lagDays > 0 ? ` · ${t('chartPending')}` : ''] })] }), _jsx(DownloadChart, { data: daily })] })] }), _jsxs("div", { className: "dshn-card", children: [_jsx("div", { className: "dshn-card-title", children: t('basicTitle') }), _jsxs("div", { className: "dshn-meta", children: [_jsxs("div", { className: "dshn-meta-row", children: [_jsx("span", { className: "dshn-meta-key", children: t('fieldCreated') }), _jsx("span", { className: "dshn-meta-val", children: fmtDate(info.created) })] }), _jsxs("div", { className: "dshn-meta-row", children: [_jsx("span", { className: "dshn-meta-key", children: t('fieldModified') }), _jsx("span", { className: "dshn-meta-val", children: fmtDateTime(info.modified) })] }), _jsxs("div", { className: "dshn-meta-row", children: [_jsx("span", { className: "dshn-meta-key", children: t('fieldLatestPublish') }), _jsxs("span", { className: "dshn-meta-val", children: [fmtDateTime(detail?.publishTime), detail?.npmUser ? '（' + detail.npmUser + '）' : ''] })] }), _jsxs("div", { className: "dshn-meta-row", children: [_jsx("span", { className: "dshn-meta-key", children: t('fieldVersions') }), _jsx("span", { className: "dshn-meta-val", children: info.versionsCount ?? '—' })] }), _jsxs("div", { className: "dshn-meta-row", children: [_jsx("span", { className: "dshn-meta-key", children: t('fieldPkgSize') }), _jsx("span", { className: "dshn-meta-val", children: fmtBytes(detail?.unpackedSize) })] }), _jsxs("div", { className: "dshn-meta-row", children: [_jsx("span", { className: "dshn-meta-key", children: t('fieldFileCount') }), _jsx("span", { className: "dshn-meta-val", children: detail?.fileCount ?? '—' })] }), _jsxs("div", { className: "dshn-meta-row", children: [_jsx("span", { className: "dshn-meta-key", children: t('fieldNode') }), _jsx("span", { className: "dshn-meta-val", children: detail?.engines?.node || '—' })] }), _jsxs("div", { className: "dshn-meta-row", children: [_jsx("span", { className: "dshn-meta-key", children: t('fieldMaintainers') }), _jsx("span", { className: "dshn-meta-val", children: (info.maintainers || []).map((m) => m.name || m.email || '').filter(Boolean).join(', ') || '—' })] }), info.author ? _jsxs("div", { className: "dshn-meta-row", children: [_jsx("span", { className: "dshn-meta-key", children: "author" }), _jsx("span", { className: "dshn-meta-val", children: info.author })] }) : null] })] }), info.distTags && Object.keys(info.distTags).length > 0 ? (_jsxs("div", { className: "dshn-card", children: [_jsx("div", { className: "dshn-card-title", children: t('distTagsTitle') }), _jsx("div", { className: "dshn-tags", children: Object.entries(info.distTags).map(([tag, ver]) => (_jsxs("span", { className: 'dshn-chip' + (tag === 'latest' ? ' dshn-chip-latest' : ''), children: [tag, ": ", ver] }, tag))) })] })) : null, _jsxs("div", { className: "dshn-card", children: [_jsxs("div", { className: "dshn-card-title", children: [t('versionsTitle'), _jsx("span", { className: "dshn-hint", children: versionRows.length })] }), versionRows.length === 0 ? (_jsx("div", { className: "dshn-empty", children: t('versionsEmpty') })) : (_jsx("div", { className: "dshn-table-scroll", children: _jsxs("table", { className: "dshn-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { width: '30%' }, children: "version" }), _jsx("th", { children: t('historyColTime') })] }) }), _jsx("tbody", { children: versionRows.map((v) => (_jsxs("tr", { children: [_jsxs("td", { children: [v.version, v.latest ? _jsx("span", { className: "dshn-chip dshn-chip-latest", style: { marginLeft: 8 }, children: t('latestVersion') }) : null] }), _jsx("td", { children: fmtDateTime(v.time) })] }, v.version))) })] }) }))] }), _jsxs("div", { className: "dshn-card", children: [_jsxs("div", { className: "dshn-card-title", children: [t('readmeTitle'), info.readme ? (_jsx("button", { type: "button", className: "dshn-btn dshn-btn-small", onClick: () => setReadmeOpen(!readmeOpen), children: readmeOpen ? t('readmeCollapse') : t('readmeExpand') })) : null] }), info.readme ? (_jsxs("div", { style: { position: 'relative' }, children: [_jsx("div", { className: 'dshn-readme' + (readmeOpen ? ' dshn-readme-open' : ''), children: _jsx(Markdown, { text: info.readme }) }), !readmeOpen ? _jsx("div", { className: "dshn-readme-fade" }) : null] })) : (_jsx("div", { className: "dshn-empty", children: t('readmeEmpty') }))] })] }));
}
