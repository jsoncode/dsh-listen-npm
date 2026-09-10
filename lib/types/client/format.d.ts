/**
 * dsh-listen-npm —— 展示格式化工具（数字紧凑化 / 日期 / 相对时间 / 趋势）。
 */
import type { DailyPoint } from './types.ts';
/** 大数紧凑化：1.2B / 15.6M / 234.5k / 987。 */
export declare const fmtCompact: (n: number | undefined | null) => string;
/** 千分位整数。 */
export declare const fmtInt: (n: number | undefined | null) => string;
/** 'YYYY-MM-DD' → 'MM-DD'（纯字符串截取，不经过 Date，避免时区偏移）。 */
export declare const fmtDayShort: (day: string | undefined) => string;
/** ISO 时间 → 本地 "YYYY-MM-DD HH:mm"（仅日期字段容错）。 */
export declare const fmtDateTime: (iso: string | undefined) => string;
/** ISO 时间 → 本地日期 "YYYY-MM-DD"。 */
export declare const fmtDate: (iso: string | undefined) => string;
/** epoch ms → 相对时间（分钟/小时/天前）。 */
export declare const fmtRel: (ms: number | undefined) => string;
/** 字节数 → 可读（1.2 MB / 340 kB）。 */
export declare const fmtBytes: (n: number | undefined) => string;
/** 下载量趋势：与上个快照比较的百分比箭头。 */
export interface DeltaView {
    cls: string;
    text: string;
}
export declare const deltaOf: (current: number | undefined, prev: number | undefined) => DeltaView | null;
/**
 * 宿主返回的日粒度序列视图。
 *
 * 序列由宿主补齐到「昨天」（区间内漏报日补 0，尾部 npm 尚未统计的日期补 0 且
 * `pending=true`）；这里用同一个纯函数（src/shared/daily.ts）**幂等重算**一遍，
 * 于是：
 * - 图表照原样画满每一根柱子（日期连续，不会「断在几天前」）；
 * - 峰值 / 日均 / 聚合数字只看真实数据段，不被延迟的 0 拉低；
 * - 标签能说出真实数据截止在哪天（滞后时不再写「昨日」）；
 * - 即使宿主还是旧版本（只返回真实数据段），前端也能补齐尾部、正确标注
 *   —— 只需刷新页面即可看到连续性修复。
 */
export interface DailySeriesView {
    /** 全部点（含补齐的 pending 段），时间正序。 */
    all: DailyPoint[];
    /** 真实数据点（npm 已统计）。 */
    real: DailyPoint[];
    /** 第一个 / 最后一个真实数据日（'' = 无数据）。 */
    dataStart: string;
    dataEnd: string;
    /** 补齐后的最后一天（通常是昨天）。 */
    expectedEnd: string;
    /** 尾部尚未统计的天数（0 = 数据最新）。 */
    lagDays: number;
    /** 尾部待统计段的起止日期（lagDays>0 时非空）。 */
    pendingFrom: string;
    pendingTo: string;
}
export declare const seriesOf: (daily: DailyPoint[] | undefined) => DailySeriesView;
//# sourceMappingURL=format.d.ts.map