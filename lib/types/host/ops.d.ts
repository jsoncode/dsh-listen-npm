/**
 * dsh-listen-npm —— 操作分发（HTTP 路由 / 命令 / 模型工具共用）：runOp 全部分支。
 *
 * 分支：config / info / downloads / search / watchList / watchAdd / watchRemove /
 * watchRefresh / watchSeen / history。
 *
 * 监控刷新策略（省请求）：
 * - 每个 watched 包两次轻量请求：dist-tags（几百字节）+ downloads range/last-week；
 * - 最新单日 / 近 7 天下载量与监控列表迷你柱状图的日粒度序列都由 range 响应推导
 *   （downloads 批量接口不支持 scoped 包，range 本就按包查询——scoped 包反而
 *   从 3 次请求/包降到 2 次/包）；
 * - 下载量序列统一经 buildDailySeries 补齐到「昨天」（缺失日 0，尾部未统计日
 *   0 + pending），聚合值只统计真实数据日，避免 npm 的 T+N 延迟把数字压低；
 * - dist-tags.latest 与本地记录不同 → 版本变更：置 hasNewVersion + 追加快照。
 */
import type { DailyPoint, DownloadPoint, NpmStoreData, OpRequest, OpResult, PackageInfo } from './types.ts';
export interface OpsDeps {
    ctx: import('./types.ts').HostCtxLike;
    /** 数据文件内存镜像（读同步）。 */
    readStore(): NpmStoreData;
    /** 整体写回（异步落盘）。 */
    writeStore(data: NpmStoreData): Promise<void>;
    registryUrl: string;
    downloadsUrl: string;
    /** 监控列表自动刷新间隔（分钟，客户端轮询用）。 */
    refreshMinutes: number;
    /** 数据文件初始化（加载）完成信号；runOp 开头等待，避免读到空镜像。 */
    storeReady?: Promise<void>;
}
export interface InfoPayload {
    info: PackageInfo;
    /** 连续日粒度序列（正序；尾部未统计日补 0 且 pending=true）。 */
    daily: DailyPoint[];
    /** 序列首日 / 末日（补齐后的日历区间，供「统计区间」展示）。 */
    rangeStart: string;
    rangeEnd: string;
    /** 最后一个有数据的日期（'' = 无数据）—— 「最新单日」的日期。 */
    dataEnd: string;
    /** npm 尚未统计的天数（rangeEnd 与 dataEnd 之间的距离）。 */
    lagDays: number;
    points: {
        day?: DownloadPoint;
        week?: DownloadPoint;
        month?: DownloadPoint;
        year?: DownloadPoint;
    };
}
export declare function runOp(deps: OpsDeps, req: OpRequest): Promise<OpResult>;
//# sourceMappingURL=ops.d.ts.map