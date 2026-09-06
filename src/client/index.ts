/**
 * dsh-listen-npm —�?浏览器半边入口（tsdown 打包，对�?dsh-jenkins）�? *
 * 本文件为�?ESM 模块，直接导出插件形�?{ name, inject, apply }�? * window.__ModuleLoader__.load 工厂包装�?tsdown �?banner/intro/footer
 * 在构建时生成（见 tsdown.config.ts）。外部依赖（react /
 * react/jsx-runtime / react-dom）构建时保持 external，运行时�?factory
 * �?require 解析宿主模块表（seed）�? */

import { createPlugin } from './plugin.tsx'

const plugin = createPlugin()

export const name = plugin.name
export const inject = plugin.inject
export const apply = plugin.apply
export type { ClientPluginModule, ClientCtx } from './plugin.tsx'
