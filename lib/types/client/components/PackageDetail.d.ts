/**
 * dsh-listen-npm —— 包详情视图（查询 tab 主体）。
 *
 * 布局：头部（名称/版本/许可证/操作）→ 描述与链接 → 下载量卡片（突出显示：
 * 昨日/近7天/近30天/近一年 + 每日安装量柱状图）→ 基本信息 → dist-tags →
 * 依赖 → 版本列表 → README 摘要。
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