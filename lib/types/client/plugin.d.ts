/**
 * dsh-listen-npm —— 浏览器半边插件主体（slots 注册，形态对齐 dsh-jenkins）。
 *
 * 本文件不包含 __ModuleLoader__ 包装：构建为单文件 CJS 后由 tsdown 的
 * banner/intro/footer 在构建时生成工厂包装。外部依赖（react 等）在打包时
 * external，运行时经 factory 的 require 解析到宿主模块表（seed）。
 *
 * 入口结构：
 * - sidebar.footer.action：常驻「npm 监控」按钮（右侧小胶囊展示监控数量与
 *   「有更新」提示），点击打开统一弹框；
 * - shell.overlay（dsh-listen-npm）：统一弹框，三个 tab —— 查询 / 监控 / 历史；
 * - conversation.chat.commandview：兜底隐藏对话中显式执行命令的内部 JSON 卡片。
 *
 * 后台轮询器与弹框生命周期解耦：按宿主配置间隔自动刷新监控列表，关闭弹框后
 * 仍持续跟踪版本与下载量变化。
 */
import type { ReactNode } from 'react';
/** 浏览器侧插件上下文（宿主注入）。 */
export interface ClientCtx {
    get<T = unknown>(name: string): T | undefined;
    /** cordis 事件订阅（可选：宿主 locale 服务缺失时的 'locale/change' 兜底通道）。 */
    on?(event: string, listener: (payload: unknown) => void): unknown;
    interval(callback: () => void, ms: number): () => void;
    remote: {
        commands: {
            execute(sessionId: string, command: string): Promise<unknown>;
        };
    };
}
export interface ClientPluginModule {
    name: string;
    inject: string[];
    apply(ctx: ClientCtx): void;
}
export declare function createPlugin(): ClientPluginModule;
export type { ReactNode };
//# sourceMappingURL=plugin.d.ts.map