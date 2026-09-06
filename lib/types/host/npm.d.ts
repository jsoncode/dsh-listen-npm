/**
 * dsh-listen-npm —— npm 官方 API 调用核心（curl.exe，经宿主 subprocess 服务执行）。
 *
 * 与 dsh-jenkins 的 jenkins.ts 同一模式：直接 spawn curl.exe，绕开 pwsh-sandbox
 * 受限令牌导致的 Schannel 问题；`-D -` 输出响应头用于解析状态码。
 *
 * 数据源（均可在插件配置中替换，便于使用镜像）：
 * - registry：<registryUrl>/<pkg>              全量文档（含 time / versions / readme）
 * - registry：<registryUrl>/-/package/<pkg>/dist-tags   轻量 dist-tags
 * - registry：<registryUrl>/-/v1/search?text=  搜索
 * - downloads：<downloadsUrl>/point/<period>/<pkg>       周期下载量汇总（支持批量逗号分隔）
 * - downloads：<downloadsUrl>/range/<period>/<pkg>       日粒度下载量（昨日起往前）
 *
 * 注意：downloads API 的 scoped 包名使用原始斜杠（@scope/name），registry 则把
 * 斜杠编码为 %2F（实测两种服务的接受形式不同）。
 */
import type { DailyPoint, DownloadPoint, HostCtxLike, PackageInfo, SearchItem } from './types.ts';
export interface NpmDeps {
    ctx: HostCtxLike;
    registryUrl: string;
    downloadsUrl: string;
}
/** npm API 错误（带本地化码，客户端按 code 显示中/英文）。 */
export declare class NpmError extends Error {
    status?: number;
    code?: string;
    constructor(code: string, message: string, status?: number);
}
/** 包名归一化：容忍粘贴 npm 页面链接 / 前后空白 / 统一小写 scope。 */
export declare function normalizePkgName(raw: string): string;
/** 识别主流托管平台（github / gitlab / gitee）的仓库网页地址，返回 { host, slug }。 */
export declare function platformSlugOf(url: string): {
    host: string;
    slug: string;
} | undefined;
/** 平台仓库地址 → issues 页地址（gitlab 的 issues 挂在 /-/issues）。 */
export declare function issuesUrlOfPlatform(host: string, slug: string): string;
/**
 * registry 文档的 repository / bugs 字段 → 仓库网页地址 + issues 跳转地址。
 *
 * repository 归一化常见非网页形态：git+ 前缀 / .git 后缀 / git:// 协议 /
 * ssh://git@ / scp 形式（git@host:path）/ npm shorthand（github:owner/repo 等）。
 *
 * issues 推导规则：npm 的 bugs 常见形态是 { email } / mailto:（当链接用会唤起
 * 邮件客户端），还有大量包把 bugs.url 填成仓库首页甚至裸域名（点了就是
 * GitHub 首页）。因此：
 * 1. 只接受 http(s) 形式的 bugs.url；
 * 2. 托管平台链接统一校验/补全为 issues 页：已是 issues 页原样保留，
 *    仓库首页补 /issues（gitlab 为 /-/issues），裸域名/仅组织名等定位不到
 *    仓库的丢弃；
 * 3. 非托管平台的自定义 tracker 原样保留；
 * 4. 仍无可用链接时，从 repository 推导 issues 页。
 */
export declare function deriveRepoAndIssues(repoRaw: unknown, bugsRaw: unknown): {
    repository?: string;
    bugs?: string;
};
/** 包名合法性（npm rules 的宽松版：scope 可选，主体字符 [a-z0-9-._~]）。 */
export declare function isValidPkgName(name: string): boolean;
/** 轻量 dist-tags（监控刷新用，响应极小）。 */
export declare function fetchDistTags(deps: NpmDeps, name: string): Promise<Record<string, string>>;
export interface FullDocResult {
    info: PackageInfo;
}
/**
 * 全量文档 → 规范化 PackageInfo。
 * readme 截断前 6000 字符；versions 按发布时间倒序截断前 100 个。
 */
export declare function fetchPackageInfo(deps: NpmDeps, name: string): Promise<FullDocResult>;
/** 日粒度下载量（range/last-week 或 range/last-month，按时间正序返回）。 */
export declare function fetchDailyRange(deps: NpmDeps, name: string, range: 'last-week' | 'last-month'): Promise<{
    start: string;
    end: string;
    downloads: DailyPoint[];
}>;
/** 单周期下载量汇总（point/last-day|last-week|last-month|last-year）。 */
export declare function fetchPoint(deps: NpmDeps, name: string, period: string): Promise<DownloadPoint>;
/**
 * 批量周期下载量（point/<period>/<pkg1,pkg2,…>，一次请求覆盖整个监控列表）。
 *
 * 注意：downloads API 的批量接口**不支持 scoped 包**（服务端 400：
 * "scoped packages are not currently supported in bulk lookups"），调用方需
 * 先把 scoped 包拆出去单独查（见 ops.ts 的 watchRefresh）。包名逐个编码、
 * 分隔逗号保持原样（服务端按裸逗号切分）。
 */
export declare function fetchBulkPoints(deps: NpmDeps, names: string[], period: string): Promise<Record<string, DownloadPoint>>;
/** registry 搜索（/-/v1/search），供弹框输入联想。 */
export declare function searchPackages(deps: NpmDeps, text: string, size: number): Promise<SearchItem[]>;
//# sourceMappingURL=npm.d.ts.map