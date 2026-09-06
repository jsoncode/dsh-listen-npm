import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * dsh-listen-npm —— 侧边栏底部入口（sidebar.footer.action）：
 * 常驻「npm 监控」按钮，点击打开统一弹框（查询 / 监控 / 历史 三个 tab）。
 *
 * 按钮右侧小胶囊：
 * - 蓝描边：监控中的包数量（有监控时显示）；
 * - 琥珀橙【有更新】：监控的包出现新版本且未查看时显示（数据来自后台轮询器）。
 */
import { useEffect, useState } from 'react';
import { t } from "../i18n.js";
import { NPM_LOGO } from "../logo.js";
const EMPTY_SUMMARY = { watching: 0, newVersions: 0 };
export function FooterButton({ onOpen, reportSession, wide = false, useSessions, poller }) {
    const currentSessionId = useSessions
        ? useSessions((s) => s && s.current)
        : null;
    if (reportSession && currentSessionId)
        reportSession(currentSessionId);
    // 订阅轮询器：每次刷新后更新胶囊
    const [summary, setSummary] = useState(EMPTY_SUMMARY);
    useEffect(() => {
        if (!poller)
            return;
        const update = () => { setSummary(poller.getSummary()); };
        update();
        return poller.subscribe(update);
    }, [poller]);
    const showWatch = summary.watching > 0;
    const showNew = summary.newVersions > 0;
    return (_jsxs("div", { className: 'dshn-footer-group' + (wide ? '' : ' dshn-footer-rail-group'), children: [_jsxs("button", { type: "button", className: 'dshn-footer-btn' + (wide ? '' : ' dshn-footer-btn-rail'), title: t('configBtn'), "aria-label": t('configBtn'), onClick: onOpen, children: [_jsx("img", { src: NPM_LOGO, alt: "", className: "dshn-footer-logo" }), wide ? _jsx("span", { className: "dshn-footer-label", children: t('configBtn') }) : null] }), showWatch || showNew ? (_jsxs("span", { className: "dshn-footer-caps", children: [showWatch ? (_jsx("span", { className: "dshn-capsule dshn-capsule-watch", title: t('footerWatch') + ': ' + summary.watching, children: summary.watching })) : null, showNew ? (_jsx("span", { className: "dshn-capsule dshn-capsule-new", title: t('footerNewVersionTitle'), children: t('footerNewVersion') })) : null] })) : null] }));
}
