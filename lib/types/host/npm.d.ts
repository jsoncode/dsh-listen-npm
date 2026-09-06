/**
 * dsh-listen-npm —�?npm 官方 API 调用核心（curl.exe，经宿主 subprocess 服务执行）�? *
 * �?dsh-jenkins �?jenkins.ts 同一模式：直�?spawn curl.exe，绕开 pwsh-sandbox
 * 受限令牌导致�?Schannel 问题；`-D -` 输出响应头用于解析状态码�? *
 * 数据源（均可在插件配置中替换，便于使用镜像）�? * - registry�?registryUrl>/<pkg>              全量文档（含 time / versions / readme�? * - registry�?registryUrl>/-/package/<pkg>/dist-tags   轻量 dist-tags
 * - registry�?registryUrl>/-/v1/search?text=  搜索
 * - downloads�?downloadsUrl>/point/<period>/<pkg>       周期下载量汇总（支持批量逗号分隔�? * - downloads�?downloadsUrl>/range/<period>/<pkg>       日粒度下载量（昨日起往前）
 *
 * 注意：downloads API �?scoped 包名使用原始斜杠（@scope/name），registry 则把
 * 斜杠编码�?%2F（实测两种服务的接受形式不同）�? */
import type { DailyPoint, DownloadPoint, HostCtxLike, PackageInfo, SearchItem } from './types.ts';
export interface NpmDeps {
    ctx: HostCtxLike;
    registryUrl: string;
    downloadsUrl: string;
}
/** npm API 错误（带本地化码，客户端�?code 显示�?英文）�?*/
export declare class NpmError extends Error {
    status?: number;
    code?: string;
    constructor(code: string, message: string, status?: number);
}
/** 包名归一化：容忍粘贴 npm 页面链接 / 前后空白 / 统一小写 scope�?*/
export declare function normalizePkgName(raw: string): string;
/** 包名合法性（npm rules 的宽松版：scope 可选，主体字符 [a-z0-9-._~]）�?*/
export declare function isValidPkgName(name: string): boolean;
/** 轻量 dist-tags（监控刷新用，响应极小）�?*/
export declare function fetchDistTags(deps: NpmDeps, name: string): Promise<Record<string, string>>;
export interface FullDocResult {
    info: PackageInfo;
}
/**
 * 全量文档 �?规范�?PackageInfo�? * readme 截断�?6000 字符；versions 按发布时间倒序截断�?100 个�? */
export declare function fetchPackageInfo(deps: NpmDeps, name: string): Promise<FullDocResult>;
/** 日粒度下载量（range/last-week �?range/last-month，按时间正序返回）�?*/
export declare function fetchDailyRange(deps: NpmDeps, name: string, range: 'last-week' | 'last-month'): Promise<{
    start: string;
    end: string;
    downloads: DailyPoint[];
}>;
/** 单周期下载量汇总（point/last-day|last-week|last-month|last-year）�?*/
export declare function fetchPoint(deps: NpmDeps, name: string, period: string): Promise<DownloadPoint>;
/**
 * 批量周期下载量（point/<period>/<pkg1,pkg2,�?，一次请求覆盖整个监控列表）�? *
 * 注意：downloads API 的批量接�?*不支�?scoped �?*（服务端 400�? * "scoped packages are not currently supported in bulk lookups"），调用方需
 * 先把 scoped 包拆出去单独查（�?ops.ts �?watchRefresh）。包名逐个编码�? * 分隔逗号保持原样（服务端按裸逗号切分）�? */
export declare function fetchBulkPoints(deps: NpmDeps, names: string[], period: string): Promise<Record<string, DownloadPoint>>;
/** registry 搜索�?-/v1/search），供弹框输入联想�?*/
export declare function searchPackages(deps: NpmDeps, text: string, size: number): Promise<SearchItem[]>;
//# sourceMappingURL=npm.d.ts.map