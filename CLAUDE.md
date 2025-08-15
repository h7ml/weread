# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 开发命令

**开发服务器:**

```bash
deno task dev
```

在端口 8888（或 PORT 环境变量）启动带热重载的开发服务器。使用 unstable KV
和定时任务特性。

**代码质量:**

```bash
deno task check     # 格式化和检查
deno task check-types    # 仅类型检查
deno task check-all      # 完整检查（格式、lint、类型）
deno fmt                 # 仅格式化代码
deno lint                # 仅检查代码
```

**构建与部署:**

```bash
deno task build    # 生产环境构建
deno task start    # 启动生产服务器
deno task preview  # 预览生产版本
```

**更新:**

```bash
deno task update   # 更新 Fresh 框架
```

## 架构概览

这是一个使用 Fresh (Deno) 构建的**微信读书 Web
阅读应用**，具有现代化阅读界面、高级 TTS 功能和完整的用户管理系统。

### 技术栈

- **框架:** Fresh 1.7.3 (基于 Deno 的类 React SSR 框架)
- **前端:** Preact 10.22.0 与 Signals 状态管理
- **样式:** TailwindCSS 3.4.0 配合 PostCSS
- **后端:** Deno 配合 unstable KV 存储和定时任务
- **文本转语音:** 多引擎 TTS (OpenXing + t.leftsite.cn + 浏览器回退)
- **包管理:** ESM imports，无需 npm

### 核心功能模块

**页面路由 (`routes/`):**

- **主页面:** `index.tsx`, `dashboard.tsx`, `notes.tsx`, `search.tsx`,
  `profile.tsx`
- **图书相关:** `book/[id].tsx`, `reader/[bookId]/[chapterUid].tsx`, `shelf.tsx`
- **用户认证:** `login.tsx`
- **API 端点:** 完整的 RESTful API 设计

**交互组件 (`islands/`):**

- **阅读器:** `WeReadStyleReaderComponent.tsx` - 核心阅读体验
- **功能组件:** `DashboardComponent.tsx`, `NotesComponent.tsx`,
  `SearchComponent.tsx`
- **用户管理:** `ProfileComponent.tsx`, `LoginComponent.tsx`
- **数据管理:** `ProgressSyncComponent.tsx`, `ShelfComponent.tsx`

**API 服务层 (`src/apis/`):**

- **微信读书集成:** `src/apis/web/` - 完整的微信读书服务封装
- **核心服务:** 图书、用户、笔记、搜索、统计分析
- **新增服务:** 阅读统计、个人档案、多媒体处理

**数据存储 (`src/kv/`):**

- **用户会话:** `credential.ts` - 登录凭证管理
- **应用设置:** `setting.ts` - 用户偏好设置
- **系统日志:** `systemLog.ts` - 操作记录
- **任务管理:** `task.ts` - 后台任务调度

### 核心功能特性

**阅读器系统 (`islands/WeReadStyleReaderComponent.tsx`):**

- 功能完整的电子书阅读器，支持章节导航和进度跟踪
- 高级 TTS 系统，三引擎支持（OpenXing + t.leftsite.cn + 浏览器 WebSpeech）
- 可视化进度跟踪、句子高亮、自动滚动
- 主题系统（多种阅读主题和字体设置）
- 通过 localStorage 和 KV 持久化设置

**用户管理系统:**

- **个人中心 (`routes/profile.tsx`, `islands/ProfileComponent.tsx`)** -
  个人信息管理
- **登录认证 (`routes/login.tsx`, `islands/LoginComponent.tsx`)** -
  微信读书账号集成
- **进度同步 (`islands/ProgressSyncComponent.tsx`)** - 跨设备阅读进度同步

**内容管理:**

- **笔记系统 (`routes/notes.tsx`, `islands/NotesComponent.tsx`)** -
  笔记、书签、书评管理
- **搜索功能 (`routes/search.tsx`, `islands/SearchComponent.tsx`)** -
  全文搜索和图书发现
- **书架管理 (`routes/shelf.tsx`, `islands/ShelfComponent.tsx`)** - 个人图书收藏

**数据统计 (`routes/dashboard.tsx`, `islands/DashboardComponent.tsx`):**

- 详细的阅读统计数据和趋势分析
- 个人阅读报告和成就系统
- 阅读热力图和时间分布分析
- 分类统计和作者偏好分析

**TTS 语音系统 (`routes/api/tts/`):**

- **多引擎架构:** OpenXing (主) + t.leftsite.cn (备) + 浏览器 TTS (兜底)
- **智能回退:** 服务不可用时自动降级
- **丰富语音:** 29+ 中文语音选择，支持情感风格
- **高级功能:** 句子级阅读、实时高亮、自动滚动、跨章节连续阅读

### API 端点架构

**图书相关 API:**

- `/api/book/info` - 图书基本信息
- `/api/book/chapters` - 章节列表
- `/api/book/content` - 章节内容（支持解密）

**用户功能 API:**

- `/api/user/profile` - 个人资料管理
- `/api/notes` - 笔记和书评 CRUD
- `/api/progress` - 阅读进度同步
- `/api/stats` - 阅读统计数据

**内容发现 API:**

- `/api/search` - 统一搜索接口，支持全局搜索和搜索建议
  - `?q=关键词&type=mixed` - 混合搜索（默认，包含全局结果和建议）
  - `?q=关键词&type=global` - 仅全局搜索（返回内容片段）
  - `?q=关键词&type=suggest` - 仅搜索建议
  - `?count=10` - 限制返回数量（最大20条）
- `/api/shelf` - 书架管理
- `/api/shelf/manage` - 书架操作（添加/删除）

**语音服务 API:**

- `/api/tts/` - 主 TTS 服务 (t.leftsite.cn)
- `/api/tts/openxing` - OpenXing TTS 服务
- `/api/tts/voices` - 获取可用语音列表
- `/api/tts/openxing-voices` - OpenXing 语音列表

### 配置与环境

**关键环境变量:**

- `PORT` - 服务器端口（默认: 8888）
- `DENO_ENV` - 环境（local/development/production）
- `KV_NAMESPACE` - Deno KV 命名空间
- `LOG_LEVEL` - 日志级别
- 微信读书 API 设置、邮件/推送通知、定时任务计划

**路径别名 (Import Map):**

- `@/utils` → `src/utils/mod.ts`
- `@/apis` → `src/apis/mod.ts`
- `@/kv` → `src/kv/mod.ts`
- `@/cron` → `src/cron/mod.ts`
- `@/config` → `src/config.ts`
- `@/types` → `src/types/mod.ts`

**项目依赖:**

- Fresh 1.7.3 - SSR 框架
- Preact 10.22.0 - UI 组件
- @preact/signals 1.2.2 - 状态管理
- crypto-js 4.2.0 - 加密解密
- xss 1.0.14 - XSS 防护
- parse5 7.1.2 - HTML 解析

### 内容安全与解密

应用通过以下方式处理微信读书的内容保护:

- **请求签名:** `src/utils/` 中的复杂签名系统
- **内容解密:** 受保护内容的专有解密
- **会话管理:** 基于 Cookie 的认证，使用 KV 存储

### TTS 实现细节

**多引擎架构:**

1. **OpenXing TTS (主):** 通过 `tts.openxing.top` 的高质量语音合成
2. **t.leftsite.cn TTS (备):** 备用云语音服务
3. **浏览器 TTS (兜底):** Web Speech API 回退
4. **智能检测:** 自动服务可用性检查和故障转移

**功能特性:**

- 句子级阅读，带可视化高亮
- 实时进度跟踪，带动画进度条
- 自动滚动，可配置速度和平滑滚动
- 跨章节连续阅读
- 29+ 中文语音选择，支持性别和风格选项
- 文本长度限制（1000 字符）和超时控制（30 秒）

### 开发注意事项

**代码质量保证:** 提交前始终运行 `deno task check-all` - 此项目使用严格的
TypeScript 配置。

**使用 KV 存储:** 使用 `@/kv` 模块进行数据持久化。KV
系统处理用户凭证、应用设置、系统日志和后台任务。

**TTS 开发测试:**

- 测试 OpenXing TTS:
  `curl -X POST "http://localhost:8888/api/tts/openxing" -H "Content-Type: application/json" -d '{"text":"测试","voice":"Dylan"}'`
- 测试主 TTS:
  `curl "http://localhost:8888/api/tts?t=测试&v=zh-CN-XiaoxiaoNeural"`
- 获取语音列表: `curl "http://localhost:8888/api/tts/voices"`
- 外部服务依赖: 监控 `tts.openxing.top` 和 `t.leftsite.cn` 可用性

**Fresh Islands 开发:** 交互组件放在 `islands/` 中并自动水合。使用 Preact
Signals 进行跨组件状态管理。

**API 开发规范:**

- 所有 API 支持 CORS
- 使用统一的错误处理格式
- 支持 token 认证（URL 参数或 Authorization header）
- 遵循 RESTful 设计原则

**新增功能说明:**

- **统计分析:** 完整的阅读数据分析和可视化
- **多 TTS 引擎:** 提高语音服务可用性和质量
- **用户系统:** 完善的个人中心和偏好设置
- **内容搜索:** 全文检索和智能推荐
