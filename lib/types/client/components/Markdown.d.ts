/**
 * dsh-listen-npm —— 极简 Markdown 渲染（README 摘要用）。
 *
 * 零依赖、免 XSS：块级解析（标题 / 围栏代码 / 引用 / 列表 / 表格 / 分隔线 /
 * 段落）+ 行内解析（行内代码 / 加粗 / 斜体 / 删除线 / 链接 / 图片 / 自动链接）。
 * 全部产出 React 元素（不使用 dangerouslySetInnerHTML），文本节点经 React
 * 转义，README 中的原始 HTML 不会被执行；链接只放行 http(s)。
 * npm README 以 GFM 为主，这里覆盖常见结构，未覆盖的语法按纯文本降级。
 */
/** Markdown 渲染入口：整段文本 → React 元素列表。 */
export declare function Markdown({ text }: {
    text: string;
}): import("react").JSX.Element;
//# sourceMappingURL=Markdown.d.ts.map