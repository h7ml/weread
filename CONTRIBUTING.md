# 贡献指南

感谢您对微信读书 Web 阅读应用的关注和贡献！本指南将帮助您了解如何参与项目开发。

## 🌟 如何贡献

我们欢迎以下类型的贡献：

- 🐛 **Bug 报告**：发现问题请提交详细的 Issue
- 💡 **功能建议**：有好的想法请分享给我们
- 🔧 **代码贡献**：修复 Bug 或添加新功能
- 📚 **文档改进**：完善项目文档和注释
- 🌐 **翻译**：支持项目多语言本地化
- 🎨 **UI/UX 改进**：优化用户界面和体验

## 🚀 快速开始

### 环境准备

1. **安装 Deno**
   ```bash
   # macOS/Linux (使用 curl)
   curl -fsSL https://deno.land/install.sh | sh

   # Windows (使用 PowerShell)
   irm https://deno.land/install.ps1 | iex
   ```

2. **Fork 仓库** 点击 GitHub 页面右上角的 "Fork" 按钮

3. **克隆仓库**
   ```bash
   git clone https://github.com/YOUR_USERNAME/weread.git
   cd weread
   ```

4. **安装依赖并启动**
   ```bash
   # 启动开发服务器
   deno task dev
   ```

### 开发流程

1. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或者修复 Bug
   git checkout -b fix/issue-number
   ```

2. **进行开发**
   - 遵循项目的代码规范
   - 添加必要的测试
   - 更新相关文档

3. **运行质量检查**
   ```bash
   # 格式化代码
   deno fmt

   # 运行 Lint 检查
   deno lint

   # 运行完整检查
   deno task check
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **推送并创建 PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   然后在 GitHub 上创建 Pull Request

## 📝 代码规范

### TypeScript 规范

- 使用严格的 TypeScript 模式
- 为所有函数参数和返回值添加类型注解
- 避免使用 `any` 类型，优先使用具体类型
- 使用接口定义复杂的数据结构

```typescript
// ✅ 好的示例
interface BookInfo {
  id: string;
  title: string;
  author: string;
  publishTime: Date;
}

function getBookInfo(bookId: string): Promise<BookInfo> {
  // 实现...
}

// ❌ 避免的写法
function getBookInfo(bookId: any): any {
  // 实现...
}
```

### 代码风格

- 使用 `deno fmt` 格式化代码
- 遵循 ESLint 规则
- 使用有意义的变量和函数名
- 保持函数简洁，单一职责

### 组件规范

- **Fresh Routes**: 页面组件放在 `routes/` 目录
- **Islands**: 交互组件放在 `islands/` 目录
- **Components**: 可复用组件放在 `components/` 目录
- 使用 Preact + Signals 进行状态管理

```tsx
// ✅ 好的组件示例
import { useSignal } from "@preact/signals";

export default function BookReader() {
  const currentPage = useSignal(1);

  return (
    <div class="book-reader">
      <p>当前页面: {currentPage.value}</p>
    </div>
  );
}
```

## 🧪 测试指南

### 运行测试

```bash
# 运行所有测试
deno test

# 运行特定文件测试
deno test src/utils/

# 带覆盖率的测试
deno test --coverage=coverage/
```

### 编写测试

- 为新功能添加单元测试
- 为 API 端点添加集成测试
- 测试文件命名为 `*.test.ts`

```typescript
// 示例测试文件
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { formatTime } from "./utils.ts";

Deno.test("formatTime formats correctly", () => {
  const result = formatTime(new Date("2024-01-01"));
  assertEquals(result, "2024-01-01");
});
```

## 📋 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交格式

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 提交类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 示例

```bash
git commit -m "feat(reader): add bookmark functionality"
git commit -m "fix(api): resolve TTS service timeout issue"
git commit -m "docs: update installation guide"
```

## 🐛 Bug 报告

提交 Bug 报告时，请包含以下信息：

### Bug 报告模板

```markdown
## Bug 描述

简要描述遇到的问题

## 复现步骤

1. 转到 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## 预期行为

描述您期望发生的行为

## 实际行为

描述实际发生的行为

## 环境信息

- OS: [例如 macOS 14.0]
- 浏览器: [例如 Chrome 120.0]
- Deno 版本: [例如 1.40.0]

## 附加信息

添加任何其他相关信息、截图等
```

## 💡 功能请求

提交功能请求时，请：

1. 详细描述功能需求
2. 说明使用场景
3. 提供可能的实现方案
4. 考虑对现有功能的影响

## 🔍 代码审查

### Pull Request 规范

- 提供清晰的 PR 描述
- 关联相关的 Issue
- 确保所有检查通过
- 响应审查意见

### PR 模板

```markdown
## 变更类型

- [ ] Bug 修复
- [ ] 新功能
- [ ] 重构
- [ ] 文档更新

## 变更描述

描述此 PR 的主要变更

## 测试

- [ ] 已添加测试
- [ ] 所有测试通过
- [ ] 手动测试完成

## 检查清单

- [ ] 代码通过 lint 检查
- [ ] 文档已更新
- [ ] 变更日志已更新
```

## 🎯 开发最佳实践

### 性能优化

- 使用 Fresh Islands 架构减少客户端 JavaScript
- 优化图片和静态资源
- 实施适当的缓存策略
- 监控核心 Web 指标

### 安全考虑

- 验证所有用户输入
- 使用环境变量存储敏感信息
- 实施内容安全策略
- 定期更新依赖项

### 可访问性

- 遵循 WCAG 指南
- 提供键盘导航支持
- 使用语义化 HTML
- 添加适当的 ARIA 标签

## 🤝 社区

### 行为准则

请遵循我们的 [行为准则](CODE_OF_CONDUCT.md)，营造友好的社区环境。

### 获取帮助

- 📖 查看项目文档
- 🐛 在 [GitHub Issues](https://github.com/h7ml/weread/issues) 中搜索类似问题
- 💬 参与 [GitHub Discussions](https://github.com/h7ml/weread/discussions)
- 📧 联系维护者：h7ml@qq.com
- 💬
  微信联系：[扫码添加作者微信](https://tech-5g8h9y7s90510d9e-1253666439.tcloudbaseapp.com/wechat.jpg)

## 📊 贡献者统计

[![contributors](https://contrib.rocks/image?repo=h7ml/weread)](https://github.com/h7ml/weread/graphs/contributors)

感谢所有贡献者的参与！

---

再次感谢您的贡献！如果有任何问题，请随时联系维护者。
