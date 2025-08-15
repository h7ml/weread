# 微信读书 Web 阅读应用

<div align="center">

[![Deploy](https://github.com/h7ml/weread/actions/workflows/deploy.yml/badge.svg)](https://github.com/h7ml/weread/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-webook.linuxcloudlab.com-blue?style=flat&logo=vercel)](https://webook.linuxcloudlab.com/)
[![Deno Version](https://img.shields.io/badge/Deno-1.40+-black?style=flat&logo=deno)](https://deno.land/)
[![Fresh Version](https://img.shields.io/badge/Fresh-1.7.3-green?style=flat&logo=deno)](https://fresh.deno.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat)](LICENSE)

[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.0-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Preact](https://img.shields.io/badge/Preact-10.22.0-673AB8?style=flat&logo=preact)](https://preactjs.com/)
[![Code Style](https://img.shields.io/badge/Code%20Style-Deno%20fmt-black?style=flat&logo=deno)](https://deno.land/manual/tools/formatter)

[![GitHub Stars](https://img.shields.io/github/stars/h7ml/weread?style=social)](https://github.com/h7ml/weread/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/h7ml/weread?style=social)](https://github.com/h7ml/weread/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/h7ml/weread?style=flat&logo=github)](https://github.com/h7ml/weread/issues)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/h7ml/weread?style=flat&logo=github)](https://github.com/h7ml/weread/commits)

</div>

---

基于 Fresh (Deno) 构建的现代化微信读书 Web 阅读应用，具有高级 TTS
功能和优雅的阅读界面。

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
- ⚠️ **类型检查**：持续优化中（Fresh 1.7.3 兼容性）
- ✅ **部署状态**：正常运行
- 🔄 **持续集成**：GitHub Actions 自动部署

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=h7ml/weread&type=Date)](https://star-history.com/#h7ml/weread&Date)

## 🤝 贡献

我们欢迎任何形式的贡献！请查看 [贡献指南](CONTRIBUTING.md)
了解如何参与项目开发。

### 贡献类型

- 🐛 **Bug 报告**：发现问题请提交 Issue
- 💡 **功能建议**：有好的想法请分享
- 🔧 **代码贡献**：欢迎提交 Pull Request
- 📚 **文档改进**：帮助完善项目文档
- 🌐 **翻译**：支持多语言本地化

### 快速开始贡献

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

### 开发规范

- 使用 `deno task check` 确保代码质量
- 遵循项目的 TypeScript 类型规范
- 提交前运行完整测试
- 保持代码风格一致

## 🏗️ 项目架构

### 技术选型理由

- **Deno**：现代 JavaScript/TypeScript 运行时，内置安全性和工具链
- **Fresh**：轻量级全栈框架，零配置 SSR 和 Islands 架构
- **Preact**：React 的轻量级替代品，更小的包体积
- **TailwindCSS**：实用优先的 CSS 框架，开发效率高

### 文件结构说明

```
weread/
├── routes/                 # 基于文件的路由系统
│   ├── api/               # API 端点
│   ├── reader/            # 阅读器相关页面
│   └── _404.tsx           # 自定义 404 页面
├── islands/               # 客户端组件（Islands 架构）
├── src/                   # 核心业务逻辑
│   ├── apis/              # 外部 API 集成
│   ├── kv/                # 数据存储层
│   ├── utils/             # 工具函数
│   └── types/             # 类型定义
├── static/                # 静态资源
├── components/            # 可复用组件
└── docs/                  # 项目文档
```

## 📊 性能指标

- **首屏加载时间**：< 1.5s（LCP）
- **交互延迟**：< 100ms（FID）
- **布局稳定性**：< 0.1（CLS）
- **SEO 友好**：服务端渲染支持

## 🔒 安全特性

- **内容安全策略**：防止 XSS 攻击
- **HTTPS 强制**：所有通信加密传输
- **环境变量管理**：敏感信息安全存储
- **输入验证**：严格的数据校验机制

## 🌐 国际化

项目支持多语言本地化：

- 🇨🇳 **简体中文**（默认）
- 🇺🇸 **English**（计划中）
- 🇯🇵 **日本語**（计划中）

## 📈 路线图

### v1.1.0（开发中）

- [ ] 移动端体验优化
- [ ] 离线阅读支持
- [ ] 阅读统计功能

### v1.2.0（计划中）

- [ ] 多用户支持
- [ ] 阅读笔记功能
- [ ] 社交分享功能

### v2.0.0（长期目标）

- [ ] 跨平台客户端
- [ ] AI 推荐系统
- [ ] 实时协作功能

## 🆘 支持

遇到问题？我们提供多种支持方式：

- 📖 **文档**：查看 [项目文档](docs/)
- 🐛 **Issue**：[GitHub Issues](https://github.com/h7ml/weread/issues)
- 💬 **讨论**：[GitHub Discussions](https://github.com/h7ml/weread/discussions)
- 📧 **邮件**：h7ml@qq.com
- 💬
  **微信**：[联系作者](https://tech-5g8h9y7s90510d9e-1253666439.tcloudbaseapp.com/wechat.jpg)

## 👤 作者

- **姓名**：h7ml
- **邮箱**：h7ml@qq.com
- **GitHub**：[@h7ml](https://github.com/h7ml)
- **微信**：[扫码添加](https://tech-5g8h9y7s90510d9e-1253666439.tcloudbaseapp.com/wechat.jpg)

<div align="center">
  <img src="https://tech-5g8h9y7s90510d9e-1253666439.tcloudbaseapp.com/wechat.jpg" alt="微信二维码" width="200" height="200">
  <p><em>扫描二维码添加作者微信</em></p>
</div>

## 🙏 致谢

感谢以下优秀的开源项目：

- [Deno](https://deno.land/) - 现代 JavaScript 运行时
- [Fresh](https://fresh.deno.dev/) - 全栈 Web 框架
- [Preact](https://preactjs.com/) - 快速 React 替代方案
- [TailwindCSS](https://tailwindcss.com/) - 实用优先 CSS 框架

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) 开源。

---

<div align="center">

**[⭐ 给个 Star](https://github.com/h7ml/weread/stargazers) |
[🍴 Fork 项目](https://github.com/h7ml/weread/fork) |
[💞 赞助开发](https://github.com/sponsors/h7ml)**

Made with ❤️ by [h7ml](https://github.com/h7ml) and
[contributors](https://github.com/h7ml/weread/contributors)

</div>
