/**
 * dsh-listen-npm —— 插件数据文件存储（$DSH_HOME/dsh-listen-npm.json）。
 *
 * 监控列表与快照历史的唯一持久化源（无敏感数据，明文 JSON）。
 * 路径解析优先级：settings 服务 documentPath 所在目录 → $DSH_HOME 环境变量 →
 * ~/.dsh。不新增 peerDependency（复用 node:fs / node:os）。
 *
 * 写路径为进程内串行队列 + 临时文件 rename 原子写；损坏文件备份为 .bak。
 */
import type { NpmStoreData, Snapshot, WatchEntry } from './types.ts';
export type { NpmStoreData, Snapshot, WatchEntry };
/** 数据文件格式版本（预留演进）。 */
export declare const STORE_VERSION = 1;
export declare const STORE_FILE = "dsh-listen-npm.json";
/** 每个包的快照上限（历史时间线防膨胀）。 */
export declare const SNAPSHOTS_LIMIT = 200;
export declare const EMPTY_STORE: () => NpmStoreData;
/**
 * 解析插件数据目录。优先级：settings documentPath 目录 → $DSH_HOME → ~/.dsh。
 * 结果进程内缓存（宿主运行期目录不会变化）。
 */
export declare function resolveStoreDir(settingsDocPath?: string): string;
/** 测试用：重置路径缓存。 */
export declare function resetStoreDirCache(): void;
/**
 * 读取数据文件。
 * @returns 有效 store；文件不存在返回 null；损坏时备份为 .bak 并返回 null。
 */
export declare function loadStore(dir: string): Promise<NpmStoreData | null>;
/** 保存数据文件（整体替换）。写操作串行化，避免并发写坏文件。 */
export declare function saveStore(dir: string, store: NpmStoreData): Promise<void>;
//# sourceMappingURL=store.d.ts.map