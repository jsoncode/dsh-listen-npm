/**
 * dsh-listen-npm —�?历史 tab：监控包的快照时间线�? *
 * 快照在「加入监控（init）」与「版本变更（version-change）」时由宿主记录，
 * 展示为时间倒序表格：记录时�?/ latest 版本 / 昨日下载 / �?7 天下�?/ 类型�? */
import type { RunFn } from '../rpc.ts';
export interface HistoryTabProps {
    run: RunFn;
    /** 可选的包列表（来自监控缓存）�?*/
    names: string[];
}
export declare function HistoryTab({ run, names }: HistoryTabProps): import("react").JSX.Element;
//# sourceMappingURL=HistoryTab.d.ts.map