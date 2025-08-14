# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 开发命令

**开发服务器:**

```bash
deno task dev
```

在端口 8001（或 PORT 环境变量）启动带热重载的开发服务器。使用 unstable KV 和定时任务特性。

**代码质量:**

```bash
deno task check    # 格式化、检查和类型检查
deno fmt           # 仅格式化代码
deno lint          # 仅检查代码
deno check         # 仅类型检查
```

**构建与部署:**

```bash
deno task build    # 生产环境构建
deno task start    # 启动生产服务器
```

**更新:**

```bash
deno task update   # 更新 Fresh 框架
```

## 架构概览

这是一个使用 Fresh (Deno) 构建的**微信读书 Web 阅读应用**，具有现代化阅读界面和高级 TTS 功能。

### 技术栈

- **框架:** Fresh 2.0 (基于 Deno 的类 React SSR 框架)
- **前端:** Preact 与 Signals 状态管理
- **样式:** TailwindCSS 4.x 配合 PostCSS
- **后端:** Deno 配合 unstable KV 存储和定时任务
- **文本转语音:** 外部 TTS 服务集成，浏览器回退

### 核心架构

**MVC 风格结构:**

- **`routes/`** - Fresh 基于文件的路由和 API 端点
- **`islands/`** - 客户端交互组件（水合）
- **`src/apis/`** - 业务逻辑和外部 API 集成
- **`src/types/`** - TypeScript 类型定义
- **`src/utils/`** - 工具函数和助手

**关键集成点:**

- **微信读书 API 集成:** `src/apis/web/` 包含完整的微信读书服务封装
- **KV 存储:** `src/kv/` 管理用户会话、设置和缓存的 Deno KV
- **加密:** `src/utils/decrypt.ts` 和 `src/utils/crypto.ts` 处理微信读书内容解密

### 主要组件

**阅读器界面 (`islands/WeReadStyleReaderComponent.tsx`):**

- 功能完整的电子书阅读器，带章节导航
- 高级 TTS 系统，双引擎支持（浏览器 + 外部云 TTS）
- 可视化进度跟踪、句子高亮、自动滚动
- 主题系统（多种阅读主题）
- 通过 localStorage 和 KV 持久化设置

**TTS 系统 (`routes/api/tts/`):**

- **`/api/tts`** - 代理请求到外部 TTS 服务 (t.leftsite.cn)
- **`/api/tts/voices`** - 提供 29+ 中文语音选择
- 外部服务不可用时智能回退到浏览器 TTS
- 支持 Azure TTS 语音格式和情感风格

**图书管理:**

- **`routes/api/book/`** - 图书信息、章节和内容 API
- **`src/apis/web/book.ts`** - 微信读书 API 集成，支持公开/认证模式
- 受保护章节的内容解密

### 配置与环境

**关键环境变量:**

- `PORT` - 服务器端口（默认: 8888）
- `DENO_ENV` - 环境（local/development/production）
- `KV_NAMESPACE` - Deno KV 命名空间
- `LOG_LEVEL` - 日志级别
- 微信读书 API 设置、邮件/推送通知、定时任务计划

**路径别名:**

- `@/utils` → `src/utils/mod.ts`
- `@/apis` → `src/apis/mod.ts`
- `@/kv` → `src/kv/mod.ts`
- `@/config` → `src/config.ts`
- `@/types` → `src/types/mod.ts`

### 内容安全与解密

应用通过以下方式处理微信读书的内容保护:

- **请求签名:** `src/utils/` 中的复杂签名系统
- **内容解密:** 受保护内容的专有解密
- **会话管理:** 基于 Cookie 的认证，使用 KV 存储

### TTS 实现细节

**双引擎架构:**

1. **外部 TTS:** 通过代理到 t.leftsite.cn 的高质量云语音
2. **浏览器 TTS:** Web Speech API 回退
3. **智能检测:** 自动服务可用性检查
4. **渐进增强:** 外部服务失败时优雅降级

**功能特性:**

- 句子级阅读，带可视化高亮
- 实时进度跟踪，带动画进度条
- 自动滚动，可配置速度和平滑滚动
- 跨章节连续阅读
- 语音选择，支持性别和风格选项

### 开发注意事项

**运行检查/类型检查:**

提交前始终运行 `deno task check` - 此项目使用严格的 TypeScript。

**使用 KV:**

使用 `@/kv` 模块进行数据持久化。KV 系统处理凭证、设置、日志和任务。

**TTS 开发:**

- 测试外部 TTS: `curl "http://localhost:8001/api/tts?t=测试&v=zh-CN-XiaoxiaoNeural"`
- 测试语音列表: `curl "http://localhost:8001/api/tts/voices"`
- 外部服务依赖: 监控 t.leftsite.cn 可用性

**Fresh Islands 模式:**

交互组件放在 `islands/` 中并自动水合。使用 Preact Signals 进行跨组件状态管理。