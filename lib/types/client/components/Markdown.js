import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** 行内 token（交替顺序即优先级：代码 → 加粗 → 斜体 → 删除线 → 图片 → 链接 → 裸链接）。 */
const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|(\*[^*\n]+\*)|((?<![\w])_[^_\n]+_(?!\w))|(~~[^~\n]+~~)|(!\[[^\]]*\]\([^)\s]+\))|(\[[^\]]*\]\([^)\s]+\))|(https?:\/\/[^\s<>()[\]]+)/g;
/** 行内解析：markdown 片段 → React 节点。breaks=true 时单换行渲染为 <br>。 */
function inline(text, breaks = false) {
    const out = [];
    let last = 0;
    let k = 0;
    for (const m of text.matchAll(INLINE)) {
        const idx = m.index ?? 0;
        if (idx > last)
            out.push(...plain(text.slice(last, idx), breaks));
        const tok = m[0];
        if (tok.startsWith('`')) {
            out.push(_jsx("code", { className: "dshn-md-code", children: tok.slice(1, -1) }, k++));
        }
        else if (tok.startsWith('**') || tok.startsWith('__')) {
            out.push(_jsx("strong", { children: inline(tok.slice(2, -2), breaks) }, k++));
        }
        else if (tok.startsWith('~~')) {
            out.push(_jsx("del", { children: inline(tok.slice(2, -2), breaks) }, k++));
        }
        else if (tok.startsWith('*') || tok.startsWith('_')) {
            out.push(_jsx("em", { children: inline(tok.slice(1, -1), breaks) }, k++));
        }
        else if (tok.startsWith('![')) {
            const mm = tok.match(/!\[([^\]]*)\]\(([^)\s]+)\)/);
            if (mm && /^https?:\/\//i.test(mm[2]))
                out.push(_jsx("img", { className: "dshn-md-img", src: mm[2], alt: mm[1], loading: "lazy" }, k++));
            else
                out.push(...plain(tok, breaks));
        }
        else if (tok.startsWith('[')) {
            const mm = tok.match(/\[([^\]]*)\]\(([^)\s]+)\)/);
            if (mm && /^https?:\/\//i.test(mm[2]))
                out.push(_jsx("a", { className: "dshn-md-link", href: mm[2], target: "_blank", rel: "noreferrer", children: inline(mm[1]) }, k++));
            else
                out.push(...plain(tok, breaks));
        }
        else {
            out.push(_jsx("a", { className: "dshn-md-link", href: tok, target: "_blank", rel: "noreferrer", children: tok }, k++));
        }
        last = idx + tok.length;
    }
    if (last < text.length)
        out.push(...plain(text.slice(last), breaks));
    return out;
}
/** 纯文本段：breaks=true 时按 \n 切 <br>（保留 README 常见的手工换行）。 */
function plain(text, breaks) {
    if (!breaks || !text.includes('\n'))
        return [text];
    const out = [];
    text.split('\n').forEach((p, idx) => {
        if (idx > 0)
            out.push(_jsx("br", {}, 'br' + idx));
        if (p.length > 0)
            out.push(p);
    });
    return out;
}
/** 表格分隔行（| --- | :---: |）。 */
const isTableSep = (line) => /^\s*\|?[\s:|-]*-[\s:|-]*\|/.test(line) || /^\s*\|[\s:|-]+$/.test(line);
/** 表格行拆列（容忍首尾竖线与转义竖线的缺失场景）。 */
const splitRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
/** 块级起始判断（段落聚合的终止条件）。 */
function isBlockStart(line, next) {
    if (/^(#{1,6}\s|```|\s*>)/.test(line))
        return true;
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line))
        return true;
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line))
        return true;
    return line.includes('|') && next !== undefined && next.includes('-') && isTableSep(next);
}
/** Markdown 渲染入口：整段文本 → React 元素列表。 */
export function Markdown({ text }) {
    const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    let i = 0;
    let key = 0;
    while (i < lines.length) {
        const line = lines[i];
        // 围栏代码块（``` 或 ~~~）
        if (/^```/.test(line.trim()) || /^~~~/.test(line.trim())) {
            const buf = [];
            i++;
            while (i < lines.length && !/^(```|~~~)\s*$/.test(lines[i].trim())) {
                buf.push(lines[i]);
                i++;
            }
            i++;
            blocks.push(_jsx("pre", { className: "dshn-md-pre", children: _jsx("code", { children: buf.join('\n') }) }, key++));
            continue;
        }
        // 标题（最多渲染到 h4，README 里 h1-h2 过大）
        const h = line.match(/^(#{1,6})\s+(.*)$/);
        if (h) {
            const level = Math.min(h[1].length, 4);
            const Tag = ('h' + level);
            blocks.push(_jsx(Tag, { className: `dshn-md-h dshn-md-h${level}`, children: inline(h[2]) }, key++));
            i++;
            continue;
        }
        // 分隔线
        if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
            blocks.push(_jsx("hr", { className: "dshn-md-hr" }, key++));
            i++;
            continue;
        }
        // 表格（当前行含 | 且下一行是分隔行）
        if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
            const header = splitRow(line);
            i += 2;
            const rows = [];
            while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
                rows.push(splitRow(lines[i]));
                i++;
            }
            blocks.push(_jsxs("table", { className: "dshn-md-table", children: [_jsx("thead", { children: _jsx("tr", { children: header.map((c, ci) => _jsx("th", { children: inline(c) }, ci)) }) }), _jsx("tbody", { children: rows.map((r, ri) => _jsx("tr", { children: r.map((c, ci) => _jsx("td", { children: inline(c) }, ci)) }, ri)) })] }, key++));
            continue;
        }
        // 引用（连续 > 行）
        if (/^\s*>\s?/.test(line)) {
            const buf = [];
            while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
                buf.push(lines[i].replace(/^\s*>\s?/, ''));
                i++;
            }
            blocks.push(_jsx("blockquote", { className: "dshn-md-quote", children: inline(buf.join('\n'), true) }, key++));
            continue;
        }
        // 列表（无序 / 有序；单层）
        if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
            const ordered = /^\s*\d+[.)]\s+/.test(line);
            const items = [];
            while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
                items.push(lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, ''));
                i++;
            }
            const List = ordered ? 'ol' : 'ul';
            blocks.push(_jsx(List, { className: "dshn-md-list", children: items.map((it, ii) => _jsx("li", { children: inline(it, true) }, ii)) }, key++));
            continue;
        }
        // 空行
        if (line.trim() === '') {
            i++;
            continue;
        }
        // 段落（连续非块级行聚合；单换行 → <br>）
        const buf = [];
        while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i], lines[i + 1])) {
            buf.push(lines[i]);
            i++;
        }
        blocks.push(_jsx("p", { className: "dshn-md-p", children: inline(buf.join('\n'), true) }, key++));
    }
    return _jsx("div", { className: "dshn-md", children: blocks });
}
