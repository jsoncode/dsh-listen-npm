/**
 * dsh-listen-npm —�?侧边栏底部入口（sidebar.footer.action）：
 * 常驻「npm 监控」按钮，点击打开统一弹框（查�?/ 监控 / 历史 三个 tab）�? *
 * 按钮右侧小胶囊：
 * - 蓝描边：监控中的包数量（有监控时显示）；
 * - 琥珀橙【有更新】：监控的包出现新版本且未查看时显示（数据来自后台轮询器）�? */
import type { Poller } from '../poller.ts';
export interface FooterButtonProps {
    /** 打开统一弹框�?*/
    onOpen(): void;
    /** 上报当前会话 id（供命令通道回退复用）�?*/
    reportSession?: (sessionId: string) => void;
    wide?: boolean;
    useSessions?: (selector: (s: {
        current?: string;
    }) => unknown) => unknown;
    /** 后台轮询器：摘要数据源�?*/
    poller?: Poller;
}
export declare function FooterButton({ onOpen, reportSession, wide, useSessions, poller }: FooterButtonProps): import("react").JSX.Element;
//# sourceMappingURL=FooterButton.d.ts.map