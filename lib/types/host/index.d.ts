/**
 * dsh-listen-npm —— npm 包监控插件 · 宿主半边（可发布组合包，无硬编码路径）。
 *
 * - 插件数据（监控列表 + 快照历史）持久化到 $DSH_HOME/dsh-listen-npm.json；
 * - `/dsh-listen-npm/api` HTTP 路由（webServer 注册 + 信任围栏）：浏览器半边
 *   （查询弹框 / 监控列表 / 后台轮询）经 fetch 调用，参数为 JSON
 *   （{ op: 'config|info|downloads|search|watchList|watchAdd|watchRemove|watchRefresh|watchSeen|history' }），
 *   结果以 JSON 信封回传。请求不进入对话命令通道，页面不会出现 command 节点；
 * - `dsh-listen-npm` 命令：保留兼容（用户/模型在对话中显式执行时可用）；
 * - 三个模型工具 dsh_npm_info / dsh_npm_downloads / dsh_npm_watch。
 *
 * 数据源：npm 官方 registry（元数据）与 api.npmjs.org（下载量），均可在插件
 * 配置中替换为镜像地址。
 *
 * 运行时依赖（@deepseek-ai/*）由 package.json 的 peerDependencies 声明，
 * 安装时由宿主解析，本文件不含任何绝对路径。
 */
import type { Context } from '@deepseek-ai/cordis';
import type { OpRequest, PluginConfig } from './types.ts';
export declare const name = "dsh-listen-npm";
export declare const inject: string[];
export declare const Config: import('@deepseek-ai/schemastery').default<PluginConfig>;
export declare function apply(ctx: Context, config?: Partial<PluginConfig>): void;
export type { OpRequest, PluginConfig };
//# sourceMappingURL=index.d.ts.map