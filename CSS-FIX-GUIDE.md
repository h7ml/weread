# CSS样式丢失问题解决方案

## 问题分析

CSS样式在打包发布后丢失的主要原因：

1. **内联样式问题**: Fresh在生产环境下可能不正确处理`dangerouslySetInnerHTML`中的CSS
2. **TailwindCSS purge**: 默认配置可能会purge掉一些动态生成的类名
3. **构建过程问题**: CSS文件在构建时可能没有正确处理

## 解决方案

### 1. 移除内联样式
将所有`dangerouslySetInnerHTML`中的CSS移动到`static/styles.css`文件中：

```javascript
// ❌ 错误做法 - 内联样式
<style dangerouslySetInnerHTML={{
  __html: `
    .glass-card {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(20px);
    }
  `
}} />

// ✅ 正确做法 - 使用CSS类
<div className="glass-card">
```

### 2. 配置TailwindCSS safelist
在`tailwind.config.ts`中添加safelist，防止重要类被purge：

```typescript
export default {
  safelist: [
    'animate-fadeIn',
    'animate-scaleIn', 
    'glass-card',
    'stat-card-hover',
    // ... 其他重要类
  ],
  // ...
}
```

### 3. 更新构建脚本
确保构建时正确处理CSS：

```json
{
  "tasks": {
    "build": "deno run -A dev.ts build && deno run -A npm:tailwindcss@3.4.0 -i ./static/styles.css -o ./static/styles.css --minify"
  }
}
```

### 4. 验证CSS文件
部署前检查`static/styles.css`是否包含所有必要的样式。

## 部署检查清单

- [ ] 移除所有`dangerouslySetInnerHTML`中的CSS
- [ ] 将自定义样式添加到`static/styles.css`
- [ ] 配置TailwindCSS safelist
- [ ] 运行`deno task build`测试构建
- [ ] 检查生成的CSS文件大小和内容
- [ ] 在生产环境测试样式显示

## 常见问题

### Q: 为什么开发环境正常，生产环境样式丢失？
A: Fresh在生产环境下的CSR行为与开发环境不同，内联样式可能无法正确注入。

### Q: TailwindCSS类名被purge了怎么办？
A: 使用safelist或确保类名在content路径的文件中被正确识别。

### Q: 动画不工作怎么办？
A: 确保@keyframes定义在CSS文件中，而不是内联样式中。

## 技术实现

已修复的文件：
- `islands/LoginComponent.tsx` - 移除内联动画样式
- `islands/ProfileComponent.tsx` - 移除内联glass-card样式  
- `components/Navigation.tsx` - 移除内联媒体查询
- `tailwind.config.ts` - 添加safelist和扩展配置
- `static/styles.css` - 添加所有自定义样式
- `deno.json` - 更新构建脚本