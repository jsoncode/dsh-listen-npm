import Schema from "@deepseek-ai/schemastery";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
//#region src/host/fence.ts
/** 规范化后的 URL hostname 是否指向本地回环（localhost / 127.0.0.0/8 / [::1]）。 */
function isLoopbackHostname(hostname) {
	if (hostname === "localhost" || hostname === "[::1]") return true;
	const parts = hostname.split(".");
	return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
/** 规范化一个 Host 头 authority 为 URL，解析失败返回 undefined。 */
function parseAuthority(authority) {
	try {
		return new URL(`http://${authority}`);
	} catch {
		return;
	}
}
/** 规范化 authority 形式：hostname，或带端口的 hostname:port。 */
function canonicalAuthority(entry, entryUrl) {
	const port = entryUrl.port !== "" ? entryUrl.port : new URL(`https://${entry}`).port;
	return port === "" ? entryUrl.hostname : `${entryUrl.hostname}:${port}`;
}
/** 请求 authority 是否匹配 trustedHosts 中的一项（精确或省略端口）。 */
function isTrustedAuthority(hostUrl, trustedHosts) {
	return trustedHosts.some((entry) => {
		const entryUrl = parseAuthority(entry);
		if (entryUrl === void 0) return false;
		return canonicalAuthority(entry, entryUrl) === entryUrl.hostname ? entryUrl.hostname === hostUrl.hostname : entryUrl.host === hostUrl.host;
	});
}
/**
* 判定一次 /dsh-listen-npm/api 请求是否可放行。
* @param headers - node HTTP 请求头。
* @param trustedHosts - 部署的非回环受信任主机（webRuntime.trustedHosts，可为空）。
* @returns true 表示 Host 是自有（回环或受信任）且浏览器标记为同源。
*/
function isTrustedApiRequest(headers, trustedHosts) {
	const raw = headers.host;
	if (typeof raw !== "string" || raw === "") return false;
	const hostUrl = parseAuthority(raw);
	if (hostUrl === void 0) return false;
	if (!isLoopbackHostname(hostUrl.hostname) && !isTrustedAuthority(hostUrl, trustedHosts)) return false;
	if (headers["sec-fetch-site"] === "cross-site") return false;
	const origin = headers.origin;
	if (typeof origin !== "string" || origin === "") return true;
	try {
		return new URL(origin).host === hostUrl.host;
	} catch {
		return false;
	}
}
//#endregion
//#region src/host/npm.ts
const CURL_TIMEOUT = 60;
/** 全量文档上限：react（约 3000 个版本）全量约 7MB，给足余量。 */
const STDOUT_MAX = 33554432;
/** npm API 错误（带本地化码，客户端按 code 显示中/英文）。 */
var NpmError = class extends Error {
	status;
	code;
	constructor(code, message, status) {
		super(message);
		this.code = code;
		this.status = status;
	}
};
/** 包名归一化：容忍粘贴 npm 页面链接 / 前后空白 / 统一小写 scope。 */
function normalizePkgName(raw) {
	let name = String(raw || "").trim();
	const m = name.match(/\/package\/(@?[^/?#]+)/);
	if (m) name = m[1];
	name = name.replace(/^npm:/, "");
	return name.trim();
}
/** 识别主流托管平台（github / gitlab / gitee）的仓库网页地址，返回 { host, slug }。 */
function platformSlugOf(url) {
	const m = url.match(/^https?:\/\/(?:www\.)?(github\.com|gitlab\.com|gitee\.com)\/([^/]+)\/([^/#?]+)/i);
	return m === null ? void 0 : {
		host: m[1].toLowerCase(),
		slug: m[2] + "/" + m[3].replace(/\.git$/, "")
	};
}
/** 平台仓库地址 → issues 页地址（gitlab 的 issues 挂在 /-/issues）。 */
function issuesUrlOfPlatform(host, slug) {
	return host === "gitlab.com" ? "https://gitlab.com/" + slug + "/-/issues" : "https://" + host + "/" + slug + "/issues";
}
/**
* registry 文档的 repository / bugs 字段 → 仓库网页地址 + issues 跳转地址。
*
* repository 归一化常见非网页形态：git+ 前缀 / .git 后缀 / git:// 协议 /
* ssh://git@ / scp 形式（git@host:path）/ npm shorthand（github:owner/repo 等）。
*
* issues 推导规则：npm 的 bugs 常见形态是 { email } / mailto:（当链接用会唤起
* 邮件客户端），还有大量包把 bugs.url 填成仓库首页甚至裸域名（点了就是
* GitHub 首页）。因此：
* 1. 只接受 http(s) 形式的 bugs.url；
* 2. 托管平台链接统一校验/补全为 issues 页：已是 issues 页原样保留，
*    仓库首页补 /issues（gitlab 为 /-/issues），裸域名/仅组织名等定位不到
*    仓库的丢弃；
* 3. 非托管平台的自定义 tracker 原样保留；
* 4. 仍无可用链接时，从 repository 推导 issues 页。
*/
function deriveRepoAndIssues(repoRaw, bugsRaw) {
	let repository;
	const repoUrl = typeof repoRaw === "string" ? repoRaw : repoRaw && typeof repoRaw === "object" && typeof repoRaw.url === "string" ? String(repoRaw.url) : "";
	if (repoUrl) repository = repoUrl.replace(/^git\+/, "").replace(/\.git$/, "").replace(/^git:\/\//, "https://").replace(/^ssh:\/\/git@/, "https://").replace(/^git@([^:/]+)[:/]/, "https://$1/");
	if (repository !== void 0) {
		const sh = repository.match(/^(github|gitlab|gitee|bitbucket):([^/]+)\/([^/#?]+)$/i);
		if (sh) repository = "https://" + (sh[1].toLowerCase() === "bitbucket" ? "bitbucket.org" : sh[1].toLowerCase() + ".com") + "/" + sh[2] + "/" + sh[3];
	}
	const repoPlatform = repository !== void 0 ? platformSlugOf(repository) : void 0;
	const bugsCandidate = typeof bugsRaw === "string" ? bugsRaw : bugsRaw && typeof bugsRaw === "object" && typeof bugsRaw.url === "string" ? String(bugsRaw.url) : void 0;
	let bugs;
	if (bugsCandidate !== void 0 && /^https?:\/\//i.test(bugsCandidate)) {
		const slugHit = platformSlugOf(bugsCandidate);
		const onPlatform = /^https?:\/\/(?:www\.)?(github\.com|gitlab\.com|gitee\.com)(\/|$)/i.test(bugsCandidate);
		if (slugHit !== void 0) bugs = /\/(?:-\/)?issues(?:[/?#]|$)/i.test(bugsCandidate) ? bugsCandidate : issuesUrlOfPlatform(slugHit.host, slugHit.slug);
		else if (!onPlatform) bugs = bugsCandidate;
	}
	if (bugs === void 0 && repoPlatform !== void 0) bugs = issuesUrlOfPlatform(repoPlatform.host, repoPlatform.slug);
	return {
		repository,
		bugs
	};
}
/** 包名合法性（npm rules 的宽松版：scope 可选，主体字符 [a-z0-9-._~]）。 */
function isValidPkgName(name) {
	if (!name || name.length > 214) return false;
	if (!name.startsWith("@")) return /^[a-z0-9-._~]+$/i.test(name);
	const slash = name.indexOf("/");
	if (slash <= 1 || slash === name.length - 1) return false;
	return /^[a-z0-9-._~]+$/i.test(name.slice(1, slash)) && /^[a-z0-9-._~]+$/i.test(name.slice(slash + 1));
}
/** registry 路径的包名编码：@ 保留、/ 编码为 %2F。 */
const registryEnc = (name) => encodeURIComponent(name).replace(/^%40/, "@");
/** 拆分 `-D -` 输出的响应头与响应体（兼容 \r\n 与 \n 两种行尾）。 */
function splitHeaders(stdout) {
	const i1 = stdout.indexOf("\r\n\r\n");
	if (i1 !== -1) return {
		headers: stdout.slice(0, i1),
		body: stdout.slice(i1 + 4)
	};
	const i2 = stdout.indexOf("\n\n");
	if (i2 !== -1) return {
		headers: stdout.slice(0, i2),
		body: stdout.slice(i2 + 2)
	};
	return {
		headers: stdout,
		body: ""
	};
}
/** 取响应头里最后一个 HTTP 状态码（重定向链末尾）。 */
function lastStatus(headers) {
	const matches = [...headers.matchAll(/HTTP\/\d(?:\.\d)?\s+(\d+)/g)];
	if (matches.length === 0) return 0;
	return Number(matches[matches.length - 1][1]);
}
/** 执行一次 GET（curl.exe 经 subprocess 直 spawn，跟随重定向）。 */
async function npmGet(deps, url) {
	const sub = deps.ctx.get("subprocess");
	if (sub === void 0) throw new NpmError("subprocess-missing", "subprocess service unavailable");
	let curlPath;
	try {
		curlPath = await sub.resolveExecutable("curl.exe");
	} catch {
		curlPath = await sub.resolveExecutable("curl");
	}
	let cwd = ".";
	const policy = deps.ctx.get("sandboxPolicy");
	if (policy !== void 0 && typeof policy.workspaceRoot === "string" && policy.workspaceRoot.length > 0) cwd = policy.workspaceRoot;
	const argv = [
		curlPath,
		"-sS",
		"-L",
		"-m",
		String(CURL_TIMEOUT),
		"-D",
		"-",
		"-H",
		"accept: application/json",
		url
	];
	let handle;
	try {
		handle = await sub.spawn({
			argv,
			cwd,
			stdio: {
				stdin: "ignore",
				stdout: {
					mode: "collect",
					maxBytes: STDOUT_MAX
				},
				stderr: {
					mode: "collect",
					maxBytes: 65536
				}
			},
			graceMs: 5e3
		});
	} catch (e) {
		throw new NpmError("network-failed", "spawn curl failed: " + (e && e.message || String(e)));
	}
	try {
		await handle.done;
	} catch (e) {
		throw new NpmError("network-failed", "spawn curl failed: " + (e && e.message || String(e)));
	}
	const stdout = handle.collected && handle.collected.stdout ? handle.collected.stdout.readFrom(0).text : "";
	const stderr = handle.collected && handle.collected.stderr ? handle.collected.stderr.readFrom(0).text : "";
	const exitCode = (await handle.done).exitCode;
	if (exitCode !== 0 && exitCode !== null) throw new NpmError("network-failed", "curl exit " + exitCode + ((stderr || "").trim() ? ": " + stderr.trim().slice(0, 200) : ""));
	const parsed = splitHeaders(stdout);
	return {
		status: lastStatus(parsed.headers),
		body: parsed.body
	};
}
/** GET 并解析 JSON；非 2xx / downloads 错误载荷统一抛 NpmError。 */
async function npmGetJson(deps, url, source) {
	const res = await npmGet(deps, url);
	if (res.status === 404) throw new NpmError("pkg-not-found", "HTTP 404: " + url, 404);
	if (res.status === 429) throw new NpmError("rate-limited", "HTTP 429: rate limited", 429);
	if (res.status >= 400) throw new NpmError("registry-http", "HTTP " + res.status + ": " + url, res.status);
	let parsed;
	try {
		parsed = JSON.parse(res.body);
	} catch {
		throw new NpmError("parse-failed", "invalid JSON from " + source);
	}
	if (source === "downloads" && parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
		const err = parsed.error;
		if (typeof err === "string" && err.length > 0) throw new NpmError("pkg-not-found", err, 404);
	}
	return parsed;
}
const registryBase = (deps) => deps.registryUrl.replace(/\/+$/, "");
const downloadsBase = (deps) => deps.downloadsUrl.replace(/\/+$/, "");
/** 轻量 dist-tags（监控刷新用，响应极小）。 */
async function fetchDistTags(deps, name) {
	const parsed = await npmGetJson(deps, `${registryBase(deps)}/-/package/${registryEnc(name)}/dist-tags`, "registry");
	if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new NpmError("parse-failed", "dist-tags must be an object");
	const out = {};
	for (const [k, v] of Object.entries(parsed)) if (typeof v === "string") out[k] = v;
	return out;
}
/**
* 全量文档 → 规范化 PackageInfo。
* readme 截断前 6000 字符；versions 按发布时间倒序截断前 100 个。
*/
async function fetchPackageInfo(deps, name) {
	const doc = await npmGetJson(deps, `${registryBase(deps)}/${registryEnc(name)}`, "registry");
	if (!doc || typeof doc !== "object") throw new NpmError("parse-failed", "registry doc must be an object");
	if (typeof doc.name !== "string" || doc.name.length === 0) throw new NpmError("pkg-not-found", "package not found: " + name, 404);
	const distTags = doc["dist-tags"] && typeof doc["dist-tags"] === "object" && !Array.isArray(doc["dist-tags"]) ? doc["dist-tags"] : {};
	const latest = typeof distTags.latest === "string" ? distTags.latest : void 0;
	const time = doc.time && typeof doc.time === "object" && !Array.isArray(doc.time) ? doc.time : {};
	const versionsMap = doc.versions && typeof doc.versions === "object" && !Array.isArray(doc.versions) ? doc.versions : {};
	const versionNames = Object.keys(versionsMap);
	const briefs = versionNames.map((v) => ({
		version: v,
		time: time[v] || void 0,
		latest: v === latest
	})).sort((a, b) => (b.time ? Date.parse(b.time) : 0) - (a.time ? Date.parse(a.time) : 0)).slice(0, 100);
	const latestManifest = (latest !== void 0 && versionsMap[latest] !== void 0 ? versionsMap[latest] : void 0) || void 0;
	const latestDist = latestManifest && latestManifest.dist && typeof latestManifest.dist === "object" ? latestManifest.dist : {};
	const authorRaw = doc.author;
	const author = typeof authorRaw === "string" ? authorRaw : authorRaw && typeof authorRaw === "object" && typeof authorRaw.name === "string" ? String(authorRaw.name) : void 0;
	const { repository, bugs } = deriveRepoAndIssues(doc.repository, doc.bugs);
	const readmeRaw = typeof doc.readme === "string" ? doc.readme : "";
	const maintainers = Array.isArray(doc.maintainers) ? doc.maintainers.map((m) => {
		const o = m && typeof m === "object" ? m : {};
		return {
			name: typeof o.name === "string" ? o.name : void 0,
			email: typeof o.email === "string" ? o.email : void 0
		};
	}).slice(0, 20) : void 0;
	const strRecord = (v) => {
		if (!v || typeof v !== "object" || Array.isArray(v)) return void 0;
		const out = {};
		for (const [k, val] of Object.entries(v)) if (typeof val === "string") out[k] = val;
		return Object.keys(out).length > 0 ? out : void 0;
	};
	const keywords = Array.isArray(doc.keywords) ? doc.keywords.filter((k) => typeof k === "string").slice(0, 30) : void 0;
	return { info: {
		name: doc.name,
		description: typeof doc.description === "string" ? doc.description : void 0,
		latest,
		distTags: Object.keys(distTags).length > 0 ? distTags : void 0,
		license: typeof doc.license === "string" ? doc.license : void 0,
		author,
		homepage: typeof doc.homepage === "string" ? doc.homepage : void 0,
		repository,
		bugs,
		keywords,
		maintainers,
		created: time.created || void 0,
		modified: time.modified || void 0,
		versionsCount: versionNames.length,
		versions: briefs,
		latestDetail: latestManifest === void 0 ? void 0 : {
			publishTime: time[latest || ""] || void 0,
			fileCount: typeof latestDist.fileCount === "number" ? latestDist.fileCount : void 0,
			unpackedSize: typeof latestDist.unpackedSize === "number" ? latestDist.unpackedSize : void 0,
			engines: strRecord(latestManifest.engines),
			shasum: typeof latestDist.shasum === "string" ? latestDist.shasum : void 0,
			npmUser: latestManifest._npmUser && typeof latestManifest._npmUser.name === "string" ? String(latestManifest._npmUser.name) : void 0
		},
		readme: readmeRaw ? readmeRaw.slice(0, 6e3) : void 0,
		readmeTruncated: readmeRaw.length > 6e3
	} };
}
/** 日粒度下载量（range/last-week 或 range/last-month，按时间正序返回）。 */
async function fetchDailyRange(deps, name, range) {
	const parsed = await npmGetJson(deps, `${downloadsBase(deps)}/range/${range}/${encodeURIComponent(name)}`, "downloads");
	const rawList = Array.isArray(parsed.downloads) ? parsed.downloads : [];
	const downloads = [];
	for (const item of rawList) {
		const o = item && typeof item === "object" ? item : {};
		if (typeof o.day === "string") downloads.push({
			day: o.day,
			downloads: typeof o.downloads === "number" ? o.downloads : 0
		});
	}
	return {
		start: typeof parsed.start === "string" ? parsed.start : "",
		end: typeof parsed.end === "string" ? parsed.end : "",
		downloads
	};
}
/** 单周期下载量汇总（point/last-day|last-week|last-month|last-year）。 */
async function fetchPoint(deps, name, period) {
	const parsed = await npmGetJson(deps, `${downloadsBase(deps)}/point/${period}/${encodeURIComponent(name)}`, "downloads");
	return {
		downloads: typeof parsed.downloads === "number" ? parsed.downloads : 0,
		start: typeof parsed.start === "string" ? parsed.start : "",
		end: typeof parsed.end === "string" ? parsed.end : ""
	};
}
/** registry 搜索（/-/v1/search），供弹框输入联想。 */
async function searchPackages(deps, text, size) {
	const capped = Math.max(1, Math.min(20, size));
	const parsed = await npmGetJson(deps, `${registryBase(deps)}/-/v1/search?text=${encodeURIComponent(text)}&size=${capped}`, "registry");
	const objects = Array.isArray(parsed.objects) ? parsed.objects : [];
	const out = [];
	for (const obj of objects) {
		const o = obj && typeof obj === "object" ? obj : {};
		const pkg = o.package && typeof o.package === "object" ? o.package : {};
		const dl = o.downloads && typeof o.downloads === "object" ? o.downloads : {};
		const publisher = pkg.publisher && typeof pkg.publisher === "object" ? pkg.publisher : {};
		pkg.links && typeof pkg.links === "object" && pkg.links;
		out.push({
			name: typeof pkg.name === "string" ? pkg.name : "",
			version: typeof pkg.version === "string" ? pkg.version : void 0,
			description: typeof pkg.description === "string" ? pkg.description : void 0,
			keywords: Array.isArray(pkg.keywords) ? pkg.keywords.filter((k) => typeof k === "string").slice(0, 8) : void 0,
			weekly: typeof dl.weekly === "number" ? dl.weekly : void 0,
			monthly: typeof dl.monthly === "number" ? dl.monthly : void 0,
			dependents: typeof o.dependents === "number" ? o.dependents : void 0,
			publisher: publisher.actor && typeof publisher.actor.name === "string" ? publisher.actor.name : void 0,
			date: typeof pkg.date === "string" ? pkg.date : void 0
		});
		if (out.length >= capped) break;
	}
	return out;
}
const STORE_FILE = "dsh-listen-npm.json";
const EMPTY_STORE = () => ({
	version: 1,
	watch: [],
	snapshots: {}
});
let cachedDir = null;
/**
* 解析插件数据目录。优先级：settings documentPath 目录 → $DSH_HOME → ~/.dsh。
* 结果进程内缓存（宿主运行期目录不会变化）。
*/
function resolveStoreDir(settingsDocPath) {
	if (cachedDir !== null) return cachedDir;
	if (settingsDocPath && settingsDocPath.trim().length > 0) {
		cachedDir = dirname(settingsDocPath);
		return cachedDir;
	}
	const env = process.env.DSH_HOME;
	cachedDir = env && env.trim().length > 0 ? env.trim() : join(homedir(), ".dsh");
	return cachedDir;
}
/** 反序列化并校验（字段级兜底，坏条目丢弃而非崩溃）。 */
function openStore(raw) {
	const parsed = JSON.parse(raw);
	if (!parsed || typeof parsed !== "object") throw new Error("store root must be an object");
	const watch = Array.isArray(parsed.watch) ? parsed.watch.map((w) => ({
		name: String(w.name || ""),
		addedAt: typeof w.addedAt === "number" ? w.addedAt : Date.now(),
		lastCheckAt: typeof w.lastCheckAt === "number" ? w.lastCheckAt : void 0,
		lastVersion: typeof w.lastVersion === "string" ? w.lastVersion : void 0,
		lastDay: typeof w.lastDay === "number" ? w.lastDay : void 0,
		lastWeek: typeof w.lastWeek === "number" ? w.lastWeek : void 0,
		prevDay: typeof w.prevDay === "number" ? w.prevDay : void 0,
		prevWeek: typeof w.prevWeek === "number" ? w.prevWeek : void 0,
		daily: Array.isArray(w.daily) ? w.daily.map((p) => ({
			day: typeof p.day === "string" ? String(p.day) : "",
			downloads: typeof p.downloads === "number" ? Number(p.downloads) : 0
		})).filter((p) => p.day.length > 0).slice(-14) : void 0,
		hasNewVersion: w.hasNewVersion === true,
		error: typeof w.error === "string" ? w.error : void 0
	})).filter((w) => w.name.length > 0) : [];
	const snapshots = {};
	if (parsed.snapshots && typeof parsed.snapshots === "object" && !Array.isArray(parsed.snapshots)) for (const [key, list] of Object.entries(parsed.snapshots)) {
		if (!Array.isArray(list)) continue;
		const items = [];
		for (const s of list) {
			const o = s && typeof s === "object" ? s : {};
			if (typeof o.latest !== "string") continue;
			items.push({
				at: typeof o.at === "number" ? o.at : Date.now(),
				latest: o.latest,
				day: typeof o.day === "number" ? o.day : 0,
				week: typeof o.week === "number" ? o.week : 0,
				note: o.note === "init" ? "init" : "version-change"
			});
		}
		if (items.length > 0) snapshots[key] = items.slice(0, 200);
	}
	return {
		version: 1,
		watch,
		snapshots
	};
}
/**
* 读取数据文件。
* @returns 有效 store；文件不存在返回 null；损坏时备份为 .bak 并返回 null。
*/
async function loadStore(dir) {
	const target = join(dir, STORE_FILE);
	let raw;
	try {
		raw = await readFile(target, "utf8");
	} catch (e) {
		const err = e;
		if (err && err.code === "ENOENT") return null;
		console.warn(`[dsh-listen-npm] cannot read store file: ${target}`, e instanceof Error ? e.message : String(e));
		return null;
	}
	try {
		return openStore(raw);
	} catch (e) {
		try {
			await rename(target, target + ".bak");
		} catch {}
		console.warn(`[dsh-listen-npm] store file corrupt, backed up to .bak and starting empty: ${target}`, e instanceof Error ? e.message : String(e));
		return null;
	}
}
let writeChain = Promise.resolve();
function doSave(dir, store) {
	return (async () => {
		await mkdir(dir, { recursive: true });
		const payload = JSON.stringify(store, null, 2);
		const tmp = join(dir, STORE_FILE + ".tmp");
		const target = join(dir, STORE_FILE);
		await writeFile(tmp, payload, { encoding: "utf8" });
		await rename(tmp, target);
	})();
}
/** 保存数据文件（整体替换）。写操作串行化，避免并发写坏文件。 */
function saveStore(dir, store) {
	const next = writeChain.then(() => doSave(dir, store));
	writeChain = next.catch(() => {});
	return next;
}
//#endregion
//#region src/host/ops.ts
/**
* dsh-listen-npm —— 操作分发（HTTP 路由 / 命令 / 模型工具共用）：runOp 全部分支。
*
* 分支：config / info / downloads / search / watchList / watchAdd / watchRemove /
* watchRefresh / watchSeen / history。
*
* 监控刷新策略（省请求）：
* - 每个 watched 包两次轻量请求：dist-tags（几百字节）+ downloads range/last-week；
* - 昨日 / 近 7 天下载量与监控列表迷你柱状图的日粒度序列都由 range 响应推导
*   （downloads 批量接口不支持 scoped 包，range 本就按包查询——scoped 包反而
*   从 3 次请求/包降到 2 次/包）；
* - dist-tags.latest 与本地记录不同 → 版本变更：置 hasNewVersion + 追加快照。
*/
const npmDeps = (deps) => ({
	ctx: deps.ctx,
	registryUrl: deps.registryUrl,
	downloadsUrl: deps.downloadsUrl
});
/** 统一错误码提取（NpmError 自带 code；其余按消息特征兜底）。 */
function errCodeOf(e) {
	if (e instanceof NpmError) return {
		code: e.code,
		status: e.status
	};
	return {};
}
/** 追加快照（新的在前，截断上限）。 */
function pushSnapshot(store, name, snap) {
	const list = Array.isArray(store.snapshots[name]) ? store.snapshots[name] : [];
	list.unshift({
		at: Date.now(),
		latest: snap.latest,
		day: snap.day,
		week: snap.week,
		note: snap.note
	});
	store.snapshots[name] = list.slice(0, 200);
}
/** 由 range/last-week 响应推导监控数据：昨日 = 最后一天，近 7 天 = 7 天合计，daily = 日粒度序列。 */
function entryDataFromRange(range) {
	const daily = range.downloads;
	return {
		day: daily.length > 0 ? daily[daily.length - 1].downloads : 0,
		week: daily.reduce((acc, p) => acc + p.downloads, 0),
		daily
	};
}
/** info op：registry 全量文档 + 下载量（昨/周/月/年 + 近 30 天日粒度）。 */
async function opInfo(deps, rawPkg) {
	const name = normalizePkgName(String(rawPkg || ""));
	if (!isValidPkgName(name)) throw new NpmError("pkg-name-invalid", "invalid package name: " + name);
	const d = npmDeps(deps);
	const [doc, monthRange, yearPoint] = await Promise.all([
		fetchPackageInfo(d, name),
		fetchDailyRange(d, name, "last-month"),
		fetchPoint(d, name, "last-year")
	]);
	const info = doc.info;
	const daily = monthRange.downloads;
	const sumLast = (n) => daily.slice(-n).reduce((acc, p) => acc + p.downloads, 0);
	const points = daily.length > 0 ? {
		day: {
			downloads: daily[daily.length - 1].downloads,
			start: daily[daily.length - 1].day,
			end: daily[daily.length - 1].day
		},
		week: {
			downloads: sumLast(7),
			start: daily[Math.max(0, daily.length - 7)].day,
			end: daily[daily.length - 1].day
		},
		month: {
			downloads: sumLast(daily.length),
			start: monthRange.start,
			end: monthRange.end
		},
		year: yearPoint
	} : { year: yearPoint };
	return {
		info,
		daily,
		rangeStart: monthRange.start,
		rangeEnd: monthRange.end,
		points
	};
}
async function opSearch(deps, text, size) {
	const q = String(text || "").trim();
	if (q.length === 0) return { results: [] };
	return { results: await searchPackages(npmDeps(deps), q, typeof size === "number" ? size : 8) };
}
function opWatchList(deps) {
	return { watch: deps.readStore().watch.map((w) => ({ ...w })) };
}
async function opWatchAdd(deps, rawPkg) {
	const name = normalizePkgName(String(rawPkg || ""));
	if (!isValidPkgName(name)) throw new NpmError("pkg-name-invalid", "invalid package name: " + name);
	const store = deps.readStore();
	if (store.watch.some((w) => w.name === name)) throw new NpmError("watch-duplicate", "already watched: " + name);
	const d = npmDeps(deps);
	const tags = await fetchDistTags(d, name);
	const latest = typeof tags.latest === "string" ? tags.latest : "";
	let day = 0;
	let week = 0;
	let daily;
	try {
		const data = entryDataFromRange(await fetchDailyRange(d, name, "last-week"));
		day = data.day;
		week = data.week;
		daily = data.daily;
	} catch {}
	const entry = {
		name,
		addedAt: Date.now(),
		lastCheckAt: Date.now(),
		lastVersion: latest,
		lastDay: day,
		lastWeek: week,
		daily
	};
	store.watch.push(entry);
	pushSnapshot(store, name, {
		latest,
		day,
		week,
		note: "init"
	});
	await deps.writeStore(store);
	return {
		watch: store.watch.map((w) => ({ ...w })),
		entry: { ...entry }
	};
}
async function opWatchRemove(deps, rawPkg) {
	const name = normalizePkgName(String(rawPkg || ""));
	const store = deps.readStore();
	const before = store.watch.length;
	store.watch = store.watch.filter((w) => w.name !== name);
	delete store.snapshots[name];
	if (store.watch.length === before) throw new NpmError("watch-missing", "not watched: " + name);
	await deps.writeStore(store);
	return { watch: store.watch.map((w) => ({ ...w })) };
}
async function opWatchSeen(deps, rawPkg) {
	const store = deps.readStore();
	let dirty = false;
	for (const w of store.watch) if (w.hasNewVersion === true && (rawPkg === void 0 || rawPkg === "" || normalizePkgName(String(rawPkg)) === w.name)) {
		w.hasNewVersion = false;
		dirty = true;
	}
	if (dirty) await deps.writeStore(store);
	return { watch: store.watch.map((w) => ({ ...w })) };
}
/**
* watchRefresh：刷新一个（req.pkg）或全部监控包。
* @returns 最新列表 + 本次发现的版本变更（changes）。
*/
async function opWatchRefresh(deps, rawPkg) {
	const store = deps.readStore();
	const targets = rawPkg !== void 0 && String(rawPkg).trim() !== "" ? store.watch.filter((w) => w.name === normalizePkgName(String(rawPkg))) : store.watch.slice();
	const checkedAt = Date.now();
	const changes = [];
	if (targets.length === 0) return {
		watch: store.watch.map((w) => ({ ...w })),
		changes,
		checkedAt
	};
	const d = npmDeps(deps);
	const [tagResults, rangeResults] = await Promise.all([Promise.all(targets.map(async (w) => {
		try {
			return {
				name: w.name,
				tags: await fetchDistTags(d, w.name),
				error: void 0
			};
		} catch (e) {
			return {
				name: w.name,
				tags: void 0,
				error: e.message || String(e)
			};
		}
	})), Promise.all(targets.map(async (w) => {
		try {
			return {
				name: w.name,
				data: entryDataFromRange(await fetchDailyRange(d, w.name, "last-week"))
			};
		} catch {
			return {
				name: w.name,
				data: void 0
			};
		}
	}))]);
	for (const w of targets) {
		const tagHit = tagResults.find((t) => t.name === w.name);
		const rangeHit = rangeResults.find((r) => r.name === w.name);
		if (tagHit && tagHit.error !== void 0) {
			w.error = tagHit.error;
			continue;
		}
		const latest = tagHit && tagHit.tags && typeof tagHit.tags.latest === "string" ? tagHit.tags.latest : w.lastVersion;
		const day = rangeHit !== void 0 && rangeHit.data !== void 0 ? rangeHit.data.day : w.lastDay ?? 0;
		const week = rangeHit !== void 0 && rangeHit.data !== void 0 ? rangeHit.data.week : w.lastWeek ?? 0;
		const daily = rangeHit !== void 0 && rangeHit.data !== void 0 ? rangeHit.data.daily : void 0;
		const prevDay = w.lastDay;
		const prevWeek = w.lastWeek;
		w.prevDay = prevDay;
		w.prevWeek = prevWeek;
		w.lastCheckAt = checkedAt;
		w.lastDay = day;
		w.lastWeek = week;
		if (daily !== void 0) w.daily = daily;
		w.error = void 0;
		if (latest !== void 0 && latest !== w.lastVersion) {
			const from = w.lastVersion ?? "";
			w.lastVersion = latest;
			w.hasNewVersion = true;
			pushSnapshot(store, w.name, {
				latest,
				day,
				week,
				note: "version-change"
			});
			if (from) changes.push({
				name: w.name,
				from,
				to: latest
			});
		}
	}
	await deps.writeStore(store);
	return {
		watch: store.watch.map((w) => ({ ...w })),
		changes,
		checkedAt
	};
}
function opHistory(deps, rawPkg) {
	const name = normalizePkgName(String(rawPkg || ""));
	const list = deps.readStore().snapshots[name];
	return {
		pkg: name,
		snapshots: (Array.isArray(list) ? list : []).map((s) => ({
			at: s.at,
			latest: s.latest,
			day: s.day,
			week: s.week,
			note: s.note
		}))
	};
}
async function runOp(deps, req) {
	if (deps.storeReady) await deps.storeReady;
	const op = req && req.op;
	try {
		switch (op) {
			case "config": return {
				ok: true,
				refreshMinutes: deps.refreshMinutes,
				registryUrl: deps.registryUrl
			};
			case "info": return {
				ok: true,
				...await opInfo(deps, String(req.pkg || ""))
			};
			case "downloads": {
				const name = normalizePkgName(String(req.pkg || ""));
				if (!isValidPkgName(name)) throw new NpmError("pkg-name-invalid", "invalid package name: " + name);
				const range = req.range === "last-week" ? "last-week" : "last-month";
				return {
					ok: true,
					pkg: name,
					range,
					...await fetchDailyRange(npmDeps(deps), name, range)
				};
			}
			case "search": return {
				ok: true,
				...await opSearch(deps, String(req.text || ""), typeof req.size === "number" ? req.size : void 0)
			};
			case "watchList": return {
				ok: true,
				...opWatchList(deps)
			};
			case "watchAdd": return {
				ok: true,
				...await opWatchAdd(deps, String(req.pkg || ""))
			};
			case "watchRemove": return {
				ok: true,
				...await opWatchRemove(deps, String(req.pkg || ""))
			};
			case "watchSeen": return {
				ok: true,
				...await opWatchSeen(deps, typeof req.pkg === "string" ? req.pkg : void 0)
			};
			case "watchRefresh": return {
				ok: true,
				...await opWatchRefresh(deps, typeof req.pkg === "string" ? req.pkg : void 0)
			};
			case "history": return {
				ok: true,
				...opHistory(deps, String(req.pkg || ""))
			};
			default: return {
				ok: false,
				code: "unknown-op",
				error: "unknown op: " + String(op)
			};
		}
	} catch (e) {
		const { code, status } = errCodeOf(e);
		return {
			ok: false,
			code: code ?? "op-failed",
			status,
			error: e instanceof Error ? e.message : String(e)
		};
	}
}
//#endregion
//#region src/host/index.ts
const name = "dsh-listen-npm";
const inject = [
	"shell",
	"tools",
	"settings",
	"commands"
];
const Config = Schema.object({
	registryUrl: Schema.string().default("https://registry.npmjs.org").description("npm registry 地址（国内可用 https://registry.npmmirror.com 镜像）"),
	downloadsUrl: Schema.string().default("https://api.npmjs.org/downloads").description("下载量统计 API 地址"),
	refreshMinutes: Schema.number().default(10).description("监控列表自动刷新间隔（分钟）")
});
const API_BODY_LIMIT = 1 << 20;
function writeApiJson(res, status, body) {
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(body));
}
function apply(ctx, config = {}) {
	if (ctx.get("shell") === void 0) return;
	const settings = ctx.get("settings");
	const commands = ctx.get("commands");
	const storeDir = resolveStoreDir(settings?.documentPath);
	const mirror = EMPTY_STORE();
	let storeReady = Promise.resolve();
	storeReady = (async () => {
		try {
			const loaded = await loadStore(storeDir);
			if (loaded !== null) {
				mirror.watch = loaded.watch;
				mirror.snapshots = loaded.snapshots;
			}
		} catch (e) {
			console.warn("[dsh-listen-npm] store init failed, using in-memory only", e instanceof Error ? e.message : String(e));
		}
	})();
	storeReady.catch(() => {});
	const readStore = () => mirror;
	const writeStore = async (data) => {
		await saveStore(storeDir, data);
	};
	const deps = {
		ctx,
		readStore,
		writeStore,
		registryUrl: (config.registryUrl || "https://registry.npmjs.org").replace(/\/+$/, ""),
		downloadsUrl: (config.downloadsUrl || "https://api.npmjs.org/downloads").replace(/\/+$/, ""),
		refreshMinutes: typeof config.refreshMinutes === "number" && config.refreshMinutes > 0 ? config.refreshMinutes : 10,
		storeReady
	};
	const webServer = ctx.get("webServer");
	const webRuntime = ctx.get("webRuntime");
	if (webServer !== void 0) {
		const fence = (headers) => isTrustedApiRequest(headers, webRuntime?.trustedHosts ?? []);
		try {
			webServer.register({
				kind: "exact",
				path: "/dsh-listen-npm/api",
				handler: async (req, res) => {
					if (!fence(req.headers)) {
						writeApiJson(res, 403, {
							ok: false,
							error: {
								code: "forbidden",
								message: "forbidden"
							}
						});
						return;
					}
					if (req.method !== "POST") {
						writeApiJson(res, 405, {
							ok: false,
							error: {
								code: "method-error",
								message: "method not allowed"
							}
						});
						return;
					}
					const chunks = [];
					let total = 0;
					for await (const chunk of req) {
						const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
						total += buffer.length;
						if (total > API_BODY_LIMIT) {
							writeApiJson(res, 413, {
								ok: false,
								error: {
									code: "body-too-large",
									message: "request body too large"
								}
							});
							return;
						}
						chunks.push(buffer);
					}
					const text = Buffer.concat(chunks).toString("utf8");
					let request = { op: "" };
					if (text.trim().length > 0) try {
						request = JSON.parse(text);
					} catch {
						writeApiJson(res, 400, {
							ok: false,
							error: {
								code: "params-invalid",
								message: "Parameters must be JSON"
							}
						});
						return;
					}
					try {
						writeApiJson(res, 200, {
							ok: true,
							value: await runOp(deps, request)
						});
					} catch (e) {
						writeApiJson(res, 200, {
							ok: true,
							value: {
								ok: false,
								code: "op-failed",
								error: e instanceof Error ? e.message : String(e)
							}
						});
					}
				}
			});
		} catch {}
	}
	if (commands !== void 0) commands.register({
		name: "dsh-listen-npm",
		description: "npm 包监控：查询 npm 包信息与每日安装量，管理监控列表。Query npm package info with daily install counts and manage the watch list. 参数为 JSON：{ \"op\": \"config|info|downloads|search|watchList|watchAdd|watchRemove|watchRefresh|watchSeen|history\", ... }。",
		input: { hint: "{\"op\":\"info\",\"pkg\":\"vue\"}" },
		recordInput: true,
		handler: async (invocation) => {
			const raw = (invocation.rawInput ?? "").trim();
			let req = { op: "" };
			if (raw.length > 0) try {
				req = JSON.parse(raw);
			} catch {
				return {
					kind: "error",
					text: JSON.stringify({
						ok: false,
						code: "params-invalid",
						error: "Parameters must be JSON"
					})
				};
			}
			try {
				const payload = await runOp(deps, req);
				return {
					kind: "success",
					text: JSON.stringify(payload)
				};
			} catch (e) {
				return {
					kind: "error",
					text: JSON.stringify({
						ok: false,
						code: "op-failed",
						error: e instanceof Error ? e.message : String(e)
					})
				};
			}
		}
	});
	const fmtInt = (n) => typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("en-US") : "—";
	ctx.tools.register(defineTool({
		name: "dsh_npm_info",
		description: "查询一个 npm 包的完整信息：最新版本、描述、许可证、作者、链接、发布时间、版本总数与昨日/近7天/近30天/近一年下载量。Query full info of an npm package: latest version, description, license, author, links, publish times, and day/week/month/year download counts.",
		parameters: { pkg: {
			type: "string",
			required: true,
			description: "npm 包名，如 vue 或 @vue/core（也接受 npmjs.com/package/... 链接）"
		} },
		output: {
			schema: { type: "string" },
			render: (_args, value) => [{
				type: "text",
				text: String(value)
			}]
		},
		async execute(args) {
			await storeReady;
			const r = await runOp(deps, {
				op: "info",
				pkg: args.pkg
			});
			if (!r.ok) {
				const code = typeof r.code === "string" ? r.code : "op-failed";
				return "查询失败：" + (code === "pkg-not-found" ? "未找到该 npm 包 / package not found" : r.error || code);
			}
			const info = r.info;
			const points = r.points;
			const lines = [];
			lines.push(`${info.name}${info.latest ? "@" + info.latest : ""}${info.license ? "（license: " + info.license + "）" : ""}`);
			if (info.description) lines.push("描述: " + info.description);
			if (info.author) lines.push("作者: " + info.author);
			if (info.homepage) lines.push("主页: " + info.homepage);
			if (info.repository) lines.push("仓库: " + info.repository);
			if (info.keywords && info.keywords.length > 0) lines.push("关键词: " + info.keywords.join(", "));
			const created = info.created ? info.created.slice(0, 10) : "—";
			const modified = info.modified ? info.modified.slice(0, 10) : "—";
			const latestTime = info.latestDetail?.publishTime ? info.latestDetail.publishTime.slice(0, 19).replace("T", " ") : "—";
			lines.push(`发布: 最新版 ${latestTime} · 首次发布 ${created} · 最近更新 ${modified} · 共 ${info.versionsCount ?? "—"} 个版本`);
			lines.push(`下载量: 昨日 ${fmtInt(points.day?.downloads)} · 近7天 ${fmtInt(points.week?.downloads)} · 近30天 ${fmtInt(points.month?.downloads)} · 近一年 ${fmtInt(points.year?.downloads)}`);
			const daily = r.daily || [];
			if (daily.length > 0) {
				const recent = daily.slice(-7).map((p) => `${p.day}=${fmtInt(p.downloads)}`).join(", ");
				lines.push("近 7 天日下载量: " + recent);
			}
			if (info.maintainers && info.maintainers.length > 0) lines.push("维护者: " + info.maintainers.map((m) => m.name || m.email || "").filter(Boolean).join(", "));
			lines.push(`数据源: ${deps.registryUrl} + ${deps.downloadsUrl}`);
			return lines.join("\n");
		}
	}));
	ctx.tools.register(defineTool({
		name: "dsh_npm_downloads",
		description: "查询一个 npm 包的每日下载量（安装量）时间序列，近一周或近一月（日粒度）。Query the daily downloads (install counts) time series of an npm package, last week or last month, day granularity.",
		parameters: {
			pkg: {
				type: "string",
				required: true,
				description: "npm 包名，如 vue 或 @vue/core"
			},
			range: {
				type: "string",
				description: "可选：last-week（默认）或 last-month"
			}
		},
		output: {
			schema: { type: "string" },
			render: (_args, value) => [{
				type: "text",
				text: String(value)
			}]
		},
		async execute(args) {
			await storeReady;
			const range = args.range === "last-month" ? "last-month" : "last-week";
			const r = await runOp(deps, {
				op: "downloads",
				pkg: args.pkg,
				range
			});
			if (!r.ok) {
				const code = typeof r.code === "string" ? r.code : "op-failed";
				return "查询失败：" + (code === "pkg-not-found" ? "未找到该 npm 包 / package not found" : r.error || code);
			}
			const daily = r.downloads || [];
			if (daily.length === 0) return `包 ${String(r.pkg)} 在 ${String(r.start)} ~ ${String(r.end)} 区间内没有下载量数据。`;
			const total = daily.reduce((acc, p) => acc + p.downloads, 0);
			const lines = daily.map((p) => `${p.day}: ${fmtInt(p.downloads)}`);
			return `包 ${String(r.pkg)} 每日下载量（${String(r.start)} ~ ${String(r.end)}，共 ${daily.length} 天，合计 ${fmtInt(total)}）：\n` + lines.join("\n");
		}
	}));
	ctx.tools.register(defineTool({
		name: "dsh_npm_watch",
		description: "管理 npm 包监控列表（本插件持久化，GUI 弹框与自动轮询共用）：添加/移除/列出/立即刷新。Manage the npm watch list persisted by this plugin: add / remove / list / refresh now.",
		parameters: {
			action: {
				type: "string",
				required: true,
				description: "list | add | remove | refresh"
			},
			pkg: {
				type: "string",
				description: "add/remove/refresh 时必填：npm 包名"
			}
		},
		output: {
			schema: { type: "string" },
			render: (_args, value) => [{
				type: "text",
				text: String(value)
			}]
		},
		async execute(args) {
			await storeReady;
			const action = String(args.action || "list");
			if (action === "list") {
				const watch = (await runOp(deps, { op: "watchList" })).watch || [];
				if (watch.length === 0) return "监控列表为空。可用 dsh_npm_watch(action=\"add\", pkg=\"...\") 添加。";
				return "监控列表（" + watch.length + " 个）：\n" + watch.map((w) => `- ${w.name}：latest ${String(w.lastVersion ?? "—")} · 昨日 ${fmtInt(w.lastDay)} · 近7天 ${fmtInt(w.lastWeek)}${w.hasNewVersion ? " · ⚠️ 有新版本" : ""}`).join("\n");
			}
			if (action === "add") {
				const r = await runOp(deps, {
					op: "watchAdd",
					pkg: args.pkg
				});
				if (!r.ok) return r.code === "watch-duplicate" ? `包 ${args.pkg} 已在监控列表中。` : "添加失败：" + String(r.error || r.code);
				return `已加入监控：${String(r.entry.name)}（latest ${String(r.entry.lastVersion ?? "—")}）。GUI 将按配置间隔自动刷新。`;
			}
			if (action === "remove") {
				const r = await runOp(deps, {
					op: "watchRemove",
					pkg: args.pkg
				});
				if (!r.ok) return "移除失败：" + String(r.error || r.code);
				return "已移出监控：" + String(args.pkg);
			}
			if (action === "refresh") {
				const r = await runOp(deps, {
					op: "watchRefresh",
					pkg: args.pkg
				});
				if (!r.ok) return "刷新失败：" + String(r.error || r.code);
				const changes = r.changes || [];
				if (changes.length === 0) return "刷新完成：所有监控包均无版本变更。";
				return "刷新完成，发现 " + changes.length + " 个版本变更：\n" + changes.map((c) => `- ${c.name}: ${c.from} → ${c.to}`).join("\n");
			}
			return "未知 action：" + action + "（可用 list/add/remove/refresh）";
		}
	}));
}
//#endregion
export { Config, apply, inject, name };
