/**
 * dsh-listen-npm —�?日安装量柱状图（�?SVG，无第三方图表依赖）�? *
 * 设计要点�? * - 数据�?npm 下载量日粒度序列（近 30 天，时间正序）；
 * - 突出显示：最新一天绿色柱（today �?T+1 数据）、峰值柱描金 + 顶部标注�? *   日均值虚�?+ 右侧标注�? * - 主题自适应：颜色全部走 CSS 类（styles.ts），深浅色模式跟随宿主；
 * - 每根柱带 <title> 原生 tooltip（日�?+ 精确下载量）�? */

import type { DailyPoint } from '../types.ts'
import { fmtCompact, fmtInt } from '../format.ts'
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
  if (!data || data.length === 0) {
    return <div className="dshn-empty">{t('versionsEmpty')}</div>
  }
  const values = data.map((p) => p.downloads)
  const max = Math.max(...values, 1)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const peakIdx = values.indexOf(Math.max(...values))
  const lastIdx = data.length - 1

  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const slot = plotW / data.length
  const barW = Math.max(2, Math.min(18, slot * 0.72))
  const yOf = (v: number): number => PAD_T + plotH - (v / max) * plotH
  const xOf = (i: number): number => PAD_L + slot * i + (slot - barW) / 2

  // y �?3 条网格线�? / ½max / max），标签紧凑�?  const gridVals = [max, max / 2, 0]

  // x 轴稀疏标注：�?/ �?/ �?  const xTicks = data.length >= 3
    ? [0, Math.floor((data.length - 1) / 2), data.length - 1]
    : data.map((_, i) => i)

  return (
    <svg className="dshn-chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('dailyChartTitle')}>
      {/* 网格�?+ y 轴标�?*/}
      {gridVals.map((v, i) => {
        const y = yOf(v)
        return (
          <g key={i}>
            <line className="dshn-chart-grid" x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} />
            <text className="dshn-chart-text" x={PAD_L - 6} y={y + 3} textAnchor="end">{fmtCompact(v)}</text>
          </g>
        )
      })}
      {/* 日均�?*/}
      {avg > 0 && avg < max ? (
        <g>
          <line className="dshn-chart-avg" x1={PAD_L} y1={yOf(avg)} x2={W - PAD_R} y2={yOf(avg)} />
          <text className="dshn-chart-text" x={W - PAD_R - 2} y={yOf(avg) - 4} textAnchor="end">
            {t('dailyAvg')} {fmtCompact(avg)}
          </text>
        </g>
      ) : null}
      {/* 柱体（hover 原生 tooltip�?/}
      {data.map((p, i) => {
        const y = yOf(p.downloads)
        const h = Math.max(1, PAD_T + plotH - y)
        const cls = 'dshn-chart-bar'
          + (i === lastIdx ? ' dshn-chart-bar-last' : '')
          + (i === peakIdx ? ' dshn-chart-bar-peak' : '')
        return (
          <rect
            key={p.day}
            className={cls}
            x={xOf(i)}
            y={y}
            width={barW}
            height={h}
            rx={Math.min(3, barW / 2)}
          >
            <title>{`${p.day} · ${fmtInt(p.downloads)}${i === peakIdx ? ' · ' + t('peakDay') : ''}`}</title>
          </rect>
        )
      })}
      {/* 峰值标注（峰值柱非最后一根时，柱顶标注数值）*/}
      {peakIdx !== -1 && peakIdx !== lastIdx && data[peakIdx].downloads > 0 ? (
        <text className="dshn-chart-text" x={xOf(peakIdx) + barW / 2} y={yOf(data[peakIdx].downloads) - 5} textAnchor="middle">
          {fmtCompact(data[peakIdx].downloads)}
        </text>
      ) : null}
      {/* x 轴日期标�?*/}
      {xTicks.map((i) => {
        const day = data[i].day
        return (
          <text
            key={i}
            className="dshn-chart-text"
            x={xOf(i) + barW / 2}
            y={H - 8}
            textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
          >
            {day.slice(5)}
          </text>
        )
      })}
    </svg>
  )
}
