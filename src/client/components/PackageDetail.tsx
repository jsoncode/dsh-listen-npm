/**
 * dsh-listen-npm —�?包详情视图（查询 tab 主体）�? *
 * 布局：头部（名称/版本/许可�?操作）→ 描述与链�?�?下载量卡片（突出显示�? * 昨日/�?�?�?0�?近一�?+ 每日安装量柱状图）→ 基本信息 �?dist-tags �? * 依赖 �?版本列表 �?README 摘要�? */

import { useState } from 'react'
import type { InfoResponse } from '../types.ts'
import { t } from '../i18n.ts'
import { fmtBytes, fmtCompact, fmtDate, fmtDateTime, fmtInt } from '../format.ts'
import { DownloadChart } from './DownloadChart.tsx'

export interface PackageDetailProps {
  /** info op 完整响应�?*/
  res: InfoResponse
  /** 是否已在监控列表中�?*/
  watched: boolean
  /** 加入监控回调（busy 状态由父组件控制）�?*/
  onWatch(): void
  watchBusy?: boolean
  /** 加入监控后的提示（成�?失败文本）�?*/
  notice?: string
}

/** 拼一行链接（无值时跳过）�?*/
function Links({ res }: { res: InfoResponse }) {
  const info = res.info
  if (!info) return null
  const npmPage = 'https://www.npmjs.com/package/' + encodeURIComponent(info.name).replace('%40', '@')
  const links: Array<{ label: string; href: string }> = []
  if (info.homepage) links.push({ label: t('homepage'), href: info.homepage })
  if (info.repository) links.push({ label: t('repository'), href: info.repository })
  if (info.bugs) links.push({ label: t('issues'), href: info.bugs })
  if (info.latestDetail?.tarball) links.push({ label: t('tarball'), href: info.latestDetail.tarball })
  links.push({ label: t('npmPage'), href: npmPage })
  return (
    <div className="dshn-detail-links">
      {links.map((l) => (
        <a key={l.label + l.href} className="dshn-link" href={l.href} target="_blank" rel="noreferrer">{l.label} �?/a>
      ))}
    </div>
  )
}

/** 依赖块（无依赖显示「无」）�?*/
function DepBlock({ title, deps }: { title: string; deps?: Record<string, string> }) {
  const entries = deps ? Object.entries(deps) : []
  return (
    <div>
      <div className="dshn-meta-key" style={{ textAlign: 'left', width: 'auto' }}>{title}</div>
      {entries.length === 0
        ? <div className="dshn-dep-list">{t('depsNone')}</div>
        : (
          <div className="dshn-dep-list">
            {entries.map(([k, v]) => (
              <code key={k}><b>{k}</b>@{v}</code>
            ))}
          </div>
        )}
    </div>
  )
}

export function PackageDetail({ res, watched, onWatch, watchBusy, notice }: PackageDetailProps) {
  const [readmeOpen, setReadmeOpen] = useState(false)
  const info = res.info
  if (!res.ok || !info) {
    return <div className="dshn-err">{t('queryFailed')}: {res.error || res.code || ''}</div>
  }
  const p = res.points
  const daily = res.daily || []
  const detail = info.latestDetail
  const versionRows = info.versions || []

  return (
    <div>
      {/* ── 头部 ── */}
      <div className="dshn-detail-head">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="dshn-detail-name">
            {info.name}
            <span className="dshn-detail-ver">
              {info.latest ? <span className="dshn-chip dshn-chip-latest">{t('latestVersion')} {info.latest}</span> : null}
              {info.license ? <span className="dshn-chip">{info.license}</span> : null}
            </span>
          </div>
          <div className="dshn-detail-desc">{info.description || t('noDescription')}</div>
          <Links res={res} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <button type="button" className="dshn-btn dshn-btn-small" disabled={watched || watchBusy} onClick={onWatch}>
            {watched ? t('watching') : t('watchThis')}
          </button>
        </div>
      </div>
      {notice ? <div className={notice.startsWith('!') ? 'dshn-err' : 'dshn-ok'}>{notice.startsWith('!') ? notice.slice(1) : notice}</div> : null}

      {/* ── 下载量卡片（突出显示）── */}
      <div className="dshn-card">
        <div className="dshn-card-title">
          {t('downloadsTitle')}
          <span className="dshn-hint">
            {t('rangeLabel')} {res.rangeStart || '�?} ~ {res.rangeEnd || '�?}
          </span>
        </div>
        <div className="dshn-stats">
          <div className="dshn-stat dshn-stat-hero">
            <div className="dshn-stat-label">{t('dlDay')}</div>
            <div className="dshn-stat-value">{fmtInt(p?.day?.downloads)}</div>
            <div className="dshn-stat-sub">{p?.day?.end || ''}</div>
          </div>
          <div className="dshn-stat">
            <div className="dshn-stat-label">{t('dlWeek')}</div>
            <div className="dshn-stat-value">{fmtCompact(p?.week?.downloads)}</div>
            <div className="dshn-stat-sub">{fmtInt(p?.week?.downloads)}</div>
          </div>
          <div className="dshn-stat">
            <div className="dshn-stat-label">{t('dlMonth')}</div>
            <div className="dshn-stat-value">{fmtCompact(p?.month?.downloads)}</div>
            <div className="dshn-stat-sub">{fmtInt(p?.month?.downloads)}</div>
          </div>
          <div className="dshn-stat">
            <div className="dshn-stat-label">{t('dlYear')}</div>
            <div className="dshn-stat-value">{fmtCompact(p?.year?.downloads)}</div>
            <div className="dshn-stat-sub">{fmtInt(p?.year?.downloads)}</div>
          </div>
        </div>
        {/* 每日安装量柱状图 */}
        <div className="dshn-chart-wrap">
          <div className="dshn-card-title" style={{ marginBottom: 4 }}>
            {t('dailyChartTitle')}
            <span className="dshn-hint">{daily.length > 0 ? `${daily[0].day} ~ ${daily[daily.length - 1].day}` : ''}</span>
          </div>
          <DownloadChart data={daily} />
        </div>
      </div>

      {/* ── 基本信息 ── */}
      <div className="dshn-card">
        <div className="dshn-card-title">{t('basicTitle')}</div>
        <div className="dshn-meta">
          <div className="dshn-meta-row"><span className="dshn-meta-key">{t('fieldCreated')}</span><span className="dshn-meta-val">{fmtDate(info.created)}</span></div>
          <div className="dshn-meta-row"><span className="dshn-meta-key">{t('fieldModified')}</span><span className="dshn-meta-val">{fmtDateTime(info.modified)}</span></div>
          <div className="dshn-meta-row"><span className="dshn-meta-key">{t('fieldLatestPublish')}</span><span className="dshn-meta-val">{fmtDateTime(detail?.publishTime)}{detail?.npmUser ? '�? + detail.npmUser + '�? : ''}</span></div>
          <div className="dshn-meta-row"><span className="dshn-meta-key">{t('fieldVersions')}</span><span className="dshn-meta-val">{info.versionsCount ?? '�?}</span></div>
          <div className="dshn-meta-row"><span className="dshn-meta-key">{t('fieldPkgSize')}</span><span className="dshn-meta-val">{fmtBytes(detail?.unpackedSize)}</span></div>
          <div className="dshn-meta-row"><span className="dshn-meta-key">{t('fieldFileCount')}</span><span className="dshn-meta-val">{detail?.fileCount ?? '�?}</span></div>
          <div className="dshn-meta-row"><span className="dshn-meta-key">{t('fieldNode')}</span><span className="dshn-meta-val">{detail?.engines?.node || '�?}</span></div>
          <div className="dshn-meta-row"><span className="dshn-meta-key">{t('fieldMaintainers')}</span><span className="dshn-meta-val">{(info.maintainers || []).map((m) => m.name || m.email || '').filter(Boolean).join(', ') || '�?}</span></div>
          {info.author ? <div className="dshn-meta-row"><span className="dshn-meta-key">author</span><span className="dshn-meta-val">{info.author}</span></div> : null}
        </div>
      </div>

      {/* ── dist-tags ── */}
      {info.distTags && Object.keys(info.distTags).length > 0 ? (
        <div className="dshn-card">
          <div className="dshn-card-title">{t('distTagsTitle')}</div>
          <div className="dshn-tags">
            {Object.entries(info.distTags).map(([tag, ver]) => (
              <span key={tag} className={'dshn-chip' + (tag === 'latest' ? ' dshn-chip-latest' : '')}>{tag}: {ver}</span>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── 依赖 ── */}
      <div className="dshn-card">
        <div className="dshn-card-title">{t('depsTitle')}</div>
        <div className="dshn-meta" style={{ gridTemplateColumns: '1fr' }}>
          <DepBlock title={t('depsRuntime')} deps={detail?.dependencies} />
          <DepBlock title={t('depsPeer')} deps={detail?.peerDependencies} />
          <DepBlock title={t('depsDev')} deps={detail?.devDependencies} />
        </div>
      </div>

      {/* ── 版本列表 ── */}
      <div className="dshn-card">
        <div className="dshn-card-title">{t('versionsTitle')}<span className="dshn-hint">{versionRows.length}</span></div>
        {versionRows.length === 0 ? (
          <div className="dshn-empty">{t('versionsEmpty')}</div>
        ) : (
          <table className="dshn-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>version</th>
                <th>{t('historyColTime')}</th>
              </tr>
            </thead>
            <tbody>
              {versionRows.map((v) => (
                <tr key={v.version}>
                  <td>{v.version}{v.latest ? <span className="dshn-chip dshn-chip-latest" style={{ marginLeft: 8 }}>{t('latestVersion')}</span> : null}</td>
                  <td>{fmtDateTime(v.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── README 摘要 ── */}
      <div className="dshn-card">
        <div className="dshn-card-title">
          {t('readmeTitle')}
          {info.readme ? (
            <button type="button" className="dshn-btn dshn-btn-small" onClick={() => setReadmeOpen(!readmeOpen)}>
              {readmeOpen ? t('readmeCollapse') : t('readmeExpand')}
            </button>
          ) : null}
        </div>
        {info.readme ? (
          <div style={{ position: 'relative' }}>
            <div className={'dshn-readme' + (readmeOpen ? ' dshn-readme-open' : '')}>{info.readme}</div>
            {!readmeOpen ? <div className="dshn-readme-fade" /> : null}
          </div>
        ) : (
          <div className="dshn-empty">{t('readmeEmpty')}</div>
        )}
      </div>
    </div>
  )
}
