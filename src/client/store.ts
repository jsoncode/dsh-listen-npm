/**
 * dsh-listen-npm —�?浏览器半边：弹框开�?+ footer 胶囊摘要（footer 入口 �?overlay 弹框共享）�? */

import { useEffect, useState } from 'react'

export interface StoreState<T> {
  value: T
  listeners: Array<() => void>
  emit(): void
  subscribe(l: () => void): () => void
}

function createStore<T>(initial: T): StoreState<T> {
  const store: StoreState<T> = {
    value: initial,
    listeners: [],
    emit() { for (let i = 0; i < this.listeners.length; i++) this.listeners[i]() },
    subscribe(l) { this.listeners.push(l); return () => { const i = this.listeners.indexOf(l); if (i >= 0) this.listeners.splice(i, 1) } },
  }
  return store
}

function useStoreValue<T>(target: StoreState<T>): T {
  const [v, setV] = useState<T>(target.value)
  useEffect(() => target.subscribe(() => setV(target.value)), [target])
  return v
}

/** 弹框打开状态：footer 入口 open，overlay 弹框消费�?*/
export interface ModalStore {
  useOpen(): boolean
  open(): void
  close(): void
}

export function makeModalStore(): ModalStore {
  const store = createStore<boolean>(false)
  return {
    useOpen: () => useStoreValue(store),
    open: () => { store.value = true; store.emit() },
    close: () => { store.value = false; store.emit() },
  }
}

/** footer 胶囊摘要：监控数�?+ 有新版本的包数量（来自后台轮询器）�?*/
export interface WatchSummary {
  watching: number
  newVersions: number
}

export interface SummaryStore {
  set(summary: WatchSummary): void
  useSummary(): WatchSummary
}

export function makeSummaryStore(): SummaryStore {
  const store = createStore<WatchSummary>({ watching: 0, newVersions: 0 })
  return {
    set: (s) => { store.value = s; store.emit() },
    useSummary: () => useStoreValue(store),
  }
}

/** 数�?store（宿�?config op �?refreshMinutes 下发通道）�?*/
export interface NumberStore {
  set(n: number): void
  use(): number
}

export function makeNumberStore(initial: number): NumberStore {
  const store = createStore<number>(initial)
  return {
    set: (n) => { if (store.value === n) return; store.value = n; store.emit() },
    use: () => useStoreValue(store),
  }
}
