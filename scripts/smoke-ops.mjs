/**
 * smoke-ops —— 宿主半边 runOp 端到端冒烟测试（真实 curl + 真实 npm API）
 * 外加两个纯函数层（日历补齐 buildDailySeries / 展示视图 seriesOf）的断言。
 *
 * 用 node:child_process spawnSync（stdout 重定向到文件描述符，绕开受限沙箱的
 * 命名管道限制）模拟宿主 subprocess 服务；store 写入临时目录。
 * 断言：日历补齐与展示视图 / search / info（日粒度连续 + 聚合锚定真实数据日）/
 * watchAdd / watchRefresh / history / watchRemove 全链路可用。
 */
import { closeSync, fstatSync, mkdtempSync, openSync, readSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { runOp } from '../src/host/ops.ts'
import { deriveRepoAndIssues } from '../src/host/npm.ts'
import { seriesOf } from '../src/client/format.ts'
import { buildDailySeries, daysBetween, lastRealDay, latestExpectedDay, MAX_PENDING_DAYS, shiftDay } from '../src/shared/daily.ts'
import { EMPTY_STORE, loadStore, resolveStoreDir, resetStoreDirCache, saveStore } from '../src/host/store.ts'

/** 模拟宿主 subprocess 服务：spawnSync + 文件描述符输出收集。 */
const mockSubprocess = {
  async resolveExecutable(name) {
    return name
  },
  async spawn(opts) {
    const outPath = join(tmpdir(), `dshn-out-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`)
    const errPath = join(tmpdir(), `dshn-err-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`)
    const outFd = openFd(outPath)
    const errFd = openFd(errPath)
    try {
      const r = spawnSync(opts.argv[0], opts.argv.slice(1), {
        cwd: opts.cwd || '.',
        stdio: ['ignore', outFd, errFd],
        timeout: 90_000,
      })
      const stdout = readFd(outFd)
      const stderr = readFd(errFd)
      return {
        done: Promise.resolve({ exitCode: r.status ?? 1 }),
        collected: {
          stdout: { readFrom: () => ({ text: stdout }) },
          stderr: { readFrom: () => ({ text: stderr }) },
        },
      }
    } finally {
      try { closeSync(outFd) } catch { /* ignore */ }
      try { closeSync(errFd) } catch { /* ignore */ }
    }
  },
}

function openFd(path) {
  return openSync(path, 'w+')
}

function readFd(fd) {
  try {
    const len = fstatSync(fd).size
    const buf = Buffer.alloc(len)
    readSync(fd, buf, 0, len, 0)
    return buf.toString('utf8')
  } catch {
    return ''
  }
}

const ctx = { get: (name) => (name === 'subprocess' ? mockSubprocess : undefined) }

// 临时数据目录
const dir = mkdtempSync(join(tmpdir(), 'dshn-smoke-'))
resetStoreDirCache()
process.env.DSH_HOME = dir
resetStoreDirCache()
const storeDir = resolveStoreDir()
const mirror = EMPTY_STORE()
const deps = {
  ctx,
  readStore: () => mirror,
  writeStore: async (data) => { Object.assign(mirror, data); await saveStore(storeDir, mirror) },
  registryUrl: 'https://registry.npmjs.org',
  downloadsUrl: 'https://api.npmjs.org/downloads',
  refreshMinutes: 10,
}

const fail = (msg) => { console.error('SMOKE FAIL: ' + msg); rmSync(dir, { recursive: true, force: true }); process.exit(1) }
const ok = (msg) => console.log('  OK ' + msg)

const main = async () => {
  // 0. repository / issues 推导纯函数（覆盖裸域名 bugs、shorthand 仓库、scp、mailto、gitlab）
  const d1 = deriveRepoAndIssues({ url: 'github:jsoncode/dsh-listen-npm' }, { url: 'https://github.com' })
  if (d1.repository !== 'https://github.com/jsoncode/dsh-listen-npm') fail('deriveRepoAndIssues shorthand repo: ' + String(d1.repository))
  if (d1.bugs !== 'https://github.com/jsoncode/dsh-listen-npm/issues') fail('deriveRepoAndIssues bare bugs should derive issues: ' + String(d1.bugs))
  const d2 = deriveRepoAndIssues({ url: 'git+https://github.com/vuejs/core.git' }, 'https://github.com/vuejs/core/issues')
  if (d2.repository !== 'https://github.com/vuejs/core' || d2.bugs !== 'https://github.com/vuejs/core/issues') fail('deriveRepoAndIssues keep real issues url: ' + JSON.stringify(d2))
  const d3 = deriveRepoAndIssues('git@github.com:u/r.git', { email: 'a@b.c' })
  if (d3.repository !== 'https://github.com/u/r' || d3.bugs !== 'https://github.com/u/r/issues') fail('deriveRepoAndIssues scp+email: ' + JSON.stringify(d3))
  const d4 = deriveRepoAndIssues(undefined, 'mailto:a@b.c')
  if (d4.bugs !== undefined) fail('deriveRepoAndIssues mailto should be dropped: ' + String(d4.bugs))
  const d5 = deriveRepoAndIssues('https://gitlab.com/u/r', 'https://gitlab.com/u/r')
  if (d5.bugs !== 'https://gitlab.com/u/r/-/issues') fail('deriveRepoAndIssues gitlab homepage -> issues: ' + String(d5.bugs))
  ok('issues 推导: bare-bugs / shorthand / scp / email / mailto / gitlab 全部正确')

  // 0b. 日历补齐纯函数（连续性 + pending 标记 + 聚合锚定真实数据日）
  const gapSeries = buildDailySeries(
    [{ day: '2026-09-03', downloads: 30 }, { day: '2026-09-04', downloads: 40 }, { day: '2026-09-06', downloads: 60 }],
    '2026-09-08',
  )
  const gapDays = gapSeries.daily.map((p) => p.day).join(',')
  if (gapDays !== '2026-09-03,2026-09-04,2026-09-05,2026-09-06,2026-09-07,2026-09-08') {
    fail('buildDailySeries 未补齐日期: ' + gapDays)
  }
  if (gapSeries.daily[2].downloads !== 0 || gapSeries.daily[2].pending === true) {
    fail('区间内部漏报日应为真实 0（非 pending）: ' + JSON.stringify(gapSeries.daily[2]))
  }
  if (gapSeries.lagDays !== 2 || gapSeries.pendingDays !== 2
    || gapSeries.daily[4].pending !== true || gapSeries.daily[4].downloads !== 0
    || gapSeries.daily[5].pending !== true) {
    fail('尾部未统计日应为 0 + pending: ' + JSON.stringify(gapSeries))
  }
  if (gapSeries.dataEnd !== '2026-09-06' || gapSeries.expectedEnd !== '2026-09-08') {
    fail('buildDailySeries dataEnd/expectedEnd 错误: ' + JSON.stringify(gapSeries))
  }
  const futureSeries = buildDailySeries([{ day: '2026-09-08', downloads: 5 }], '2026-09-08')
  if (futureSeries.lagDays !== 0 || futureSeries.daily.length !== 1) fail('targetEnd=dataEnd 时不应补齐: ' + JSON.stringify(futureSeries))
  const capped = buildDailySeries([{ day: '2026-01-01', downloads: 1 }], '2026-12-31')
  if (capped.lagDays !== 14 || capped.daily.length !== 15) fail('尾部补齐应封顶 14 天: ' + capped.lagDays + '/' + capped.daily.length)
  const dirty = buildDailySeries([{ day: '2026-02-31', downloads: 9 }, { day: 'bad', downloads: 1 }, { day: '2026-09-07', downloads: 2 }], '2026-09-07')
  if (dirty.daily.length !== 1 || dirty.dataStart !== '2026-09-07') fail('非法日期应被丢弃: ' + JSON.stringify(dirty.daily))
  if (latestExpectedDay(new Date(2026, 8, 10, 9, 0, 0)) !== '2026-09-09') fail('latestExpectedDay 应为本地昨天')
  ok('buildDailySeries: 内部漏报补 0 / 尾部补 0+pending / 封顶 14 天 / 脏数据丢弃 全部正确')

  // 0c. 展示视图 seriesOf：旧版宿主载荷（无 pending）也要补齐尾部并标注滞后；幂等
  const legacyPayload = [
    { day: '2026-09-04', downloads: 40 },
    { day: '2026-09-06', downloads: 33 },
  ]
  const view = seriesOf(legacyPayload)
  const expectLag = Math.min(daysBetween('2026-09-06', latestExpectedDay()), MAX_PENDING_DAYS)
  if (view.lagDays !== expectLag) fail(`seriesOf lagDays 期望 ${expectLag}，实际 ${view.lagDays}`)
  if (view.dataEnd !== '2026-09-06') fail('seriesOf dataEnd: ' + view.dataEnd)
  if (view.real.length !== 3) fail('seriesOf 应把内部漏报的 09-05 补成真实 0: ' + JSON.stringify(view.real))
  if (view.all.length !== 3 + expectLag) fail('seriesOf 序列长度: ' + view.all.length)
  if (view.all.some((p, i) => (i >= view.all.length - expectLag) !== (p.pending === true))) {
    fail('seriesOf pending 标记位置错误: ' + JSON.stringify(view.all.map((p) => p.pending === true)))
  }
  if (view.expectedEnd !== latestExpectedDay()) fail('seriesOf expectedEnd 应补到昨天: ' + view.expectedEnd)
  const idempotent = seriesOf(view.all)
  if (idempotent.lagDays !== view.lagDays || idempotent.dataEnd !== view.dataEnd || idempotent.all.length !== view.all.length) {
    fail('seriesOf 对已补齐序列应幂等: ' + JSON.stringify({ a: idempotent.lagDays, b: view.lagDays }))
  }
  const fresh = seriesOf([{ day: shiftDay(latestExpectedDay(), -1), downloads: 7 }, { day: latestExpectedDay(), downloads: 9 }])
  if (fresh.lagDays !== 0 || fresh.all.length !== 2 || fresh.dataEnd !== latestExpectedDay()) {
    fail('seriesOf 数据已最新时不应补 0: ' + JSON.stringify(fresh))
  }
  if (seriesOf([]).all.length !== 0 || seriesOf(undefined).lagDays !== 0) fail('seriesOf 空序列应保持空')
  ok(`seriesOf: 旧载荷补尾 ${expectLag} 天 / 内部漏报补 0 / 幂等 / 数据最新时不补 全部正确`)

  // 1. search
  const search = await runOp(deps, { op: 'search', text: 'vue', size: 3 })
  if (!search.ok || !Array.isArray(search.results) || search.results.length === 0) fail('search: ' + JSON.stringify(search).slice(0, 200))
  ok(`search: ${search.results.length} results, first = ${search.results[0].name}`)

  // 2. info
  const info = await runOp(deps, { op: 'info', pkg: 'vue' })
  if (!info.ok) fail('info: ' + JSON.stringify(info).slice(0, 300))
  if (!Array.isArray(info.daily) || info.daily.length < 28) fail('info daily points: ' + (info.daily || []).length)
  if (!(info.points.day.downloads > 0)) fail('info points.day = ' + JSON.stringify(info.points.day))
  if (info.info.bugs !== 'https://github.com/vuejs/core/issues') fail('info issues url: ' + String(info.info.bugs))
  // 日粒度序列必须逐日连续（缺失日补 0，尾部未统计日 0 + pending）
  for (let i = 1; i < info.daily.length; i++) {
    if (shiftDay(info.daily[i - 1].day, 1) !== info.daily[i].day) {
      fail(`info daily 日期不连续: ${info.daily[i - 1].day} → ${info.daily[i].day}`)
    }
  }
  const realDaily = info.daily.filter((p) => p.pending !== true)
  const pendingDaily = info.daily.filter((p) => p.pending === true)
  const realTotal = realDaily.reduce((acc, p) => acc + p.downloads, 0)
  if (info.daily[info.daily.length - 1].day !== info.rangeEnd) fail('info rangeEnd 应等于序列末日: ' + info.rangeEnd)
  if (info.dataEnd !== realDaily[realDaily.length - 1].day) fail('info dataEnd 应等于最后一个真实数据日: ' + info.dataEnd)
  if (pendingDaily.length !== info.lagDays) fail('info lagDays 与 pending 点数不一致: ' + info.lagDays + '/' + pendingDaily.length)
  if (pendingDaily.some((p) => p.downloads !== 0)) fail('pending 日必须为 0: ' + JSON.stringify(pendingDaily))
  if (info.points.month.downloads !== realTotal) fail('info 近30天应只统计真实数据日: ' + info.points.month.downloads + '/' + realTotal)
  if (info.points.day.end !== info.dataEnd) fail('info 最新单日日期应为 dataEnd: ' + JSON.stringify(info.points.day))
  ok(`info: ${info.info.name}@${info.info.latest} · daily=${info.daily.length}d(真实${realDaily.length}/待统计${pendingDaily.length}) · 最新单日=${info.points.day.downloads}@${info.dataEnd} · week=${info.points.week.downloads} · year=${info.points.year.downloads} · issues=${info.info.bugs}`)

  // 3. info（scoped 包）
  const scoped = await runOp(deps, { op: 'info', pkg: '@vue/runtime-core' })
  if (!scoped.ok) fail('info scoped: ' + JSON.stringify(scoped).slice(0, 300))
  ok(`info scoped: ${scoped.info.name}@${scoped.info.latest} · 最新单日=${scoped.points.day.downloads}@${scoped.dataEnd}`)

  // 4. info（不存在的包）
  const missing = await runOp(deps, { op: 'info', pkg: 'no-such-package-dshn-xyz-91337' })
  if (missing.ok || missing.code !== 'pkg-not-found') fail('info missing should 404, got: ' + JSON.stringify(missing).slice(0, 200))
  ok('info missing -> pkg-not-found')

  // 5. watchAdd（粘贴 URL 自动归一化）
  const add = await runOp(deps, { op: 'watchAdd', pkg: 'https://www.npmjs.com/package/left-pad' })
  if (!add.ok) fail('watchAdd: ' + JSON.stringify(add).slice(0, 300))
  if (add.entry.name !== 'left-pad') fail('watchAdd normalize failed: ' + add.entry.name)
  if (!Array.isArray(add.entry.daily) || add.entry.daily.length === 0) fail('watchAdd daily missing: ' + JSON.stringify(add.entry.daily))
  // 监控序列同样逐日连续（尾部待统计日已补 0 + pending）
  for (let i = 1; i < add.entry.daily.length; i++) {
    if (shiftDay(add.entry.daily[i - 1].day, 1) !== add.entry.daily[i].day) {
      fail(`watchAdd daily 日期不连续: ${add.entry.daily[i - 1].day} → ${add.entry.daily[i].day}`)
    }
  }
  ok(`watchAdd: ${add.entry.name}@${add.entry.lastVersion} · 最新单日=${add.entry.lastDay}@${lastRealDay(add.entry.daily)} · week=${add.entry.lastWeek} · daily=${add.entry.daily.length}d(待统计${add.entry.daily.filter((p) => p.pending === true).length})`)

  // 6. watchAdd 重复
  const dup = await runOp(deps, { op: 'watchAdd', pkg: 'left-pad' })
  if (dup.ok || dup.code !== 'watch-duplicate') fail('watchAdd duplicate: ' + JSON.stringify(dup).slice(0, 200))
  ok('watchAdd duplicate -> watch-duplicate')

  // 7. watchRefresh（无版本变更路径；混合 scoped 包验证批量/逐个请求分流）
  const addScoped = await runOp(deps, { op: 'watchAdd', pkg: '@vue/runtime-core' })
  if (!addScoped.ok) fail('watchAdd scoped: ' + JSON.stringify(addScoped).slice(0, 300))
  ok(`watchAdd scoped: ${addScoped.entry.name}@${addScoped.entry.lastVersion} · 最新单日=${addScoped.entry.lastDay}@${lastRealDay(addScoped.entry.daily)} · week=${addScoped.entry.lastWeek}`)
  const refresh = await runOp(deps, { op: 'watchRefresh' })
  if (!refresh.ok) fail('watchRefresh: ' + JSON.stringify(refresh).slice(0, 300))
  const entry = refresh.watch.find((w) => w.name === 'left-pad')
  const scopedEntry = refresh.watch.find((w) => w.name === '@vue/runtime-core')
  if (!entry || entry.error) fail('watchRefresh entry: ' + JSON.stringify(entry).slice(0, 300))
  if (!Array.isArray(entry.daily) || entry.daily.length === 0) fail('watchRefresh daily missing: ' + JSON.stringify(entry.daily))
  if (!scopedEntry || scopedEntry.error || !(scopedEntry.lastDay > 0)) fail('watchRefresh scoped entry: ' + JSON.stringify(scopedEntry).slice(0, 300))
  if (!Array.isArray(scopedEntry.daily) || scopedEntry.daily.length === 0) fail('watchRefresh scoped daily missing')
  if (refresh.changes.length !== 0) fail('watchRefresh unexpected changes: ' + JSON.stringify(refresh.changes))
  ok(`watchRefresh: watch=${refresh.watch.length} · changes=0 · 最新单日=${entry.lastDay}@${lastRealDay(entry.daily)} · scoped day=${scopedEntry.lastDay} · daily=${entry.daily.length}/${scopedEntry.daily.length}d`)

  // 8. history（应有 init 快照）
  const history = await runOp(deps, { op: 'history', pkg: 'left-pad' })
  if (!history.ok || history.snapshots.length !== 1 || history.snapshots[0].note !== 'init') fail('history: ' + JSON.stringify(history).slice(0, 300))
  ok(`history: ${history.snapshots.length} snapshot (init)`)

  // 9. 持久化回读
  const reloaded = await loadStore(storeDir)
  if (!reloaded || reloaded.watch.length !== 2) fail('persistence: ' + JSON.stringify(reloaded).slice(0, 200))
  ok('persistence: store 落盘并回读一致')

  // 10. watchRemove（scoped + 普通）
  const rmScoped = await runOp(deps, { op: 'watchRemove', pkg: '@vue/runtime-core' })
  if (!rmScoped.ok) fail('watchRemove scoped: ' + JSON.stringify(rmScoped).slice(0, 200))
  const rm = await runOp(deps, { op: 'watchRemove', pkg: 'left-pad' })
  if (!rm.ok || rm.watch.length !== 0) fail('watchRemove: ' + JSON.stringify(rm).slice(0, 200))
  ok('watchRemove: 列表清空（含 scoped）')

  // 11. config
  const cfg = await runOp(deps, { op: 'config' })
  if (!cfg.ok || cfg.refreshMinutes !== 10) fail('config: ' + JSON.stringify(cfg).slice(0, 200))
  ok('config: refreshMinutes=10')

  // 12. unknown op
  const unknown = await runOp(deps, { op: 'nope' })
  if (unknown.ok || unknown.code !== 'unknown-op') fail('unknown op: ' + JSON.stringify(unknown).slice(0, 200))
  ok('unknown op -> unknown-op')

  rmSync(dir, { recursive: true, force: true })
  console.log('SMOKE OK: 全部通过')
}

main().catch((e) => { console.error('SMOKE ERROR', e); rmSync(dir, { recursive: true, force: true }); process.exit(1) })
