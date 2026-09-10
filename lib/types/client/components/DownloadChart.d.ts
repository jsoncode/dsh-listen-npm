/**
 * dsh-listen-npm —— 日安装量柱状图（纯 SVG，无第三方图表依赖）。
 *
 * 设计要点：
 * - 数据为 npm 下载量日粒度序列（近 30 天，时间正序，日历连续 —— 宿主已把
 *   区间内漏报日与尾部 npm 尚未统计的日子补成 0）；尾部补 0 的 pending 柱用
 *   灰色 + 虚线描边画出来，tooltip 标注「npm 尚未统计」，一眼能看出是延迟而不是
 *   数据缺失；
 * - 突出显示：最后一个「真实数据日」绿色柱、峰值柱描金 + 顶部标注、日均值虚线
 *   —— 峰值 / 日均 / y 轴只统计真实数据段，不被延迟的 0 拉低；
 * - 主题自适应：颜色全部走 CSS 类（styles.ts），深浅色模式跟随宿主；
 * - 每根柱带 <title> 原生 tooltip（日期 + 精确下载量）。
 */
import type { DailyPoint } from '../types.ts';
export interface DownloadChartProps {
    data: DailyPoint[];
}
export declare function DownloadChart({ data }: DownloadChartProps): import("react").JSX.Element;
//# sourceMappingURL=DownloadChart.d.ts.map