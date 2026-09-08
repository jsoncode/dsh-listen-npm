/**
 * dsh-listen-npm —— 浏览器半边：样式注入（dshn- 前缀，与 dsh-jenkins 同一
 * 的 bundle CSS 注入模式；设计令牌复用宿主 --dsw-alias-* 变量，深浅色自适应）。
 */
export declare const css: string[];
/**
 * 幂等注入样式。
 *
 * 关键：style 标签必须自带 data-plugin / data-plugin-css 标记（对齐宿主自带的
 * CSS 注入形态）。宿主的 client-modules 在**物化每个插件**时会执行
 * `claimStyles(id)`：把 `style:not([data-plugin])` 全部认领给当前物化的插件；
 * 而 client-hmr 重载某插件时执行 `removeOwnedStyles(id)`：删除所有
 * `style[data-plugin=id]`。本插件的 apply 在物化之后才跑，裸 style 标签会被
 * **下一个**物化的插件认领 —— 那个插件一热重载，本插件的 CSS 就被连带删除，
 * 于是 footerAction 图标失去 `.dshn-footer-logo` 尺寸规则、退回 SVG 的默认
 * 替换元素尺寸（300×150）把按钮撑爆。预打标记后谁都不会误认领/误删。
 *
 * 同时做成可重复调用的看门狗：内容一致时零成本短路，标签缺失时补回。
 */
export declare function injectStyles(): void;
//# sourceMappingURL=styles.d.ts.map