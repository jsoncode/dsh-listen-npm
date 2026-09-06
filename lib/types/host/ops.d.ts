/**
 * dsh-listen-npm —— 操作分发（HTTP 路由 / 命令 / 模型工具共用）：runOp 全部分支。
 *
 * 分支：config / info / downloads / search / watchList / watchAdd / watchRemove /
 * watchRefresh / watchSeen / history。
 *
 * 监控刷新策略（省请求）：
 * - 每个 watched 包一次轻量 dist-tags 请求（几百字节）；
 * - 昨日 / 近 7 天下载量走 point 批量接口（整个列表各 1 次请求）；
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
    daily: DailyPoint[];
    rangeStart: string;
    rangeEnd: string;
    points: {
        day?: DownloadPoint;
        week?: DownloadPoint;
        month?: DownloadPoint;
        year?: DownloadPoint;
    };
}
export declare function runOp(deps: OpsDeps, req: OpRequest): Promise<OpResult>;
//# sourceMappingURL=ops.d.ts.map