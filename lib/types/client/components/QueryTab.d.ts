/**
 * dsh-listen-npm —�?查询 tab：包名输�?+ 联想搜索 + 详情展示�? *
 * - 输入 �? 字符时防�?300ms �?search op 弹出联想列表（名�?描述/周下载量）；
 * - 回车或点击「查询」直接拉�?info op 展示完整详情�? * - 详情头部可一键加入监控（watchAdd op）�? */
import type { RunFn } from '../rpc.ts';
export interface QueryTabProps {
    run: RunFn;
    /** 打开时直接查询的包名（监�?历史 tab 跳转过来）�?*/
    initialPkg?: string;
    /** 已监控包名集合（详情头部按钮状态）�?*/
    watchedNames: ReadonlySet<string>;
    /** 增删监控后通知轮询器刷新缓存�?*/
    onWatchChanged(): void;
}
export declare function QueryTab({ run, initialPkg, watchedNames, onWatchChanged }: QueryTabProps): void;
//# sourceMappingURL=QueryTab.d.ts.map