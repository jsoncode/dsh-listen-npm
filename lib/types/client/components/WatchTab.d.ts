/**
 * dsh-listen-npm —— 监控 tab：监控列表的增删与状态总览。
 *
 * - 顶部：添加输入框 + 立即刷新 + 自动刷新间隔说明；
 * - 列表项：包名（点击进查询 tab 看详情）、latest 版本、昨日/近7天下载量
 *   （与上个快照对比的趋势箭头）、右侧近 7 天日安装量迷你柱状图（数据随
 *   刷新响应返回，无额外请求）、新版本未读徽标、刷新失败原因、移除按钮；
 * - 打开 tab 时自动清除新版本未读标记（watchSeen op，footer 橙色胶囊随之消失）。
 */
import type { RunFn } from '../rpc.ts';
import type { Poller } from '../poller.ts';
export interface WatchTabProps {
    run: RunFn;
    poller: Poller;
    /** 点击包名：跳查询 tab 查看详情。 */
    onOpenDetail(pkg: string): void;
    refreshMinutes: number;
}
export declare function WatchTab({ run, poller, onOpenDetail, refreshMinutes }: WatchTabProps): import("react").JSX.Element;
//# sourceMappingURL=WatchTab.d.ts.map