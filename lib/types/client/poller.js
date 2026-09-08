/**
 * dsh-listen-npm —— 浏览器半边：监控列表后台轮询器。
 *
 * 与弹框生命周期解耦：关闭弹框后仍按配置间隔（宿主 config op 下发的
 * refreshMinutes）调用宿主 watchRefresh，让监控列表持续跟踪版本与下载量变化。
 * 变化结果写入摘要 store（footer 胶囊）与本地缓存（监控 tab 首屏直接可读）。
 *
 * 空闲不请求：无监控包或未到刷新间隔时 tick 直接短路。
 */
import { tErr } from "./i18n.js";
const DEFAULT_REFRESH_MINUTES = 10;
export function createPoller(run, summary) {
    let refreshMinutes = DEFAULT_REFRESH_MINUTES;
    let lastRefreshAt = 0;
    let busy = false;
    let booted = false;
    let dirty = false;
    let errorText = '';
    let cachedWatch = [];
    let currentSummary = { watching: 0, newVersions: 0 };
    const listeners = [];
    const emit = () => { for (const l of listeners)
        l(); };
    const applyWatch = (watch) => {
        cachedWatch = watch;
        currentSummary = {
            watching: watch.length,
            newVersions: watch.filter((w) => w.hasNewVersion === true).length,
        };
        summary.set(currentSummary);
        emit();
    };
    const doRefresh = async () => {
        if (busy)
            return;
        if (cachedWatch.length === 0 && !dirty)
            return;
        busy = true;
        try {
            const res = await run('', { op: 'watchRefresh' });
            if (res && res.ok && Array.isArray(res.watch)) {
                lastRefreshAt = Date.now();
                errorText = '';
                dirty = false;
                applyWatch(res.watch);
            }
            else {
                errorText = tErr(res, res && res.error ? String(res.error) : '');
                emit();
            }
        }
        catch (e) {
            errorText = e instanceof Error ? e.message : String(e);
            emit();
        }
        finally {
            busy = false;
        }
    };
    const loadWatch = async () => {
        try {
            const res = await run('', { op: 'watchList' });
            if (res && res.ok && Array.isArray(res.watch))
                applyWatch(res.watch);
        }
        catch { /* 宿主不可用：保持空 */ }
    };
    return {
        refresh: () => { dirty = true; return doRefresh(); },
        tick() {
            if (busy)
                return;
            if (dirty) {
                void doRefresh();
                return;
            }
            if (cachedWatch.length === 0)
                return;
            if (Date.now() - lastRefreshAt < refreshMinutes * 60 * 1000)
                return;
            void doRefresh();
        },
        bootstrap() {
            if (booted)
                return;
            booted = true;
            void (async () => {
                try {
                    const cfg = await run('', { op: 'config' });
                    if (cfg && cfg.ok && typeof cfg.refreshMinutes === 'number' && cfg.refreshMinutes > 0) {
                        refreshMinutes = cfg.refreshMinutes;
                    }
                }
                catch { /* 用默认间隔 */ }
                await loadWatch();
            })();
        },
        getSummary: () => currentSummary,
        subscribe(fn) {
            listeners.push(fn);
            return () => { const i = listeners.indexOf(fn); if (i >= 0)
                listeners.splice(i, 1); };
        },
        getWatch: () => cachedWatch,
        markSeen() {
            const has = cachedWatch.some((w) => w.hasNewVersion === true);
            if (!has)
                return;
            applyWatch(cachedWatch.map((w) => (w.hasNewVersion === true ? { ...w, hasNewVersion: false } : w)));
            void run('', { op: 'watchSeen' }).catch(() => { });
        },
        invalidate() {
            dirty = true;
            void loadWatch();
        },
        lastError: () => errorText,
        lastRefreshAt: () => lastRefreshAt,
    };
}
