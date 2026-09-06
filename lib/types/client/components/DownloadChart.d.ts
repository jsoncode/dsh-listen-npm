/**
 * dsh-listen-npm —�?日安装量柱状图（�?SVG，无第三方图表依赖）�? *
 * 设计要点�? * - 数据�?npm 下载量日粒度序列（近 30 天，时间正序）；
 * - 突出显示：最新一天绿色柱（today �?T+1 数据）、峰值柱描金 + 顶部标注�? *   日均值虚�?+ 右侧标注�? * - 主题自适应：颜色全部走 CSS 类（styles.ts），深浅色模式跟随宿主；
 * - 每根柱带 <title> 原生 tooltip（日�?+ 精确下载量）�? */
import type { DailyPoint } from '../types.ts';
export interface DownloadChartProps {
    data: DailyPoint[];
}
export declare function DownloadChart({ data }: DownloadChartProps): import("react").JSX.Element;
//# sourceMappingURL=DownloadChart.d.ts.map