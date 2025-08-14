# 微信读书 Web 阅读应用

基于 Fresh (Deno) 构建的现代化微信读书 Web 阅读应用，具有高级 TTS 功能和优雅的阅读界面。

## 🚀 特性

### 📚 阅读体验
- **完整的电子书阅读器**：支持章节导航、阅读进度跟踪
- **多种阅读主题**：护眼模式、夜间模式等
- **响应式设计**：适配桌面端和移动端

### 🔊 高级 TTS 系统
- **双引擎支持**：外部云 TTS + 浏览器 Web Speech API 回退
- **29+ 中文语音**：支持多种音色和情感风格
- **智能功能**：
  - 句子级阅读和可视化高亮
  - 实时进度跟踪和动画进度条
  - 自动滚动，可配置速度和平滑度
  - 跨章节连续阅读

### 🔐 微信读书集成
- **完整 API 集成**：支持公开和认证模式
- **内容解密**：处理受保护的章节内容
- **会话管理**：基于 Cookie 的认证和 KV 存储

### 🛠️ 技术栈
- **框架**：Fresh 2.0 (Deno 全栈框架)
- **前端**：Preact + Signals 状态管理
- **样式**：TailwindCSS 4.x + PostCSS
- **后端**：Deno + KV 存储 + 定时任务
- **TTS**：外部服务集成 + 浏览器回退

## 📦 安装和使用

### 环境要求
- [Deno](https://docs.deno.com/runtime/getting_started/installation) 最新版本

### 开发模式
```bash
# 启动开发服务器（热重载）
deno task dev
```
服务将在 http://localhost:8001 启动（或 PORT 环境变量指定的端口）

### 代码质量检查
```bash
# 格式检查 + Lint 检查（推荐日常使用）
deno task check

# 仅类型检查
deno task check-types  

# 完整检查（格式 + Lint + 类型）
deno task check-all

# 格式化代码
deno fmt

# 仅 Lint 检查
deno lint
```

### 生产部署
```bash
# 构建生产版本
deno task build

# 启动生产服务器
deno task start
```

### 更新框架
```bash
# 更新 Fresh 框架
deno task update
```

## 🗂️ 项目结构

```
weread/
├── routes/                 # Fresh 基于文件的路由
│   ├── api/               # API 端点
│   │   ├── book/          # 书籍相关 API
│   │   ├── tts/           # TTS 相关 API
│   │   └── login/         # 登录相关 API
│   └── reader/            # 阅读器页面
├── islands/               # 客户端交互组件（水合）
├── src/
│   ├── apis/              # 业务逻辑和外部 API 集成
│   │   └── web/           # 微信读书 API 封装
│   ├── kv/                # Deno KV 数据操作
│   ├── utils/             # 工具函数和助手
│   └── types/             # TypeScript 类型定义
├── static/                # 静态资源
└── components/            # 可复用组件
```

## 🔧 配置

### 环境变量
```bash
PORT=8888                  # 服务端口（默认：8888）
DENO_ENV=production        # 环境（local/development/production）
KV_NAMESPACE=weread        # Deno KV 命名空间
LOG_LEVEL=info             # 日志级别
```

### 路径别名
项目配置了以下路径别名：
- `@/utils` → `src/utils/mod.ts`
- `@/apis` → `src/apis/mod.ts`
- `@/kv` → `src/kv/mod.ts`
- `@/config` → `src/config.ts`
- `@/types` → `src/types/mod.ts`

## 🎯 核心功能

### TTS API 端点
- `GET /api/tts` - 文本转语音（支持 leftsite 和 openxing 引擎）
- `GET /api/tts/voices` - 获取可用语音列表
- `POST /api/tts/openxing` - OpenXing TTS 专用端点

### 书籍 API 端点
- `GET /api/book/info` - 获取书籍信息
- `GET /api/book/chapters` - 获取章节列表
- `GET /api/book/content` - 获取章节内容

### 阅读器组件
- `WeReadStyleReaderComponent` - 主要的阅读器界面
- `LoginComponent` - 微信读书登录组件
- `HomeComponent` - 主页和书籍浏览

## 🛡️ 安全特性

- **内容解密**：处理微信读书的内容保护
- **请求签名**：复杂的签名系统确保 API 安全
- **会话管理**：安全的用户认证和状态管理

## 📝 开发注意事项

1. **代码质量**：使用 `deno task check` 确保代码格式和 Lint 规范
2. **KV 使用**：通过 `@/kv` 模块进行数据持久化
3. **TTS 开发**：测试外部 TTS 服务可用性
4. **Fresh Islands**：交互组件放在 `islands/` 目录并自动水合

## 📊 项目状态

- ✅ **格式检查**：完全通过
- ✅ **Lint 检查**：完全通过  
- ⚠️ **类型检查**：持续优化中（Fresh 2.0 兼容性）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目！

## 📄 许可证

MIT License