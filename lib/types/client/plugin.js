import { jsx as _jsx } from "react/jsx-runtime";
import { injectStyles } from "./styles.js";
import { makeRun } from "./rpc.js";
import { makeModalStore, makeNumberStore, makeSummaryStore } from "./store.js";
import { createPoller } from "./poller.js";
import { FooterButton } from "./components/FooterButton.js";
import { PluginSettingsPage } from "./components/PluginSettingsPage.js";
import { NpmModal } from "./components/NpmModal.js";
import { t, setLang } from "./i18n.js";
/** 侧边栏 footer 插槽 key 与本插件入口 id。 */
const FOOTER_SLOT = 'sidebar.footer.action';
const FOOTER_ENTRY_ID = 'dsh-listen-npm';
const OVERLAY_ID = 'dsh-listen-npm';
/** 宿主设置对话框里本插件分区页的注册 id（settings.section 的 only 过滤键）。 */
const SECTION_ID = 'dsh-listen-npm';
export function createPlugin() {
    return {
        name: 'dsh-listen-npm',
        inject: ['slots', 'remote', 'remote.commands', 'timer'],
        apply(ctx) {
            const toLang = (active) => (/^zh/i.test(active) ? 'zh' : 'en');
            const locale = ctx.get('locale');
            if (locale !== undefined) {
                const syncLang = () => { setLang(toLang(locale.getSnapshot().active)); };
                syncLang();
                locale.subscribe(syncLang);
            }
            else if (typeof ctx.on === 'function') {
                ctx.on('locale/change', (snapshot) => {
                    const active = snapshot?.active;
                    if (typeof active === 'string')
                        setLang(toLang(active));
                });
            }
            const run = makeRun(ctx);
            const slots = ctx.get('slots');
            if (slots === undefined)
                return;
            injectStyles();
            // ─── 共享状态 ────────────────────────────────────────────────
            const { useOpen, open: openModal, close: closeModal } = makeModalStore();
            const summaryStore = makeSummaryStore();
            const refreshMinutesStore = makeNumberStore(10);
            // 当前会话 id 追踪：footer 入口挂载时上报（命令通道回退用）。
            const sessionRef = { current: '' };
            const getSession = () => sessionRef.current;
            // 包装 run：调用方未传会话 id（''）时回退到已追踪的会话 id。
            const runWithSession = (sessionId, op) => run(sessionId || getSession(), op);
            // ─── 后台轮询器：监控列表自动刷新 + footer 摘要 ───────────────
            // 启动引导拉取 config（刷新间隔）与当前监控列表；到点自动 watchRefresh。
            const poller = createPoller(runWithSession, summaryStore);
            // 3s 心跳：轮询器到点刷新监控列表；同时兼作样式看门狗 —— 宿主 client-hmr
            // 重载插件时会回收本插件的 <style>（data-plugin 归属），此处按需补回。
            ctx.interval(() => {
                injectStyles();
                poller.tick();
            }, 3000);
            poller.bootstrap();
            void runWithSession('', { op: 'config' }).then((cfg) => {
                if (cfg && cfg.ok && typeof cfg.refreshMinutes === 'number' && cfg.refreshMinutes > 0) {
                    refreshMinutesStore.set(cfg.refreshMinutes);
                }
            }).catch(() => { });
            // ─── 对话中的命令行：兜底不渲染内部 JSON 结果 ─────────────────
            try {
                slots.inject('conversation.chat.commandview', () => slots.register({ name: 'conversation.chat.commandview', key: 'dsh-listen-npm', priority: 0 }, () => null));
            }
            catch { /* 插槽未声明时静默降级（通用命令卡片渲染） */ }
            // ─── 侧边栏底部入口：常驻「npm 监控」按钮 ─────────────────────
            // order: 21 —— 排在 dsh-jenkins（order 20）之后，宿主按声明 order 升序渲染。
            slots.inject(FOOTER_SLOT, () => slots.register({ name: FOOTER_SLOT, id: FOOTER_ENTRY_ID, order: 21 }, (props) => (_jsx(FooterButton, { onOpen: openModal, reportSession: (s) => { if (s)
                    sessionRef.current = s; }, wide: props.wide, useSessions: props.useSessions, poller: poller }))));
            // ─── 宿主「设置 → npm 监控」分区页（settings.section）──────────
            // 页面承载「在菜单中显示」开关（与 footer 入口同一偏好源）+ 打开插件
            // 弹框的入口：侧栏入口被关闭后，这里是唯一可达入口。order 43 排在宿主
            // 内置 sections 与 dsh-jenkins（order 41）之后；label 用本插件既有的
            // 导航文案 key（与 footer 入口同名，跟随界面语言）。
            slots.inject('settings.section', () => slots.register({
                name: 'settings.section',
                id: SECTION_ID,
                order: 43,
                label: () => t('configBtn'),
            }, (props) => (_jsx(PluginSettingsPage, { onOpen: openModal, close: typeof props.close === 'function' ? props.close : () => { } }))));
            // ─── 统一「npm 包监控」弹框（查询 / 监控 / 历史 三个 tab）──────
            slots.inject('shell.overlay', () => slots.register({ name: 'shell.overlay', id: OVERLAY_ID, order: 100 }, () => (_jsx(NpmModal, { run: runWithSession, useOpen: useOpen, close: closeModal, poller: poller, useSummary: summaryStore.useSummary, useRefreshMinutes: refreshMinutesStore.use }))));
        },
    };
}
