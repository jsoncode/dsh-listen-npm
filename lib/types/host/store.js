/**
 * dsh-listen-npm —— 插件数据文件存储（$DSH_HOME/dsh-listen-npm.json）。
 *
 * 监控列表与快照历史的唯一持久化源（无敏感数据，明文 JSON）。
 * 路径解析优先级：settings 服务 documentPath 所在目录 → $DSH_HOME 环境变量 →
 * ~/.dsh。不新增 peerDependency（复用 node:fs / node:os）。
 *
 * 写路径为进程内串行队列 + 临时文件 rename 原子写；损坏文件备份为 .bak。
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
/** 数据文件格式版本（预留演进）。 */
export const STORE_VERSION = 1;
export const STORE_FILE = 'dsh-listen-npm.json';
/** 每个包的快照上限（历史时间线防膨胀）。 */
export const SNAPSHOTS_LIMIT = 200;
export const EMPTY_STORE = () => ({ version: STORE_VERSION, watch: [], snapshots: {} });
let cachedDir = null;
/**
 * 解析插件数据目录。优先级：settings documentPath 目录 → $DSH_HOME → ~/.dsh。
 * 结果进程内缓存（宿主运行期目录不会变化）。
 */
export function resolveStoreDir(settingsDocPath) {
    if (cachedDir !== null)
        return cachedDir;
    if (settingsDocPath && settingsDocPath.trim().length > 0) {
        cachedDir = dirname(settingsDocPath);
        return cachedDir;
    }
    const env = process.env.DSH_HOME;
    cachedDir = env && env.trim().length > 0 ? env.trim() : join(homedir(), '.dsh');
    return cachedDir;
}
/** 测试用：重置路径缓存。 */
export function resetStoreDirCache() {
    cachedDir = null;
}
/** 反序列化并校验（字段级兜底，坏条目丢弃而非崩溃）。 */
function openStore(raw) {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object')
        throw new Error('store root must be an object');
    const watch = Array.isArray(parsed.watch)
        ? parsed.watch
            .map((w) => ({
            name: String(w.name || ''),
            addedAt: typeof w.addedAt === 'number' ? w.addedAt : Date.now(),
            lastCheckAt: typeof w.lastCheckAt === 'number' ? w.lastCheckAt : undefined,
            lastVersion: typeof w.lastVersion === 'string' ? w.lastVersion : undefined,
            lastDay: typeof w.lastDay === 'number' ? w.lastDay : undefined,
            lastWeek: typeof w.lastWeek === 'number' ? w.lastWeek : undefined,
            prevDay: typeof w.prevDay === 'number' ? w.prevDay : undefined,
            prevWeek: typeof w.prevWeek === 'number' ? w.prevWeek : undefined,
            hasNewVersion: w.hasNewVersion === true,
            error: typeof w.error === 'string' ? w.error : undefined,
        }))
            .filter((w) => w.name.length > 0)
        : [];
    const snapshots = {};
    if (parsed.snapshots && typeof parsed.snapshots === 'object' && !Array.isArray(parsed.snapshots)) {
        for (const [key, list] of Object.entries(parsed.snapshots)) {
            if (!Array.isArray(list))
                continue;
            const items = [];
            for (const s of list) {
                const o = (s && typeof s === 'object' ? s : {});
                if (typeof o.latest !== 'string')
                    continue;
                items.push({
                    at: typeof o.at === 'number' ? o.at : Date.now(),
                    latest: o.latest,
                    day: typeof o.day === 'number' ? o.day : 0,
                    week: typeof o.week === 'number' ? o.week : 0,
                    note: o.note === 'init' ? 'init' : 'version-change',
                });
            }
            if (items.length > 0)
                snapshots[key] = items.slice(0, SNAPSHOTS_LIMIT);
        }
    }
    return { version: STORE_VERSION, watch, snapshots };
}
/**
 * 读取数据文件。
 * @returns 有效 store；文件不存在返回 null；损坏时备份为 .bak 并返回 null。
 */
export async function loadStore(dir) {
    const target = join(dir, STORE_FILE);
    let raw;
    try {
        raw = await readFile(target, 'utf8');
    }
    catch (e) {
        const err = e;
        if (err && err.code === 'ENOENT')
            return null;
        console.warn(`[dsh-listen-npm] cannot read store file: ${target}`, e instanceof Error ? e.message : String(e));
        return null;
    }
    try {
        return openStore(raw);
    }
    catch (e) {
        try {
            await rename(target, target + '.bak');
        }
        catch { /* 备份失败忽略 */ }
        console.warn(`[dsh-listen-npm] store file corrupt, backed up to .bak and starting empty: ${target}`, e instanceof Error ? e.message : String(e));
        return null;
    }
}
/* ── 原子写（进程内串行队列）──────────────────────────────────── */
let writeChain = Promise.resolve();
function doSave(dir, store) {
    return (async () => {
        await mkdir(dir, { recursive: true });
        const payload = JSON.stringify(store, null, 2);
        const tmp = join(dir, STORE_FILE + '.tmp');
        const target = join(dir, STORE_FILE);
        await writeFile(tmp, payload, { encoding: 'utf8' });
        await rename(tmp, target);
    })();
}
/** 保存数据文件（整体替换）。写操作串行化，避免并发写坏文件。 */
export function saveStore(dir, store) {
    const next = writeChain.then(() => doSave(dir, store));
    writeChain = next.catch(() => { });
    return next;
}
