import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * dsh-listen-npm —— 侧边栏底部入口（sidebar.footer.action）：
 * 常驻「npm 监控」按钮，点击打开统一弹框（查询 / 监控 / 历史 三个 tab）。
 *
 * 按钮右侧小胶囊：蓝描边 = 监控中的包数量（有监控时显示）。
 * 版本变化**不在入口做任何提示**（没有「有更新」标签，也没有版本号胶囊），
 * 只在「历史」tab 的快照时间线里体现。
 *
 * 图标尺寸：img 带 width/height 属性 + 内联 style 兜底（见 logo.ts）。宿主
 * 样式表缺失/被回收时，图标也不会退回 SVG 的默认替换元素尺寸把按钮撑爆。
 */
import { useEffect, useState } from 'react';
import { t } from "../i18n.js";
import { NPM_LOGO, logoStyle } from "../logo.js";
const EMPTY_SUMMARY = { watching: 0, newVersions: 0 };
/** 图标边长（px）：与 .dshn-footer-logo 保持一致。 */
const LOGO_SIZE = 26;
export function FooterButton({ onOpen, reportSession, wide = false, useSessions, poller }) {
    const currentSessionId = useSessions
        ? useSessions((s) => s && s.current)
        : null;
    if (reportSession && currentSessionId)
        reportSession(currentSessionId);
    // 订阅轮询器：每次刷新后更新监控数量胶囊
    const [summary, setSummary] = useState(EMPTY_SUMMARY);
    useEffect(() => {
        if (!poller)
            return;
        const update = () => { setSummary(poller.getSummary()); };
        update();
        return poller.subscribe(update);
    }, [poller]);
    const showWatch = summary.watching > 0;
    return (_jsxs("div", { className: 'dshn-footer-group' + (wide ? '' : ' dshn-footer-rail-group'), children: [_jsxs("button", { type: "button", className: 'dshn-footer-btn' + (wide ? '' : ' dshn-footer-btn-rail'), title: t('configBtn'), "aria-label": t('configBtn'), onClick: onOpen, children: [_jsx("img", { src: NPM_LOGO, alt: "", className: "dshn-footer-logo", width: LOGO_SIZE, height: LOGO_SIZE, style: logoStyle(LOGO_SIZE), draggable: false }), wide ? _jsx("span", { className: "dshn-footer-label", children: t('configBtn') }) : null] }), showWatch ? (_jsx("span", { className: "dshn-footer-caps", children: _jsx("span", { className: "dshn-capsule dshn-capsule-watch", title: t('footerWatch') + ': ' + summary.watching, children: summary.watching }) })) : null] }));
}
