/**
 * SEO 组件 - 管理页面元数据和SEO优化
 *
 * @description 提供统一的SEO元数据管理，支持动态设置标题、描述、关键词等
 * @author h7ml <h7ml@qq.com>
 * @version 1.0.0
 * @license MIT
 * @homepage https://github.com/h7ml/weread
 * @created 2025-08-15
 */

import { Head } from "$fresh/runtime.ts";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "book" | "profile";
  siteName?: string;
  locale?: string;
  robots?: string;
  canonical?: string;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  jsonLd?: Record<string, any>;
}

const defaultSEO: Required<Omit<SEOProps, "jsonLd">> = {
  title: "微信读书 Web - 现代化在线阅读平台",
  description: "基于 Fresh (Deno) 构建的微信读书 Web 阅读应用，提供现代化阅读界面、高级 TTS 功能和完整的用户管理系统。支持章节导航、进度跟踪、笔记管理等功能。",
  keywords: "微信读书,在线阅读,电子书,TTS,语音朗读,阅读器,Fresh,Deno,Web应用",
  author: "h7ml",
  image: "/logo.svg",
  url: "https://webook.linuxcloudlab.com",
  type: "website",
  siteName: "微信读书 Web",
  locale: "zh_CN",
  robots: "index, follow",
  canonical: "",
  twitterCard: "summary_large_image",
};

export default function SEO(props: SEOProps) {
  const seo = { ...defaultSEO, ...props };
  const fullTitle = seo.title === defaultSEO.title 
    ? seo.title 
    : `${seo.title} | ${defaultSEO.siteName}`;
  
  const imageUrl = seo.image.startsWith('http') 
    ? seo.image 
    : `${seo.url}${seo.image}`;
  
  const canonicalUrl = seo.canonical || seo.url;

  return (
    <Head>
      {/* 基础 Meta 标签 */}
      <title>{fullTitle}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      <meta name="author" content={seo.author} />
      <meta name="robots" content={seo.robots} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph 标签 */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:type" content={seo.type} />
      <meta property="og:site_name" content={seo.siteName} />
      <meta property="og:locale" content={seo.locale} />
      
      {/* Twitter Card 标签 */}
      <meta name="twitter:card" content={seo.twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={imageUrl} />
      
      {/* 额外的 Meta 标签 */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#3b82f6" />
      
      {/* Structured Data (JSON-LD) */}
      {props.jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(props.jsonLd),
          }}
        />
      )}
    </Head>
  );
}

// 预定义的 SEO 配置
export const seoConfigs = {
  home: {
    title: "首页",
    description: "微信读书 Web 阅读平台首页，探索丰富的电子书资源，享受现代化阅读体验。",
    type: "website" as const,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "微信读书 Web",
      description: "现代化在线阅读平台",
      url: "https://webook.linuxcloudlab.com",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://webook.linuxcloudlab.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  },
  
  book: (bookTitle: string, bookAuthor: string, bookCover?: string) => ({
    title: bookTitle,
    description: `阅读《${bookTitle}》- 作者：${bookAuthor}。在微信读书 Web 平台享受优质的阅读体验。`,
    keywords: `${bookTitle},${bookAuthor},电子书,在线阅读`,
    type: "book" as const,
    image: bookCover || "/logo.svg",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Book",
      name: bookTitle,
      author: {
        "@type": "Person",
        name: bookAuthor
      },
      description: `《${bookTitle}》- 作者：${bookAuthor}`,
      image: bookCover
    }
  }),
  
  reader: (bookTitle: string, chapterTitle: string) => ({
    title: `${chapterTitle} - ${bookTitle}`,
    description: `正在阅读《${bookTitle}》的章节：${chapterTitle}。使用微信读书 Web 阅读器，支持TTS语音朗读。`,
    type: "article" as const,
    robots: "noindex, follow",
  }),
  
  dashboard: {
    title: "阅读统计",
    description: "查看您的个人阅读统计数据，包括阅读时长、书籍数量、阅读习惯分析等。",
    type: "profile" as const,
    robots: "noindex, follow",
  },
  
  notes: {
    title: "我的笔记",
    description: "管理您的阅读笔记、书签和书评，记录阅读心得和重要片段。",
    type: "profile" as const,
    robots: "noindex, follow",
  },
  
  search: (query?: string) => ({
    title: query ? `搜索: ${query}` : "图书搜索",
    description: query 
      ? `搜索"${query}"的相关图书和内容，发现更多优质阅读资源。`
      : "搜索图书、作者和内容，发现您感兴趣的阅读资源。",
    type: "website" as const,
  }),
  
  profile: {
    title: "个人中心",
    description: "管理您的个人信息、阅读偏好和账户设置。",
    type: "profile" as const,
    robots: "noindex, follow",
  },
  
  shelf: {
    title: "我的书架",
    description: "管理您的个人图书收藏，整理和查看已收藏的图书。",
    type: "profile" as const,
    robots: "noindex, follow",
  }
};
