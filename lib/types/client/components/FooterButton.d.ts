/**
 * dsh-listen-npm —— 侧边栏底部入口（sidebar.footer.action）：
 * 常驻「npm 监控」按钮，点击打开统一弹框（查询 / 监控 / 历史 三个 tab）。
 *
 * 按钮右侧小胶囊：蓝描边 = 监控中的包数量（有监控时显示）。
 * 版本变化**不在入口做任何提示**（没有「有更新」标签，也没有版本号胶囊），
 * 只在「历史」tab 的快照时间线里体现。
 *
 * 显隐跟随「在菜单中显示」偏好（prefs.ts 的 showInMenuStore，默认开启）：
 * 关闭后本组件渲染 null（不占位、不订阅轮询摘要）。偏好源与宿主
 * 「设置 → npm 监控」分区页、插件弹框「监控」tab 顶部的开关同一个，
 * 改一处即刻生效，无需刷新页面。
 *
 * 图标尺寸：img 带 width/height 属性 + 内联 style 兜底（见 logo.ts）。宿主
 * 样式表缺失/被回收时，图标也不会退回 SVG 的默认替换元素尺寸把按钮撑爆。
 */
import type { Poller } from '../poller.ts';
export interface FooterButtonProps {
    /** 打开统一弹框。 */
    onOpen(): void;
    /** 上报当前会话 id（供命令通道回退复用）。 */
    reportSession?: (sessionId: string) => void;
    wide?: boolean;
    useSessions?: (selector: (s: {
        current?: string;
    }) => unknown) => unknown;
    /** 后台轮询器：摘要数据源。 */
    poller?: Poller;
}
export declare function FooterButton({ onOpen, reportSession, wide, useSessions, poller }: FooterButtonProps): import("react").JSX.Element | null;
//# sourceMappingURL=FooterButton.d.ts.map