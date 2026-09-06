/**
 * dsh-listen-npm —— 极简 Markdown 渲染（README 摘要用）。
 *
 * 零依赖、免 XSS：块级解析（标题 / 围栏代码 / 引用 / 列表 / 表格 / 分隔线 /
 * 段落）+ 行内解析（行内代码 / 加粗 / 斜体 / 删除线 / 链接 / 图片 / 自动链接）。
 * 全部产出 React 元素（不使用 dangerouslySetInnerHTML），文本节点经 React
 * 转义，README 中的原始 HTML 不会被执行；链接只放行 http(s)。
 * npm README 以 GFM 为主，这里覆盖常见结构，未覆盖的语法按纯文本降级。
 */

import type { ReactNode } from 'react'

/** 行内 token（交替顺序即优先级：代码 → 加粗 → 斜体 → 删除线 → 图片 → 链接 → 裸链接）。 */
const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|(\*[^*\n]+\*)|((?<![\w])_[^_\n]+_(?!\w))|(~~[^~\n]+~~)|(!\[[^\]]*\]\([^)\s]+\))|(\[[^\]]*\]\([^)\s]+\))|(https?:\/\/[^\s<>()[\]]+)/g

/** 行内解析：markdown 片段 → React 节点。breaks=true 时单换行渲染为 <br>。 */
function inline(text: string, breaks = false): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let k = 0
  for (const m of text.matchAll(INLINE)) {
    const idx = m.index ?? 0
    if (idx > last) out.push(...plain(text.slice(last, idx), breaks))
    const tok = m[0]
    if (tok.startsWith('`')) {
      out.push(<code key={k++} className="dshn-md-code">{tok.slice(1, -1)}</code>)
    } else if (tok.startsWith('**') || tok.startsWith('__')) {
      out.push(<strong key={k++}>{inline(tok.slice(2, -2), breaks)}</strong>)
    } else if (tok.startsWith('~~')) {
      out.push(<del key={k++}>{inline(tok.slice(2, -2), breaks)}</del>)
    } else if (tok.startsWith('*') || tok.startsWith('_')) {
      out.push(<em key={k++}>{inline(tok.slice(1, -1), breaks)}</em>)
    } else if (tok.startsWith('![')) {
      const mm = tok.match(/!\[([^\]]*)\]\(([^)\s]+)\)/)
      if (mm && /^https?:\/\//i.test(mm[2])) out.push(<img key={k++} className="dshn-md-img" src={mm[2]} alt={mm[1]} loading="lazy" />)
      else out.push(...plain(tok, breaks))
    } else if (tok.startsWith('[')) {
      const mm = tok.match(/\[([^\]]*)\]\(([^)\s]+)\)/)
      if (mm && /^https?:\/\//i.test(mm[2])) out.push(<a key={k++} className="dshn-md-link" href={mm[2]} target="_blank" rel="noreferrer">{inline(mm[1])}</a>)
      else out.push(...plain(tok, breaks))
    } else {
      out.push(<a key={k++} className="dshn-md-link" href={tok} target="_blank" rel="noreferrer">{tok}</a>)
    }
    last = idx + tok.length
  }
  if (last < text.length) out.push(...plain(text.slice(last), breaks))
  return out
}

/** 纯文本段：breaks=true 时按 \n 切 <br>（保留 README 常见的手工换行）。 */
function plain(text: string, breaks: boolean): ReactNode[] {
  if (!breaks || !text.includes('\n')) return [text]
  const out: ReactNode[] = []
  text.split('\n').forEach((p, idx) => {
    if (idx > 0) out.push(<br key={'br' + idx} />)
    if (p.length > 0) out.push(p)
  })
  return out
}

/** 表格分隔行（| --- | :---: |）。 */
const isTableSep = (line: string): boolean => /^\s*\|?[\s:|-]*-[\s:|-]*\|/.test(line) || /^\s*\|[\s:|-]+$/.test(line)

/** 表格行拆列（容忍首尾竖线与转义竖线的缺失场景）。 */
const splitRow = (line: string): string[] =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())

/** 块级起始判断（段落聚合的终止条件）。 */
function isBlockStart(line: string, next: string | undefined): boolean {
  if (/^(#{1,6}\s|```|\s*>)/.test(line)) return true
  if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) return true
  if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) return true
  return line.includes('|') && next !== undefined && next.includes('-') && isTableSep(next)
}

/** Markdown 渲染入口：整段文本 → React 元素列表。 */
export function Markdown({ text }: { text: string }) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let key = 0
  while (i < lines.length) {
    const line = lines[i]
    // 围栏代码块（``` 或 ~~~）
    if (/^```/.test(line.trim()) || /^~~~/.test(line.trim())) {
      const buf: string[] = []
      i++
      while (i < lines.length && !/^(```|~~~)\s*$/.test(lines[i].trim())) { buf.push(lines[i]); i++ }
      i++
      blocks.push(<pre key={key++} className="dshn-md-pre"><code>{buf.join('\n')}</code></pre>)
      continue
    }
    // 标题（最多渲染到 h4，README 里 h1-h2 过大）
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      const level = Math.min(h[1].length, 4)
      const Tag = ('h' + level) as 'h1' | 'h2' | 'h3' | 'h4'
      blocks.push(<Tag key={key++} className={`dshn-md-h dshn-md-h${level}`}>{inline(h[2])}</Tag>)
      i++
      continue
    }
    // 分隔线
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push(<hr key={key++} className="dshn-md-hr" />)
      i++
      continue
    }
    // 表格（当前行含 | 且下一行是分隔行）
    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitRow(line)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') { rows.push(splitRow(lines[i])); i++ }
      blocks.push(
        <table key={key++} className="dshn-md-table">
          <thead><tr>{header.map((c, ci) => <th key={ci}>{inline(c)}</th>)}</tr></thead>
          <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci}>{inline(c)}</td>)}</tr>)}</tbody>
        </table>,
      )
      continue
    }
    // 引用（连续 > 行）
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++ }
      blocks.push(<blockquote key={key++} className="dshn-md-quote">{inline(buf.join('\n'), true)}</blockquote>)
      continue
    }
    // 列表（无序 / 有序；单层）
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line)
      const items: string[] = []
      while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, '')); i++ }
      const List = ordered ? 'ol' : 'ul'
      blocks.push(<List key={key++} className="dshn-md-list">{items.map((it, ii) => <li key={ii}>{inline(it, true)}</li>)}</List>)
      continue
    }
    // 空行
    if (line.trim() === '') { i++; continue }
    // 段落（连续非块级行聚合；单换行 → <br>）
    const buf: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i], lines[i + 1])) { buf.push(lines[i]); i++ }
    blocks.push(<p key={key++} className="dshn-md-p">{inline(buf.join('\n'), true)}</p>)
  }
  return <div className="dshn-md">{blocks}</div>
}
