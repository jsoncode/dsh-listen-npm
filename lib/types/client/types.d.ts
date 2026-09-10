/**
 * dsh-listen-npm —— 客户端共享类型（宿主 API 载荷的客户端视图）。
 */
/** 日粒度下载量（api.npmjs.org/downloads/range）。 */
export interface DailyPoint {
    day: string;
    downloads: number;
    /** true = 该日 npm 尚未统计，值是按日历连续性补的 0（非真实 0 下载）。 */
    pending?: boolean;
}
/** info op 返回的包完整信息。 */
export interface PackageInfoView {
    name: string;
    description?: string;
    latest?: string;
    distTags?: Record<string, string>;
    license?: string;
    author?: string;
    homepage?: string;
    repository?: string;
    bugs?: string;
    keywords?: string[];
    maintainers?: Array<{
        name?: string;
        email?: string;
    }>;
    created?: string;
    modified?: string;
    versionsCount?: number;
    versions?: Array<{
        version: string;
        time?: string;
        latest?: boolean;
    }>;
    latestDetail?: {
        publishTime?: string;
        fileCount?: number;
        unpackedSize?: number;
        engines?: Record<string, string>;
        shasum?: string;
        npmUser?: string;
    };
    readme?: string;
    readmeTruncated?: boolean;
}
export interface DownloadPointView {
    downloads: number;
    start: string;
    end: string;
}
/** info op 响应。 */
export interface InfoResponse {
    ok: boolean;
    code?: string;
    error?: string;
    info?: PackageInfoView;
    /** 连续日粒度序列（尾部未统计日补 0 且 pending=true）。 */
    daily?: DailyPoint[];
    /** 序列首日 / 末日（补齐后的日历区间）。 */
    rangeStart?: string;
    rangeEnd?: string;
    /** 最后一个有数据的日期（'' = 无数据）。 */
    dataEnd?: string;
    /** npm 尚未统计的天数（>0 = 「最新单日」不是昨天，需明确标注日期）。 */
    lagDays?: number;
    points?: {
        day?: DownloadPointView;
        week?: DownloadPointView;
        month?: DownloadPointView;
        year?: DownloadPointView;
    };
}
/** search op 单条结果。 */
export interface SearchItemView {
    name: string;
    version?: string;
    description?: string;
    keywords?: string[];
    weekly?: number;
    monthly?: number;
    dependents?: number;
    publisher?: string;
    date?: string;
}
//# sourceMappingURL=types.d.ts.map