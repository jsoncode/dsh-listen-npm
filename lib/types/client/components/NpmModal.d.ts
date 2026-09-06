/**
 * dsh-listen-npm —�?统一「npm 包监控」弹框：查询 / 监控 / 历史 三个 tab�? *
 * �?shell.overlay 槽位渲染（打开状态来自共�?ModalStore）；footer 入口�? * 监控徽标数据来自共享的后台轮询器（弹框关闭后仍在刷新）�? */
import type { RunFn } from '../rpc.ts';
import type { WatchSummary } from '../store.ts';
import type { Poller } from '../poller.ts';
export interface NpmModalProps {
    run: RunFn;
    useOpen: () => boolean;
    close(): void;
    poller: Poller;
    /** footer 胶囊摘要（监控数量徽标联动）�?*/
    useSummary: () => WatchSummary;
    /** 自动刷新间隔（分钟，config op 下发的响应式 store）�?*/
    useRefreshMinutes: () => number;
}
export declare function NpmModal({ run, useOpen, close, poller, useSummary, useRefreshMinutes }: NpmModalProps): () => void;
//# sourceMappingURL=NpmModal.d.ts.map