/**
 * dsh-listen-npm —�?浏览器半边：弹框开�?+ footer 胶囊摘要（footer 入口 �?overlay 弹框共享）�? */
export interface StoreState<T> {
    value: T;
    listeners: Array<() => void>;
    emit(): void;
    subscribe(l: () => void): () => void;
}
/** 弹框打开状态：footer 入口 open，overlay 弹框消费�?*/
export interface ModalStore {
    useOpen(): boolean;
    open(): void;
    close(): void;
}
export declare function makeModalStore(): ModalStore;
/** footer 胶囊摘要：监控数�?+ 有新版本的包数量（来自后台轮询器）�?*/
export interface WatchSummary {
    watching: number;
    newVersions: number;
}
export interface SummaryStore {
    set(summary: WatchSummary): void;
    useSummary(): WatchSummary;
}
export declare function makeSummaryStore(): SummaryStore;
/** 数�?store（宿�?config op �?refreshMinutes 下发通道）�?*/
export interface NumberStore {
    set(n: number): void;
    use(): number;
}
export declare function makeNumberStore(initial: number): NumberStore;
//# sourceMappingURL=store.d.ts.map