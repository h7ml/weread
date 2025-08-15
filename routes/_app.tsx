import { define } from "../utils.ts";
import PWA from "../components/PWA.tsx";
import Analytics, { GTMBody } from "../components/Analytics.tsx";

// 配置统计工具（可以通过环境变量配置）
const analyticsConfig = {
  // 示例配置，实际使用时应从环境变量读取
  googleAnalytics: Deno.env.get("GA_MEASUREMENT_ID") ? {
    measurementId: Deno.env.get("GA_MEASUREMENT_ID")!,
    debug: Deno.env.get("DENO_ENV") === "development"
  } : undefined,
  
  googleTagManager: Deno.env.get("GTM_CONTAINER_ID") ? {
    containerId: Deno.env.get("GTM_CONTAINER_ID")!
  } : undefined,
  
  baiduAnalytics: Deno.env.get("BAIDU_SITE_ID") ? {
    siteId: Deno.env.get("BAIDU_SITE_ID")!
  } : undefined,
};

export default define.page(function App({ Component, state, url }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* 默认标题，如果页面没有设置的话 */}
        {!state?.title && <title>微信读书 Web - 现代化在线阅读平台</title>}
        
        {/* PWA 组件 - 可通过环境变量控制 */}
        <PWA enabled={Deno.env.get("PWA_ENABLED") !== "false"} />
        
        {/* 统计代码注入 */}
        <Analytics 
          config={analyticsConfig}
          enabled={Deno.env.get("DENO_ENV") === "production"}
          debugMode={Deno.env.get("DENO_ENV") === "development"}
        />
        
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="/reader.css" />
        <link rel="stylesheet" href="/weread-reader.css" />
      </head>
      <body>
        {/* Google Tag Manager Body 标签 */}
        <GTMBody 
          containerId={Deno.env.get("GTM_CONTAINER_ID")}
          enabled={Deno.env.get("DENO_ENV") === "production"}
        />
        
        <Component />
      </body>
    </html>
  );
});
