/**
 * dsh-listen-npm —— 监控 tab：监控列表的增删与状态总览。
 *
 * - 顶部：「在菜单中显示」开关（与宿主「设置 → npm 监控」分区页同一偏好源，
 *   控制侧栏 footerAction 入口按钮的显隐）+ 添加输入框 + 立即刷新 + 自动刷新
 *   间隔说明；
 * - 列表项：包名（点击进查询 tab 看详情）、latest 版本（就是普通版本号，不做任何
 *   「有新版本」标记/高亮）、昨日/近 7 天下载量（与上个快照对比的趋势箭头）、右侧
 *   近 7 天日安装量迷你柱状图（数据随刷新响应返回，无额外请求）、刷新失败原因、
 *   移除按钮；
 * - 打开 tab 时静默清除新版本未读标记（入口已不展示任何更新提示；版本变化只在
 *   「历史」tab 的快照时间线里体现）。
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