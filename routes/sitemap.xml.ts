/**
 * Sitemap API - 生成网站地图
 *
 * @description 动态生成网站的 XML sitemap
 * @author h7ml <h7ml@qq.com>
 * @version 1.0.0
 * @license MIT
 * @homepage https://github.com/h7ml/weread
 * @created 2025-08-15
 */

import { FreshContext } from "$fresh/server.ts";

// 静态页面配置
const staticPages = [
  {
    url: "/",
    changefreq: "daily" as const,
    priority: 1.0,
    lastmod: new Date().toISOString()
  },
  {
    url: "/search",
    changefreq: "weekly" as const,
    priority: 0.8,
    lastmod: new Date().toISOString()
  }
];

// 生成 XML sitemap
function generateSitemap(baseUrl: string, pages: typeof staticPages): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  
  return xml;
}

export const handler = {
  GET(req: Request, _ctx: FreshContext): Response {
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    try {
      // 可以在这里添加动态页面（如图书详情页）
      // 例如：从数据库获取热门图书并添加到sitemap中
      
      const sitemap = generateSitemap(baseUrl, staticPages);
      
      return new Response(sitemap, {
        status: 200,
        headers: {
          "Content-Type": "application/xml",
          "Cache-Control": "public, max-age=3600", // 缓存1小时
        },
      });
      
    } catch (error) {
      console.error("生成 sitemap 失败:", error);
      
      return new Response("Internal Server Error", {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }
  },
};