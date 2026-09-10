/**
 * dsh-listen-npm —— 日安装量柱状图（纯 SVG，无第三方图表依赖）。
 *
 * 设计要点：
 * - 数据为 npm 下载量日粒度序列（近 30 天，时间正序，日历连续 —— 宿主已把
 *   区间内漏报日与尾部 npm 尚未统计的日子补成 0）；尾部补 0 的 pending 柱用
 *   灰色 + 虚线描边画出来，tooltip 标注「npm 尚未统计」，一眼能看出是延迟而不是
 *   数据缺失；
 * - 突出显示：最后一个「真实数据日」绿色柱、峰值柱描金 + 顶部标注、日均值虚线
 *   —— 峰值 / 日均 / y 轴只统计真实数据段，不被延迟的 0 拉低；
 * - 主题自适应：颜色全部走 CSS 类（styles.ts），深浅色模式跟随宿主；
 * - 每根柱带 <title> 原生 tooltip（日期 + 精确下载量）。
 */

import type { DailyPoint } from '../types.ts'
import { fmtCompact, fmtInt, seriesOf } from '../format.ts'
import { t } from '../i18n.ts'

export interface DownloadChartProps {
  data: DailyPoint[]
}

const W = 720
const H = 240
const PAD_L = 52
const PAD_R = 10
const PAD_T = 20
const PAD_B = 24

export function DownloadChart({ data }: DownloadChartProps) {
  const series = seriesOf(data)
  if (series.all.length === 0) {
    return <div className="dshn-empty">{t('versionsEmpty')}</div>
  }
  const all = series.all

  // 真实数据段的下标：最后一根真实柱（绿色高亮）与峰值柱（描金 + 数值标注）。
  // pending 段只是延迟补的 0，不参与峰值 / 日均 / y 轴尺度。
  let realLastIdx = -1
  let realPeakIdx = -1
  let peakValue = 0
  let realTotal = 0
  let realCount = 0
  for (let i = 0; i < all.length; i++) {
    const p = all[i]
    if (p.pending === true) continue
    realLastIdx = i
    realTotal += p.downloads
    realCount++
    if (p.downloads > peakValue) {
      peakValue = p.downloads
      realPeakIdx = i
    }
  }
  const max = Math.max(peakValue, 1)
  const avg = realCount > 0 ? realTotal / realCount : 0

  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const slot = plotW / all.length
  const barW = Math.max(2, Math.min(18, slot * 0.72))
  const yOf = (v: number): number => PAD_T + plotH - (v / max) * plotH
  const xOf = (i: number): number => PAD_L + slot * i + (slot - barW) / 2

  // y 轴 3 条网格线（0 / ½max / max），标签紧凑化
  const gridVals = [max, max / 2, 0]

  // x 轴稀疏标注：首 / 中 / 尾
  const xTicks = all.length >= 3
    ? [0, Math.floor((all.length - 1) / 2), all.length - 1]
    : all.map((_, i) => i)

  // 真实段 / 待统计段的分界虚线（横坐标：最后一根真实柱右侧的空隙中点）
  const splitX = realLastIdx >= 0 ? PAD_L + slot * (realLastIdx + 1) : 0

  return (
    <svg className="dshn-chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('dailyChartTitle')}>
      {/* 网格线 + y 轴标签 */}
      {gridVals.map((v, i) => {
        const y = yOf(v)
        return (
          <g key={i}>
            <line className="dshn-chart-grid" x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} />
            <text className="dshn-chart-text" x={PAD_L - 6} y={y + 3} textAnchor="end">{fmtCompact(v)}</text>
          </g>
        )
      })}
      {/* 日均线（真实数据段）*/}
      {avg > 0 && avg < max ? (
        <g>
          <line className="dshn-chart-avg" x1={PAD_L} y1={yOf(avg)} x2={W - PAD_R} y2={yOf(avg)} />
          <text className="dshn-chart-text" x={W - PAD_R - 2} y={yOf(avg) - 4} textAnchor="end">
            {t('dailyAvg')} {fmtCompact(avg)}
          </text>
        </g>
      ) : null}
      {/* 真实段 / 待统计段分界 */}
      {series.lagDays > 0 && realLastIdx >= 0 ? (
        <line className="dshn-chart-split" x1={splitX} y1={PAD_T} x2={splitX} y2={PAD_T + plotH} />
      ) : null}
      {/* 柱体（hover 原生 tooltip）*/}
      {all.map((p, i) => {
        const pending = p.pending === true
        const h = pending ? 2 : Math.max(1, PAD_T + plotH - yOf(p.downloads))
        const cls = 'dshn-chart-bar'
          + (pending ? ' dshn-chart-bar-pending' : '')
          + (!pending && i === realLastIdx ? ' dshn-chart-bar-last' : '')
          + (!pending && i === realPeakIdx ? ' dshn-chart-bar-peak' : '')
        const tip = pending
          ? `${p.day} · ${t('noDataYet')}`
          : `${p.day} · ${fmtInt(p.downloads)}${i === realPeakIdx ? ' · ' + t('peakDay') : ''}`
        return (
          <rect
            key={p.day}
            className={cls}
            x={xOf(i)}
            y={PAD_T + plotH - h}
            width={barW}
            height={h}
            rx={Math.min(3, barW / 2)}
          >
            <title>{tip}</title>
          </rect>
        )
      })}
      {/* 峰值标注（峰值柱非最后一根真实柱时，柱顶标注数值）*/}
      {realPeakIdx >= 0 && realPeakIdx !== realLastIdx ? (
        <text className="dshn-chart-text" x={xOf(realPeakIdx) + barW / 2} y={yOf(all[realPeakIdx].downloads) - 5} textAnchor="middle">
          {fmtCompact(all[realPeakIdx].downloads)}
        </text>
      ) : null}
      {/* x 轴日期标注 */}
      {xTicks.map((i) => {
        const day = all[i].day
        return (
          <text
            key={i}
            className="dshn-chart-text"
            x={xOf(i) + barW / 2}
            y={H - 8}
            textAnchor={i === 0 ? 'start' : i === all.length - 1 ? 'end' : 'middle'}
          >
            {day.slice(5)}
          </text>
        )
      })}
    </svg>
  )
}
