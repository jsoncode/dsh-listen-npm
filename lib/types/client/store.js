/**
 * dsh-listen-npm —— 浏览器半边：弹框开关 + footer 胶囊摘要（footer 入口 ↔ overlay 弹框共享）。
 */
import { useEffect, useState } from 'react';
function createStore(initial) {
    const store = {
        value: initial,
        listeners: [],
        emit() { for (let i = 0; i < this.listeners.length; i++)
            this.listeners[i](); },
        subscribe(l) { this.listeners.push(l); return () => { const i = this.listeners.indexOf(l); if (i >= 0)
            this.listeners.splice(i, 1); }; },
    };
    return store;
}
function useStoreValue(target) {
    const [v, setV] = useState(target.value);
    useEffect(() => target.subscribe(() => setV(target.value)), [target]);
    return v;
}
export function makeModalStore() {
    const store = createStore(false);
    return {
        useOpen: () => useStoreValue(store),
        open: () => { store.value = true; store.emit(); },
        close: () => { store.value = false; store.emit(); },
    };
}
export function makeSummaryStore() {
    const store = createStore({ watching: 0, newVersions: 0 });
    return {
        set: (s) => { store.value = s; store.emit(); },
        useSummary: () => useStoreValue(store),
    };
}
export function makeNumberStore(initial) {
    const store = createStore(initial);
    return {
        set: (n) => { if (store.value === n)
            return; store.value = n; store.emit(); },
        use: () => useStoreValue(store),
    };
}
