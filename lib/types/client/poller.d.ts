/**
 * dsh-listen-npm —�?浏览器半边：监控列表后台轮询器�? *
 * 与弹框生命周期解耦：关闭弹框后仍按配置间隔（宿主 config op 下发�? * refreshMinutes）调用宿�?watchRefresh，让监控列表持续跟踪版本与下载量变化�? * 变化结果写入摘要 store（footer 胶囊）与本地缓存（监�?tab 首屏直接可读）�? *
 * 空闲不请求：无监控包或未到刷新间隔时 tick 直接短路�? */
import type { RunFn } from './rpc.ts';
import type { SummaryStore, WatchSummary } from './store.ts';
/** 监控条目（宿�?WatchEntry 的客户端视图）�?*/
export interface WatchEntryView {
    name: string;
    addedAt: number;
    lastCheckAt?: number;
    lastVersion?: string;
    lastDay?: number;
    lastWeek?: number;
    prevDay?: number;
    prevWeek?: number;
    hasNewVersion?: boolean;
    error?: string;
}
export interface Poller {
    /** 立即刷新一次（监控列表整体）�?*/
    refresh(): Promise<void>;
    /** �?3s 由宿�?interval 驱动；到点且空闲时自�?refresh�?*/
    tick(): void;
    /** 启动引导：拉�?config（刷新间隔）+ 当前监控列表（不触发网络刷新）�?*/
    bootstrap(): void;
    /** 摘要（footer 胶囊）�?*/
    getSummary(): WatchSummary;
    subscribe(fn: () => void): () => void;
    /** 最近一次缓存列表（监控 tab 首屏）�?*/
    getWatch(): WatchEntryView[];
    /** 清除新版本未读标记（打开监控 tab 时调用）�?*/
    markSeen(): void;
    /** 增删监控后调用：置脏并立刻唤�?tick�?*/
    invalidate(): void;
    /** 最近一次错误（本地化文本，无错误为空串）�?*/
    lastError(): string;
    /** 最近一次成功刷新的时间（epoch ms�? 表示尚未刷新过）�?*/
    lastRefreshAt(): number;
}
export declare function createPoller(run: RunFn, summary: SummaryStore): Poller;
//# sourceMappingURL=poller.d.ts.map