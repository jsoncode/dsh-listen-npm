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
import type { InfoResponse } from '../types.ts';
export interface PackageDetailProps {
    /** info op 完整响应。 */
    res: InfoResponse;
    /** 是否已在监控列表中。 */
    watched: boolean;
    /** 加入监控回调（busy 状态由父组件控制）。 */
    onWatch(): void;
    watchBusy?: boolean;
    /** 加入监控后的提示（成功/失败文本）。 */
    notice?: string;
}
export declare function PackageDetail({ res, watched, onWatch, watchBusy, notice }: PackageDetailProps): import("react").JSX.Element;
//# sourceMappingURL=PackageDetail.d.ts.map