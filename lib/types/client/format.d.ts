/**
 * dsh-listen-npm —— 展示格式化工具（数字紧凑化 / 日期 / 相对时间 / 趋势）。
 */
/** 大数紧凑化：1.2B / 15.6M / 234.5k / 987。 */
export declare const fmtCompact: (n: number | undefined | null) => string;
/** 千分位整数。 */
export declare const fmtInt: (n: number | undefined | null) => string;
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
//# sourceMappingURL=format.d.ts.map