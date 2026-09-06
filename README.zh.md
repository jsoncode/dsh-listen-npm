# dsh-listen-npm

<p align="center">
  <img src="assets/logo.svg" alt="dsh-listen-npm logo" width="72" />
</p>

**dsh-listen-npm** 是基于 DeepSeek Harness（DSH）宿主的 npm 包监控插件。
查询任意 npm 包的完整信息 —— **突出显示每日安装量** —— 并监控自己指定的
npm 库的版本与下载量变化。

- **完整包信息**：最新版本、dist-tags、描述、许可证、作者、维护者、链接、
  发布时间、版本列表、依赖、README 摘要
- **每日安装量**：昨日 / 近 7 天 / 近 30 天 / 近一年下载量汇总 + 近 30 天
  日粒度柱状图（日粒度数据直接来自官方 `api.npmjs.org/downloads/range` 接口）
- **监控列表**：加入监控后插件按配置间隔自动轮询，记录快照、标记新版本
  （footer 徽标提醒）、展示下载量趋势
- **模型工具**：`dsh_npm_info`、`dsh_npm_downloads`、`dsh_npm_watch`
- **中英双语**：界面跟随主界面语言切换

[English](README.md)

## 预览

侧边栏底部有常驻 **npm 监控** 按钮（右侧小胶囊显示监控数量与「有更新」提醒）。
弹框含三个 tab：**查询**（搜索 + 完整详情）、**监控**、**历史**。

## 功能

- **查询 tab** —— 输入包名（也支持粘贴 npmjs.com 链接）：registry 搜索接口
  防抖联想，回车 / 点击展示完整详情：
  - 下载量卡片：**昨日 / 近 7 天 / 近 30 天 / 近一年**（昨日为主焦点），
    附 30 天日安装量柱状图（峰值标注、日均虚线、每柱原生 tooltip）
  - 基本信息：首次发布、最近更新、最新版发布（含发布者）、版本总数、
    解包大小、文件数、Node 要求、维护者
  - dist-tags 标签、依赖（deps / peer / dev）、最近版本列表、README 摘要
  - 一键 **加入监控**
- **监控 tab** —— 添加 / 移除监控；每行显示 latest 版本（变更时带 NEW 徽标）、
  昨日 / 近 7 天下载量（与上个快照对比的趋势箭头）、上次刷新时间
- **历史 tab** —— 每个包的快照时间线（加入监控与版本变更时自动记录）：
  时间、版本、昨日 / 近 7 天下载量、变更类型
- **后台轮询** —— 轮询器与弹框生命周期解耦；每 `refreshMinutes`（宿主配置，
  默认 10 分钟）刷新整个监控列表：每包 1 个轻量 `dist-tags` 请求 + 全列表
  共 2 个批量下载量请求；发现新版本点亮 footer 琥珀色徽标，查看后消失
- **数据文件** —— 监控列表与快照持久化到
  `$DSH_HOME/dsh-listen-npm.json`（原子写，损坏自动 .bak）
- **HTTP API** —— 浏览器半边经 `/dsh-listen-npm/api`（信任围栏 +
  POST JSON）通信，轮询不会在会话中产生 command 节点；老宿主自动回退命令通道
- **模型工具** —— `dsh_npm_info` / `dsh_npm_downloads` / `dsh_npm_watch`
  （list / add / remove / refresh）

## 配置（宿主 config）

```yaml
registryUrl: https://registry.npmjs.org   # 国内可换镜像 https://registry.npmmirror.com
downloadsUrl: https://api.npmjs.org/downloads
refreshMinutes: 10                        # 监控列表自动刷新间隔（分钟）
```

## 数据说明

- 日粒度数据来自 `api.npmjs.org/downloads/range`；npm 按自然日聚合下载量且
  有 T+1 延迟，「昨日」指 npm 已发布的最后一个完整自然日。
- 完整支持 scoped 包（`@scope/name`）；registry 路径把斜杠编码为 `%2F`，
  下载量 API 使用原始斜杠（实测两种服务接受形式不同）。
- 查询详情时拉一次 registry 全量文档（react 约 7 MB）—— curl 收集上限 32 MB。

## 文件结构

```
├── src/host/*.ts         # 宿主半边源码：index.ts（入口）、npm.ts（curl 核心）、ops.ts（op 分发）、store.ts、fence.ts、types.ts
├── src/client/*.tsx      # 浏览器半边源码（React TSX）：plugin.tsx、i18n、styles、rpc、store、poller、components/*
├── lib/index.js          # 宿主半边构建产物（tsdown，ESM），提交 git 以支持 git 安装
├── lib/client.js         # 浏览器半边构建产物（tsdown → __ModuleLoader__ 工厂），提交 git
├── lib/types/            # 类型声明（tsc -b 生成）
├── scripts/              # verify-client.mjs（模拟宿主 seed 表校验产物）
├── tsdown.config.ts      # tsdown 构建配置（node half + client bundle banner 包装）
├── tsconfig.json         # solution：引用 tsconfig.host.json / tsconfig.client.json
├── cordis.patch.yml      # 组合包 patch：按包名引用插件行（无路径）
├── package.json          # dsh.bundle + dsh.client(web) manifest + peerDependencies
├── README.md             # 英文文档（默认）
└── README.zh.md          # 本文档
```

## 安装

```sh
# 本地开发
dsh plugin --profile web add ./dsh-listen-npm

# 发布后：npm / tarball / GitHub
dsh plugin --profile web add dsh-listen-npm
dsh plugin --profile web add ./dsh-listen-npm-0.1.0.tgz
dsh plugin --profile web add github:you/dsh-listen-npm#<sha>

dsh --profile web --dump-config   # 验证配置层
dsh --profile web                 # 启动（宿主半边需重启才生效）
```

> **本地开发依赖**：宿主加载 `index.js` 时按 Node 原生 ESM 解析
> `@deepseek-ai/schemastery`、`@deepseek-ai/dsh-tools`、`@deepseek-ai/dsh-settings`，
> 因此插件目录内必须有可解析的 `node_modules`（已被 `.gitignore` 忽略）。
> 两种做法任选其一：
> 1. 在插件目录执行 `pnpm install`；
> 2. 或把宿主扁平回退目录对应包链接进来：
>    ```powershell
>    New-Item -ItemType Directory "$PWD\node_modules\@deepseek-ai" -Force
>    foreach ($p in 'schemastery','dsh-tools','dsh-settings') {
>      New-Item -ItemType Junction "$PWD\node_modules\@deepseek-ai\$p" -Target "$env:DSH_HOME\profiles\node_modules\@deepseek-ai\$p"
>    }
>    ```

## 构建

```sh
pnpm install
npm run check    # tsc -b（两个 program）
npm run build    # tsc -b && tsdown（lib/index.js + lib/client.js）
npm run verify   # 模拟宿主加载 lib/client.js
```

## License

MIT
