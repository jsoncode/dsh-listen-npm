/**
 * dsh-listen-npm —— 插件 logo。
 *
 * npm 品牌红（#CB3837）圆角方块 + 白色 "npm" 字样，以 data URI 内联，
 * 不依赖宿主静态资源路由（bundle 内自包含）。使用 encodeURIComponent 形式
 * （而非 btoa），在任意宿主环境（含受限沙箱）都可用。
 *
 * 必须带 width/height 属性：只有 viewBox 的 SVG 没有固有尺寸，作为 <img> 时
 * 浏览器按替换元素默认尺寸（300×150）渲染 —— 一旦 CSS 类失效图标就会撑爆按钮。
 */
/** footer 入口按钮图标（data URI，自包含，固有尺寸 64×64）。 */
export declare const NPM_LOGO: string;
/**
 * 图标内联尺寸样式：CSS 类失效（宿主样式覆盖 / style 标签被回收）时仍能保证
 * 图标不撑破布局 —— 内联样式优先级最高，且是标签自带属性，不依赖任何样式表。
 */
export declare const logoStyle: (size: number) => {
    width: number;
    height: number;
    maxWidth: number;
    maxHeight: number;
    flex: "none";
    display: "block";
    objectFit: "contain";
};
//# sourceMappingURL=logo.d.ts.map