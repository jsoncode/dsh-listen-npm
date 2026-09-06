/**
 * smoke-ops —— 宿主半边 runOp 端到端冒烟测试（真实 curl + 真实 npm API）。
 *
 * 用 node:child_process spawnSync（stdout 重定向到文件描述符，绕开受限沙箱的
 * 命名管道限制）模拟宿主 subprocess 服务；store 写入临时目录。
 * 断言：search / info（日粒度 30 天 + 昨日>0）/ watchAdd / watchRefresh /
 * history / watchRemove 全链路可用。
 */
import { closeSync, fstatSync, mkdtempSync, openSync, readSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { runOp } from '../src/host/ops.ts'
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
  // 1. search
  const search = await runOp(deps, { op: 'search', text: 'vue', size: 3 })
  if (!search.ok || !Array.isArray(search.results) || search.results.length === 0) fail('search: ' + JSON.stringify(search).slice(0, 200))
  ok(`search: ${search.results.length} results, first = ${search.results[0].name}`)

  // 2. info
  const info = await runOp(deps, { op: 'info', pkg: 'vue' })
  if (!info.ok) fail('info: ' + JSON.stringify(info).slice(0, 300))
  if (!Array.isArray(info.daily) || info.daily.length < 28) fail('info daily points: ' + (info.daily || []).length)
  if (!(info.points.day.downloads > 0)) fail('info points.day = ' + JSON.stringify(info.points.day))
  ok(`info: ${info.info.name}@${info.info.latest} · daily=${info.daily.length}d · yesterday=${info.points.day.downloads} · week=${info.points.week.downloads} · year=${info.points.year.downloads}`)

  // 3. info（scoped 包）
  const scoped = await runOp(deps, { op: 'info', pkg: '@vue/runtime-core' })
  if (!scoped.ok) fail('info scoped: ' + JSON.stringify(scoped).slice(0, 300))
  ok(`info scoped: ${scoped.info.name}@${scoped.info.latest} · yesterday=${scoped.points.day.downloads}`)

  // 4. info（不存在的包）
  const missing = await runOp(deps, { op: 'info', pkg: 'no-such-package-dshn-xyz-91337' })
  if (missing.ok || missing.code !== 'pkg-not-found') fail('info missing should 404, got: ' + JSON.stringify(missing).slice(0, 200))
  ok('info missing -> pkg-not-found')

  // 5. watchAdd（粘贴 URL 自动归一化）
  const add = await runOp(deps, { op: 'watchAdd', pkg: 'https://www.npmjs.com/package/left-pad' })
  if (!add.ok) fail('watchAdd: ' + JSON.stringify(add).slice(0, 300))
  if (add.entry.name !== 'left-pad') fail('watchAdd normalize failed: ' + add.entry.name)
  ok(`watchAdd: ${add.entry.name}@${add.entry.lastVersion} · day=${add.entry.lastDay} · week=${add.entry.lastWeek}`)

  // 6. watchAdd 重复
  const dup = await runOp(deps, { op: 'watchAdd', pkg: 'left-pad' })
  if (dup.ok || dup.code !== 'watch-duplicate') fail('watchAdd duplicate: ' + JSON.stringify(dup).slice(0, 200))
  ok('watchAdd duplicate -> watch-duplicate')

  // 7. watchRefresh（无版本变更路径；混合 scoped 包验证批量/逐个请求分流）
  const addScoped = await runOp(deps, { op: 'watchAdd', pkg: '@vue/runtime-core' })
  if (!addScoped.ok) fail('watchAdd scoped: ' + JSON.stringify(addScoped).slice(0, 300))
  ok(`watchAdd scoped: ${addScoped.entry.name}@${addScoped.entry.lastVersion} · day=${addScoped.entry.lastDay} · week=${addScoped.entry.lastWeek}`)
  const refresh = await runOp(deps, { op: 'watchRefresh' })
  if (!refresh.ok) fail('watchRefresh: ' + JSON.stringify(refresh).slice(0, 300))
  const entry = refresh.watch.find((w) => w.name === 'left-pad')
  const scopedEntry = refresh.watch.find((w) => w.name === '@vue/runtime-core')
  if (!entry || entry.error) fail('watchRefresh entry: ' + JSON.stringify(entry).slice(0, 300))
  if (!scopedEntry || scopedEntry.error || !(scopedEntry.lastDay > 0)) fail('watchRefresh scoped entry: ' + JSON.stringify(scopedEntry).slice(0, 300))
  if (refresh.changes.length !== 0) fail('watchRefresh unexpected changes: ' + JSON.stringify(refresh.changes))
  ok(`watchRefresh: watch=${refresh.watch.length} · changes=0 · day=${entry.lastDay} · scoped day=${scopedEntry.lastDay}`)

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
